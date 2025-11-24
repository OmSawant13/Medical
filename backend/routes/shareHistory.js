const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const ShareLink = require('../models/ShareLink');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const { auth, authorize } = require('../middleware/auth');
const { logAccessSync } = require('../middleware/accessLogger');

// @route   POST /api/share-history/create
// @desc    Create a temporary share link for medical history (Patient)
// @access  Private (Patient)
router.post('/create', [
  auth,
  authorize('patient'),
  body('doctor_id').notEmpty().withMessage('Doctor ID is required'),
  body('duration_hours').isInt({ min: 1, max: 168 }).withMessage('Duration must be between 1 and 168 hours (7 days)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { doctor_id, duration_hours } = req.body;
    const patient_id = req.user.user_id;

    // Verify doctor exists and is verified
    const doctor = await User.findOne({ user_id: doctor_id, role: 'doctor', isVerified: true });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found or not verified' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + duration_hours * 60 * 60 * 1000);

    // Create share link
    const shareLink = new ShareLink({
      patient_id,
      shared_with: doctor_id,
      token,
      expires_at
    });

    await shareLink.save();

    // Log access
    await logAccessSync(
      patient_id,
      patient_id,
      'share_history',
      'medical_record',
      shareLink.share_id,
      req
    );

    res.json({
      success: true,
      share_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${token}`,
      token,
      expires_at,
      doctor: {
        name: doctor.name,
        user_id: doctor.user_id
      }
    });
  } catch (error) {
    console.error('Create Share Link Error:', error);
    res.status(500).json({ success: false, message: 'Server error creating share link' });
  }
});

// @route   GET /api/share-history/:token
// @desc    Access shared medical history via token (Doctor)
// @access  Public (via token)
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const shareLink = await ShareLink.findOne({ token, isActive: true })
      .populate('shared_with', 'name user_id')
      .populate('patient_id', 'name user_id age gender allergies');

    if (!shareLink) {
      return res.status(404).json({ success: false, message: 'Share link not found or expired' });
    }

    // Check if expired
    if (new Date() > shareLink.expires_at) {
      shareLink.isActive = false;
      await shareLink.save();
      return res.status(400).json({ success: false, message: 'Share link has expired' });
    }

    // Get patient medical records
    const records = await MedicalRecord.find({ patient_id: shareLink.patient_id })
      .sort({ timestamp: -1 })
      .populate('doctor_id', 'name user_id')
      .populate('hospital_id', 'name user_id');

    // Log access
    await logAccessSync(
      shareLink.patient_id,
      shareLink.shared_with,
      'view_records',
      'medical_record',
      null,
      req
    );

    res.json({
      success: true,
      patient: shareLink.patient_id,
      records,
      expires_at: shareLink.expires_at,
      share_id: shareLink.share_id
    });
  } catch (error) {
    console.error('Access Share Link Error:', error);
    res.status(500).json({ success: false, message: 'Server error accessing share link' });
  }
});

// @route   GET /api/share-history
// @desc    Get all share links created by patient
// @access  Private (Patient)
router.get('/', [auth, authorize('patient')], async (req, res) => {
  try {
    const shareLinks = await ShareLink.find({ patient_id: req.user.user_id })
      .sort({ createdAt: -1 })
      .populate('shared_with', 'name user_id specialization')
      .limit(50);

    res.json({
      success: true,
      share_links: shareLinks
    });
  } catch (error) {
    console.error('Get Share Links Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching share links' });
  }
});

// @route   DELETE /api/share-history/:shareId
// @desc    Revoke share link (Patient)
// @access  Private (Patient)
router.delete('/:shareId', [auth, authorize('patient')], async (req, res) => {
  try {
    const shareLink = await ShareLink.findOne({
      share_id: req.params.shareId,
      patient_id: req.user.user_id
    });

    if (!shareLink) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    shareLink.isActive = false;
    await shareLink.save();

    res.json({
      success: true,
      message: 'Share link revoked successfully'
    });
  } catch (error) {
    console.error('Revoke Share Link Error:', error);
    res.status(500).json({ success: false, message: 'Server error revoking share link' });
  }
});

module.exports = router;

