const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Family = require('../models/Family');
const MedicalRecord = require('../models/MedicalRecord');
const { auth, authorize } = require('../middleware/auth');
const { summarizeHereditaryPatterns } = require('../utils/aiService');
const { logAccessSync } = require('../middleware/accessLogger');

// @route   GET /api/family-history/:patientId
// @desc    Get family history for a patient
// @access  Private (Patient, Doctor)
router.get('/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check access
    if (req.user.role === 'patient' && req.user.user_id !== patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await User.findOne({ user_id: patientId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (!patient.family_id) {
      return res.json({
        family_id: null,
        members: [],
        medical_pattern: {},
        records: []
      });
    }

    // Get family
    let family = await Family.findOne({ family_id: patient.family_id });
    if (!family) {
      return res.json({
        family_id: patient.family_id,
        members: [],
        medical_pattern: {},
        records: []
      });
    }

    // Get all family members' records recursively
    const allFamilyMembers = await getAllFamilyMembers(family.family_id);
    const allMemberIds = allFamilyMembers.map(m => m.user_id);

    // Get all medical records for family members
    const familyRecords = await MedicalRecord.find({
      patient_id: { $in: allMemberIds }
    })
      .sort({ timestamp: -1 })
      .populate('patient_id', 'name user_id')
      .populate('doctor_id', 'name user_id')
      .populate('hospital_id', 'name user_id');

    // Analyze hereditary patterns if not already analyzed or if records changed
    if (!family.medical_pattern.summary || familyRecords.length > 0) {
      const patternAnalysis = await summarizeHereditaryPatterns(familyRecords);
      
      family.medical_pattern = {
        ...patternAnalysis,
        analyzed_at: new Date()
      };
      await family.save();
    }

    // Log access
    if (req.user.role !== 'patient') {
      await logAccessSync(
        patientId,
        req.user.user_id,
        'view_family_history',
        'family_history',
        family.family_id,
        req
      );
    }

    res.json({
      family_id: family.family_id,
      members: allFamilyMembers.map(m => ({
        user_id: m.user_id,
        name: m.name,
        relationship: 'family_member'
      })),
      medical_pattern: family.medical_pattern,
      records: familyRecords
    });
  } catch (error) {
    console.error('Get Family History Error:', error);
    res.status(500).json({ message: 'Server error fetching family history' });
  }
});

// Helper function to get all family members recursively
async function getAllFamilyMembers(familyId, visited = new Set()) {
  if (visited.has(familyId)) {
    return [];
  }
  visited.add(familyId);

  const family = await Family.findOne({ family_id: familyId });
  if (!family) {
    return [];
  }

  const members = await User.find({ user_id: { $in: family.members } });
  let allMembers = [...members];

  // Recursively get parent family members
  if (family.parent_family_id) {
    const parentMembers = await getAllFamilyMembers(family.parent_family_id, visited);
    allMembers = [...allMembers, ...parentMembers];
  }

  return allMembers;
}

// @route   POST /api/family-history/link
// @desc    Link patient to family (for ancestry)
// @access  Private (Patient)
router.post('/link', [
  auth,
  authorize('patient'),
  body('parent_family_id').notEmpty().withMessage('Parent family ID is required')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { parent_family_id } = req.body;

    // Verify parent family exists
    const parentFamily = await Family.findOne({ family_id: parent_family_id });
    if (!parentFamily) {
      return res.status(404).json({ message: 'Parent family not found' });
    }

    // Get patient's family
    const patient = await User.findOne({ user_id: req.user.user_id });
    if (!patient.family_id) {
      return res.status(400).json({ message: 'Patient has no family_id' });
    }

    const patientFamily = await Family.findOne({ family_id: patient.family_id });
    if (!patientFamily) {
      return res.status(404).json({ message: 'Patient family not found' });
    }

    // Link families
    patientFamily.parent_family_id = parent_family_id;
    await patientFamily.save();

    res.json({
      message: 'Family linked successfully',
      family: patientFamily
    });
  } catch (error) {
    console.error('Link Family Error:', error);
    res.status(500).json({ message: 'Server error linking family' });
  }
});

module.exports = router;

