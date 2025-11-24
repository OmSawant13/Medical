const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const upload = require('../utils/fileUpload');
const { auth, authorize } = require('../middleware/auth');
const { logAccessSync } = require('../middleware/accessLogger');
const path = require('path');

// @route   POST /api/medical-records
// @desc    Upload medical record (Doctor or Hospital)
// @access  Private (Doctor/Hospital)
router.post('/', [
  auth,
  authorize('doctor', 'hospital'),
  upload.array('files', 10),
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('summary').optional().trim(),
  body('record_type').optional().isIn(['prescription', 'lab_test', 'xray', 'discharge_summary', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patient_id, summary, record_type, appointment_id } = req.body;

    // Verify patient exists
    const patient = await User.findOne({ user_id: patient_id, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get file URLs
    const fileUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    // Create medical record
    const record = new MedicalRecord({
      patient_id,
      doctor_id: req.user.role === 'doctor' ? req.user.user_id : undefined,
      hospital_id: req.user.role === 'hospital' ? req.user.user_id : undefined,
      appointment_id: appointment_id || undefined,
      summary: summary || '',
      record_type: record_type || 'other',
      files: fileUrls
    });

    await record.save();

    // Log access
    await logAccessSync(
      patient_id,
      req.user.user_id,
      'upload_record',
      'medical_record',
      record.record_id,
      req
    );

    res.status(201).json(record);
  } catch (error) {
    console.error('Upload Record Error:', error);
    res.status(500).json({ message: 'Server error uploading record' });
  }
});

// @route   GET /api/medical-records/patient/:patientId
// @desc    Get all medical records for a patient
// @access  Private (Patient, Doctor, Hospital - read-only)
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify patient exists
    const patient = await User.findOne({ user_id: patientId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check access
    if (req.user.role === 'patient' && req.user.user_id !== patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Doctors and hospitals can view (read-only)
    const records = await MedicalRecord.find({ patient_id: patientId })
      .sort({ timestamp: -1 })
      .populate('doctor_id', 'name user_id')
      .populate('hospital_id', 'name user_id');

    // Log access
    if (req.user.role !== 'patient') {
      await logAccessSync(
        patientId,
        req.user.user_id,
        'view_records',
        'medical_record',
        null,
        req
      );
    }

    res.json(records);
  } catch (error) {
    console.error('Get Records Error:', error);
    res.status(500).json({ message: 'Server error fetching records' });
  }
});

// @route   GET /api/medical-records/:recordId
// @desc    Get single medical record
// @access  Private
router.get('/:recordId', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({ record_id: req.params.recordId });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Check access
    if (req.user.role === 'patient' && record.patient_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Log access for doctors/hospitals
    if (req.user.role !== 'patient') {
      await logAccessSync(
        record.patient_id,
        req.user.user_id,
        'view_records',
        'medical_record',
        record.record_id,
        req
      );
    }

    res.json(record);
  } catch (error) {
    console.error('Get Record Error:', error);
    res.status(500).json({ message: 'Server error fetching record' });
  }
});

// Serve uploaded files (protected route)
router.get('/files/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;
    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }
    const filePath = path.join(__dirname, '../../uploads', filename);
    res.sendFile(filePath);
  } catch (error) {
    console.error('File serve error:', error);
    res.status(500).json({ success: false, message: 'Error serving file' });
  }
});

module.exports = router;

