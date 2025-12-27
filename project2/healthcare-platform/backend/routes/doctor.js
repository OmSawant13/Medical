const express = require('express');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalScan = require('../models/MedicalScan');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get doctor profile
router.get('/profile', authorizeRoles('doctor'), async (req, res) => {
  try {
    // SECURITY: Only return profile of the authenticated doctor
    const userId = req.user._id || req.user.id || (req.tokenPayload && req.tokenPayload.userId);
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Verify this is a doctor
    if (user.role !== 'doctor') {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: Not a doctor' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: error.message 
    });
  }
});

// Update doctor profile
router.put('/profile', authorizeRoles('doctor'), async (req, res) => {
  try {
    // SECURITY: Only allow updating own profile
    const userId = req.user._id || req.user.id || (req.tokenPayload && req.tokenPayload.userId);
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: req.body },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Verify this is a doctor
    if (user.role !== 'doctor') {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: Not a doctor' 
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: error.message 
    });
  }
});

// Get pending scans for review
router.get('/pending-scans', authorizeRoles('doctor'), async (req, res) => {
  try {
    // SECURITY: Only return scans assigned to THIS doctor
    const userId = req.user._id || req.user.id || (req.tokenPayload && req.tokenPayload.userId);
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        error: 'Doctor profile not found' 
      });
    }

    // Only get scans assigned to THIS doctor OR scans with no assigned doctor
    // This allows doctors to pick up unassigned scans
    const scans = await MedicalScan.find({ 
      status: 'analysis_complete',
      $or: [
        { assignedDoctor: doctor._id },
        { assignedDoctor: { $exists: false } },
        { assignedDoctor: null }
      ]
    }).populate('patientId', 'name roleSpecificId')
      .limit(50); // Limit to prevent huge responses
    
    res.json({
      success: true,
      data: scans || []
    });
  } catch (error) {
    console.error('Error fetching pending scans:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: error.message 
    });
  }
});

// Review a medical scan
router.put('/scans/:id/review', authorizeRoles('doctor'), async (req, res) => {
  try {
    // SECURITY: Verify doctor exists and scan is assigned to THIS doctor
    const userId = req.user._id || req.user.id || (req.tokenPayload && req.tokenPayload.userId);
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        error: 'Doctor profile not found' 
      });
    }

    // Check if scan exists and is assigned to THIS doctor
    const scan = await MedicalScan.findById(req.params.id);
    if (!scan) {
      return res.status(404).json({ 
        success: false,
        error: 'Scan not found' 
      });
    }

    // SECURITY: Only allow review if scan is assigned to THIS doctor
    if (scan.assignedDoctor && scan.assignedDoctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: This scan is not assigned to you' 
      });
    }

    const { approved, doctorNotes } = req.body;
    
    const updatedScan = await MedicalScan.findByIdAndUpdate(
      req.params.id,
      {
        status: approved ? 'approved' : 'reviewed',
        doctorNotes,
        reviewedBy: doctor._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );
    
    res.json({
      success: true,
      data: updatedScan
    });
  } catch (error) {
    console.error('Error reviewing scan:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: error.message 
    });
  }
});

// Get doctor's patients
router.get('/patients', authorizeRoles('doctor'), async (req, res) => {
  try {
    // SECURITY: Only return patients who have appointments with THIS doctor
    const userId = req.user._id || req.user.id || (req.tokenPayload && req.tokenPayload.userId);
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        error: 'Doctor profile not found' 
      });
    }

    // Get patients who have appointments with THIS doctor only
    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('patientId', 'name email phone dateOfBirth')
      .distinct('patientId');
    
    const patients = await User.find({
      _id: { $in: appointments },
      role: 'patient'
    }).select('-password');
    
    res.json({
      success: true,
      data: patients || []
    });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: error.message 
    });
  }
});

// Get patient queue (today's appointments)
router.get('/patient-queue', authorizeRoles('doctor'), async (req, res) => {
  try {
    // SECURITY: Only return appointments for this specific doctor
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Verify doctor exists and get doctor ID
    const userId = req.user._id || req.user.id || (req.tokenPayload && req.tokenPayload.userId);
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        error: 'Doctor profile not found' 
      });
    }

    // Only get appointments assigned to THIS doctor
    const appointments = await Appointment.find({
      doctorId: doctor._id,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'confirmed'] }
    }).populate('patientId', 'name phone dateOfBirth')
      .sort({ time: 1 });
    
    res.json({
      success: true,
      data: appointments || []
    });
  } catch (error) {
    console.error('Error fetching patient queue:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: error.message 
    });
  }
});

module.exports = router;
