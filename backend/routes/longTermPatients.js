const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const LongTermPatient = require('../models/LongTermPatient');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// @route   POST /api/long-term-patients
// @desc    Add patient to long-term care (Doctor)
// @access  Private (Doctor)
router.post('/', [
  auth,
  authorize('doctor'),
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('reason').optional().trim(),
  body('diagnosis').optional().trim(),
  body('treatment_plan').optional().trim(),
  body('check_frequency').optional().isIn(['daily', 'weekly', 'bi-weekly', 'monthly']),
  body('appointment_id').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { patient_id, reason, diagnosis, treatment_plan, check_frequency, appointment_id } = req.body;

    // Verify patient exists
    const patient = await User.findOne({ user_id: patient_id, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Check if already in long-term care
    const existing = await LongTermPatient.findOne({
      doctor_id: req.user.user_id,
      patient_id: patient_id,
      status: { $in: ['active', 'monitoring'] }
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Patient is already in long-term care' 
      });
    }

    // Calculate next check date based on frequency
    const nextCheckDate = new Date();
    switch (check_frequency || 'daily') {
      case 'daily':
        nextCheckDate.setDate(nextCheckDate.getDate() + 1);
        break;
      case 'weekly':
        nextCheckDate.setDate(nextCheckDate.getDate() + 7);
        break;
      case 'bi-weekly':
        nextCheckDate.setDate(nextCheckDate.getDate() + 14);
        break;
      case 'monthly':
        nextCheckDate.setMonth(nextCheckDate.getMonth() + 1);
        break;
    }

    const longTermPatient = new LongTermPatient({
      doctor_id: req.user.user_id,
      patient_id,
      appointment_id: appointment_id || undefined,
      reason: reason || '',
      diagnosis: diagnosis || '',
      treatment_plan: treatment_plan || '',
      check_frequency: check_frequency || 'daily',
      next_check_date: nextCheckDate
    });

    await longTermPatient.save();

    res.status(201).json({
      success: true,
      longTermPatient: longTermPatient.toObject()
    });
  } catch (error) {
    console.error('Add Long-Term Patient Error:', error);
    res.status(500).json({ success: false, message: 'Server error adding patient to long-term care' });
  }
});

// @route   GET /api/long-term-patients
// @desc    Get long-term patients for doctor
// @access  Private (Doctor)
router.get('/', [auth, authorize('doctor')], async (req, res) => {
  try {
    const { status } = req.query;
    let query = { doctor_id: req.user.user_id };
    
    if (status) {
      query.status = status;
    }

    const longTermPatients = await LongTermPatient.find(query)
      .sort({ next_check_date: 1, createdAt: -1 })
      .limit(100);

    // Populate patient details
    const patientsWithDetails = await Promise.all(
      longTermPatients.map(async (ltp) => {
        const patient = await User.findOne({ user_id: ltp.patient_id })
          .select('name user_id age gender allergies');
        return {
          ...ltp.toObject(),
          patient: patient || { name: 'Unknown', user_id: ltp.patient_id }
        };
      })
    );

    // Separate by status
    const active = patientsWithDetails.filter(p => p.status === 'active');
    const monitoring = patientsWithDetails.filter(p => p.status === 'monitoring');
    const dueForCheck = patientsWithDetails.filter(p => {
      if (p.status !== 'active' && p.status !== 'monitoring') return false;
      return new Date(p.next_check_date) <= new Date();
    });

    res.json({
      success: true,
      total: patientsWithDetails.length,
      active: active.length,
      monitoring: monitoring.length,
      dueForCheck: dueForCheck.length,
      patients: patientsWithDetails,
      dueForCheckToday: dueForCheck
    });
  } catch (error) {
    console.error('Get Long-Term Patients Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching long-term patients' });
  }
});

// @route   GET /api/long-term-patients/:longtermId
// @desc    Get single long-term patient details
// @access  Private (Doctor)
router.get('/:longtermId', [auth, authorize('doctor')], async (req, res) => {
  try {
    const longTermPatient = await LongTermPatient.findOne({ 
      longterm_id: req.params.longtermId,
      doctor_id: req.user.user_id
    });

    if (!longTermPatient) {
      return res.status(404).json({ success: false, message: 'Long-term patient record not found' });
    }

    const patient = await User.findOne({ user_id: longTermPatient.patient_id })
      .select('name user_id age gender allergies chronicConditions ongoingMedications');

    res.json({
      success: true,
      longTermPatient: {
        ...longTermPatient.toObject(),
        patient: patient || { name: 'Unknown', user_id: longTermPatient.patient_id }
      }
    });
  } catch (error) {
    console.error('Get Long-Term Patient Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching patient details' });
  }
});

// @route   POST /api/long-term-patients/:longtermId/notes
// @desc    Add note/check-in for long-term patient (Doctor)
// @access  Private (Doctor)
router.post('/:longtermId/notes', [
  auth,
  authorize('doctor'),
  body('note').trim().notEmpty().withMessage('Note is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const longTermPatient = await LongTermPatient.findOne({ 
      longterm_id: req.params.longtermId,
      doctor_id: req.user.user_id
    });

    if (!longTermPatient) {
      return res.status(404).json({ success: false, message: 'Long-term patient record not found' });
    }

    // Add note
    longTermPatient.notes.push({
      note: req.body.note,
      doctor_id: req.user.user_id
    });

    // Update last check date
    longTermPatient.last_check_date = new Date();

    // Calculate next check date
    const nextCheckDate = new Date();
    switch (longTermPatient.check_frequency) {
      case 'daily':
        nextCheckDate.setDate(nextCheckDate.getDate() + 1);
        break;
      case 'weekly':
        nextCheckDate.setDate(nextCheckDate.getDate() + 7);
        break;
      case 'bi-weekly':
        nextCheckDate.setDate(nextCheckDate.getDate() + 14);
        break;
      case 'monthly':
        nextCheckDate.setMonth(nextCheckDate.getMonth() + 1);
        break;
    }
    longTermPatient.next_check_date = nextCheckDate;

    await longTermPatient.save();

    res.json({
      success: true,
      longTermPatient: longTermPatient.toObject()
    });
  } catch (error) {
    console.error('Add Note Error:', error);
    res.status(500).json({ success: false, message: 'Server error adding note' });
  }
});

// @route   PATCH /api/long-term-patients/:longtermId/status
// @desc    Update long-term patient status (Doctor)
// @access  Private (Doctor)
router.patch('/:longtermId/status', [
  auth,
  authorize('doctor'),
  body('status').isIn(['active', 'monitoring', 'recovered', 'discharged']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const longTermPatient = await LongTermPatient.findOne({ 
      longterm_id: req.params.longtermId,
      doctor_id: req.user.user_id
    });

    if (!longTermPatient) {
      return res.status(404).json({ success: false, message: 'Long-term patient record not found' });
    }

    longTermPatient.status = req.body.status;
    await longTermPatient.save();

    res.json({
      success: true,
      longTermPatient: longTermPatient.toObject()
    });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
});

module.exports = router;

