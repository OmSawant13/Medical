const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { generateQRCode, generateQRCodeString } = require('../utils/qrGenerator');
const { logAccessSync } = require('../middleware/accessLogger');
const { asyncHandler, sendErrorResponse, handleValidationError } = require('../utils/errorHandler');
const { APPOINTMENT_STATUS, QR_CODE, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');

// @route   POST /api/appointments
// @desc    Create a new appointment (Patient only)
// @access  Private (Patient)
router.post('/', [
  auth,
  authorize('patient'),
  body('doctor_id').notEmpty().withMessage('Doctor ID is required'),
  body('date_time').custom((value) => {
    if (!value) {
      throw new Error('Date and time is required');
    }
    const date = new Date(value);
    if (!(date instanceof Date) || isNaN(date)) {
      throw new Error('Valid date and time is required');
    }
    return true;
  }),
  body('symptoms').trim().notEmpty().withMessage('Symptoms are required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(handleValidationError(errors));
    }

    const { doctor_id, date_time, symptoms, uploaded_files } = req.body;

    // Verify doctor exists and is verified
    const doctor = await User.findOne({ 
      user_id: doctor_id, 
      role: 'doctor', 
      isVerified: true 
    });
    
    if (!doctor) {
      return sendErrorResponse(res, 404, ERROR_MESSAGES.DOCTOR_NOT_FOUND);
    }

    // Validate appointment date is in future
    const appointmentDate = new Date(date_time);
    if (appointmentDate < new Date()) {
      return sendErrorResponse(res, 400, 'Appointment date must be in the future');
    }

    // Calculate QR code expiry (24 hours after appointment)
    const expiresAt = new Date(appointmentDate.getTime() + QR_CODE.EXPIRY_HOURS * 60 * 60 * 1000);

    // Create appointment
    const appointment = new Appointment({
      patient_id: req.user.user_id,
      doctor_id,
      date_time: appointmentDate,
      symptoms: symptoms.trim(),
      uploaded_files: uploaded_files || [],
      expires_at: expiresAt
    });

    // Save first to generate appointment_id
    await appointment.save();

    // Generate QR code after appointment_id is created
    try {
      const qrData = await generateQRCodeString(appointment.appointment_id);
      appointment.qr_code = qrData;
      await appointment.save();
    } catch (qrError) {
      console.error('QR Code String Generation Error:', qrError);
      // Continue even if QR code generation fails
    }

    // Generate QR code image
    let qrCodeImage = null;
    try {
      qrCodeImage = await generateQRCode(appointment.appointment_id);
    } catch (qrImageError) {
      console.error('QR Code Image Generation Error:', qrImageError);
      // Continue even if QR code image generation fails
    }

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.APPOINTMENT_BOOKED,
      appointment: {
        ...appointment.toObject(),
        qr_code_image: qrCodeImage
      }
    });
  })
);

// @route   GET /api/appointments
// @desc    Get appointments (Patient or Doctor)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'patient') {
      query.patient_id = req.user.user_id;
    } else if (req.user.role === 'doctor') {
      query.doctor_id = req.user.user_id;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const appointments = await Appointment.find(query)
      .sort({ date_time: -1 })
      .limit(50);

    // Convert to plain objects to avoid serialization issues
    const appointmentsList = appointments.map(apt => apt.toObject());
    res.json(appointmentsList);
  } catch (error) {
    console.error('Get Appointments Error:', error);
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

// @route   GET /api/appointments/:appointmentId
// @desc    Get single appointment
// @access  Private
router.get('/:appointmentId', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ appointment_id: req.params.appointmentId });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check access
    if (req.user.role === 'patient' && appointment.patient_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'doctor' && appointment.doctor_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Get Appointment Error:', error);
    res.status(500).json({ message: 'Server error fetching appointment' });
  }
});

