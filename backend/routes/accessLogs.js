const express = require('express');
const router = express.Router();
const AccessLog = require('../models/AccessLog');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/access-logs
// @desc    Get access logs for patient (Patient only)
// @access  Private (Patient)
router.get('/', [auth, authorize('patient')], async (req, res) => {
  try {
    const logs = await AccessLog.find({ patient_id: req.user.user_id })
      .sort({ timestamp: -1 })
      .populate('accessed_by', 'name user_id role')
      .limit(100);

    res.json(logs);
  } catch (error) {
    console.error('Get Access Logs Error:', error);
    res.status(500).json({ message: 'Server error fetching access logs' });
  }
});

// @route   GET /api/access-logs/:patientId
// @desc    Get access logs for specific patient
// @access  Private (Patient - own logs only)
router.get('/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Patients can only view their own logs
    if (req.user.role === 'patient' && req.user.user_id !== patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const logs = await AccessLog.find({ patient_id: patientId })
      .sort({ timestamp: -1 })
      .populate('accessed_by', 'name user_id role')
      .limit(100);

    res.json(logs);
  } catch (error) {
    console.error('Get Access Logs Error:', error);
    res.status(500).json({ message: 'Server error fetching access logs' });
  }
});

module.exports = router;

