const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { auth, authorize } = require('../middleware/auth');
const { generateQRCode } = require('../utils/qrGenerator');

// @route   GET /api/qr/:appointmentId
// @desc    Generate QR code for appointment (Patient)
// @access  Private (Patient)
router.get('/:appointmentId', [auth, authorize('patient')], async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      appointment_id: req.params.appointmentId,
      patient_id: req.user.user_id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if QR code expired
    if (new Date() > appointment.expires_at || appointment.visit_completed) {
      return res.status(400).json({ message: 'QR code has expired or visit completed' });
    }

    // Generate QR code image
    const qrCodeImage = await generateQRCode(appointment.appointment_id);

    res.json({
      qr_code: appointment.qr_code,
      qr_code_image: qrCodeImage,
      expires_at: appointment.expires_at,
      appointment_id: appointment.appointment_id
    });
  } catch (error) {
    console.error('Generate QR Error:', error);
    res.status(500).json({ message: 'Server error generating QR code' });
  }
});

module.exports = router;

