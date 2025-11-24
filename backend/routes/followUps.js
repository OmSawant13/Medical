const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const FollowUp = require('../models/FollowUp');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// @route   POST /api/follow-ups
// @desc    Schedule a follow-up appointment (Doctor)
// @access  Private (Doctor)
router.post('/', [
  auth,
  authorize('doctor'),
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('scheduled_date').isISO8601().withMessage('Valid scheduled date is required'),
  body('reason').optional().trim(),
  body('appointment_id').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { patient_id, scheduled_date, reason, appointment_id } = req.body;

    // Verify patient exists
    const patient = await User.findOne({ user_id: patient_id, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const followUp = new FollowUp({
      patient_id,
      doctor_id: req.user.user_id,
      appointment_id: appointment_id || undefined,
      scheduled_date: new Date(scheduled_date),
      reason: reason || ''
    });

    await followUp.save();

    res.status(201).json({
      success: true,
      follow_up: followUp
    });
  } catch (error) {
    console.error('Create Follow-up Error:', error);
    res.status(500).json({ success: false, message: 'Server error creating follow-up' });
  }
});

// @route   GET /api/follow-ups/doctor
// @desc    Get follow-ups for doctor
// @access  Private (Doctor)
router.get('/doctor', [auth, authorize('doctor')], async (req, res) => {
  try {
    const followUps = await FollowUp.find({ doctor_id: req.user.user_id })
      .sort({ scheduled_date: 1 })
      .populate('patient_id', 'name user_id age gender')
      .populate('appointment_id', 'appointment_id date_time symptoms');

    // Separate upcoming and past
    const now = new Date();
    const upcoming = followUps.filter(fu => new Date(fu.scheduled_date) >= now);
    const past = followUps.filter(fu => new Date(fu.scheduled_date) < now);

    res.json({
      success: true,
      upcoming,
      past
    });
  } catch (error) {
    console.error('Get Follow-ups Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching follow-ups' });
  }
});

// @route   GET /api/follow-ups/patient
// @desc    Get follow-ups for patient
// @access  Private (Patient)
router.get('/patient', [auth, authorize('patient')], async (req, res) => {
  try {
    const followUps = await FollowUp.find({ patient_id: req.user.user_id })
      .sort({ scheduled_date: 1 })
      .populate('doctor_id', 'name user_id specialization')
      .populate('appointment_id', 'appointment_id date_time');

    const now = new Date();
    const upcoming = followUps.filter(fu => new Date(fu.scheduled_date) >= now && fu.status === 'pending');
    const past = followUps.filter(fu => new Date(fu.scheduled_date) < now || fu.status !== 'pending');

    res.json({
      success: true,
      upcoming,
      past
    });
  } catch (error) {
    console.error('Get Follow-ups Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching follow-ups' });
  }
});

// @route   PATCH /api/follow-ups/:followupId/status
// @desc    Update follow-up status
// @access  Private (Doctor or Patient)
router.patch('/:followupId/status', [
  auth,
  body('status').isIn(['pending', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const followUp = await FollowUp.findOne({ followup_id: req.params.followupId });

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }

    // Check access
    if (req.user.role === 'doctor' && followUp.doctor_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (req.user.role === 'patient' && followUp.patient_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    followUp.status = req.body.status;
    await followUp.save();

    res.json({
      success: true,
      follow_up: followUp
    });
  } catch (error) {
    console.error('Update Follow-up Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating follow-up' });
  }
});

module.exports = router;