// @route   POST /api/appointments/:appointmentId/scan
// @desc    Scan QR code and get appointment details (Doctor/Hospital)
// @access  Private (Doctor/Hospital)
router.post('/:appointmentId/scan', [
  auth,
  authorize('doctor', 'hospital')
], async (req, res) => {
  try {
    const { qr_code } = req.body;
    
    if (!qr_code) {
      return res.status(400).json({ message: 'QR code is required' });
    }

    let qrData;
    try {
      qrData = JSON.parse(qr_code);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    const appointment = await Appointment.findOne({ 
      appointment_id: qrData.appointment_id,
      qr_code: qr_code
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if QR code expired
    if (new Date() > appointment.expires_at || appointment.visit_completed) {
      return res.status(400).json({ message: 'QR code has expired or visit already completed' });
    }

    // Get patient details
    const patient = await User.findOne({ user_id: appointment.patient_id }).select('-password');

    // Log access
    await logAccessSync(
      appointment.patient_id,
      req.user.user_id,
      'scan_qr',
      'appointment',
      appointment.appointment_id,
      req
    );

    res.json({
      appointment,
      patient: {
        user_id: patient.user_id,
        name: patient.name,
        allergies: patient.allergies,
        symptoms: appointment.symptoms
      }
    });
  } catch (error) {
    console.error('Scan QR Error:', error);
    res.status(500).json({ message: 'Server error scanning QR code' });
  }
});

// @route   PATCH /api/appointments/:appointmentId/status
// @desc    Update appointment status (Doctor) - Accept/Reject/Complete
// @access  Private (Doctor)
router.patch('/:appointmentId/status', [
  auth,
  authorize('doctor'),
  body('status').isIn(['accepted', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('rejectionReason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const appointment = await Appointment.findOne({ appointment_id: req.params.appointmentId });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.doctor_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    appointment.status = req.body.status;
    
    if (req.body.status === 'completed') {
      appointment.visit_completed = true;
      appointment.expires_at = new Date(); // QR code expires immediately after visit completion
      appointment.qr_code = null; // Invalidate QR code
    }
    
    if (req.body.status === 'cancelled' && req.body.rejectionReason) {
      appointment.rejectionReason = req.body.rejectionReason;
    }

    await appointment.save();

    res.json({
      success: true,
      appointment: appointment.toObject(),
      message: req.body.status === 'accepted' ? 'Appointment accepted' : 
               req.body.status === 'cancelled' ? 'Appointment rejected' : 
               'Appointment completed'
    });
  } catch (error) {
    console.error('Update Appointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating appointment' });
  }
});

// @route   PATCH /api/appointments/:appointmentId/cancel
// @desc    Cancel appointment (Patient)
// @access  Private (Patient)
router.patch('/:appointmentId/cancel', [
  auth,
  authorize('patient')
], async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ appointment_id: req.params.appointmentId });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patient_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel completed appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({
      success: true,
      appointment: appointment.toObject(),
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel Appointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error cancelling appointment' });
  }
});

// @route   PATCH /api/appointments/:appointmentId/reschedule
// @desc    Reschedule appointment (Patient)
// @access  Private (Patient)
router.patch('/:appointmentId/reschedule', [
  auth,
  authorize('patient'),
  body('date_time').custom((value) => {
    if (!value) {
      throw new Error('Date and time is required');
    }
    const date = new Date(value);
    if (!(date instanceof Date) || isNaN(date)) {
      throw new Error('Valid date and time is required');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const appointment = await Appointment.findOne({ appointment_id: req.params.appointmentId });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patient_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot reschedule completed appointment' });
    }

    const newDateTime = new Date(req.body.date_time);
    appointment.date_time = newDateTime;
    appointment.expires_at = new Date(newDateTime.getTime() + 24 * 60 * 60 * 1000);
    appointment.status = 'pending'; // Reset to pending for doctor approval
    
    // Regenerate QR code
    const { generateQRCodeString } = require('../utils/qrGenerator');
    const qrData = await generateQRCodeString(appointment.appointment_id);
    appointment.qr_code = qrData;

    await appointment.save();

    res.json({
      success: true,
      appointment: appointment.toObject(),
      message: 'Appointment rescheduled successfully'
    });
  } catch (error) {
    console.error('Reschedule Appointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error rescheduling appointment' });
  }
});

module.exports = router;

