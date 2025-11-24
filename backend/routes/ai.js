const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { auth, authorize } = require('../middleware/auth');
const { analyzeReport, summarizeHereditaryPatterns } = require('../utils/aiService');
const { logAccessSync } = require('../middleware/accessLogger');

// @route   POST /api/ai/analyze-report
// @desc    Analyze medical report using AI (Doctor)
// @access  Private (Doctor)
router.post('/analyze-report', [
  auth,
  authorize('doctor'),
  body('record_id').notEmpty().withMessage('Record ID is required')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { record_id } = req.body;

    const record = await MedicalRecord.findOne({ record_id })
      .populate('patient_id', 'name user_id');

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Prepare file paths for analysis
    const path = require('path');
    const fs = require('fs');
    const filePaths = (record.files || []).map(file => {
      const filename = file.startsWith('/uploads/') ? file.replace('/uploads/', '') : path.basename(file);
      return path.join(__dirname, '../../uploads', filename);
    }).filter(filePath => fs.existsSync(filePath));

    // Analyze report (supports both text and images)
    const analysis = await analyzeReport(
      record.summary || '', 
      filePaths, 
      record.record_type || 'other'
    );

    // Update record with AI summary
    record.ai_summary = analysis.summary;
    await record.save();

    // Log access
    await logAccessSync(
      record.patient_id.user_id,
      req.user.user_id,
      'view_records',
      'medical_record',
      record.record_id,
      req
    );

    res.json({
      success: true,
      record_id: record.record_id,
      analysis: {
        ...analysis,
        recordType: record.record_type,
        hasFiles: filePaths.length > 0,
        filesAnalyzed: filePaths.length
      },
      ai_summary: analysis.summary
    });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ message: 'Server error analyzing report' });
  }
});

// @route   POST /api/ai/summarize-health
// @desc    Summarize all patient data (Patient)
// @access  Private (Patient)
router.post('/summarize-health', [
  auth,
  authorize('patient')
], async (req, res) => {
  try {
    const patientId = req.user.user_id;

    // Get all medical records
    const records = await MedicalRecord.find({ patient_id: patientId })
      .sort({ timestamp: -1 });

    // Get all appointments
    const appointments = await Appointment.find({ patient_id: patientId })
      .sort({ date_time: -1 });

    // Combine data for summary
    const allData = [
      ...records.map(r => `Record: ${r.summary || 'No summary'}`),
      ...appointments.map(a => `Appointment: Symptoms - ${a.symptoms}`)
    ].join('\n');

    // Generate summary
    const summary = await analyzeReport(allData);

    res.json({
      patient_id: patientId,
      summary: summary.summary,
      keyFindings: summary.keyFindings,
      recommendations: summary.recommendations,
      totalRecords: records.length,
      totalAppointments: appointments.length
    });
  } catch (error) {
    console.error('Summarize Health Error:', error);
    res.status(500).json({ message: 'Server error summarizing health data' });
  }
});

module.exports = router;

