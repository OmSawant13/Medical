const express = require('express');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalScan = require('../models/MedicalScan');
const auth = require('../middleware/auth');
const router = express.Router();

// Get doctor profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update doctor profile
router.put('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: req.body },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending scans for review
router.get('/pending-scans', auth, async (req, res) => {
  try {
    const scans = await MedicalScan.find({ 
      status: 'analysis_complete',
      assignedDoctor: req.user.userId 
    }).populate('patientId', 'name roleSpecificId');
    
    res.json(scans);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Review a medical scan
router.put('/scans/:id/review', auth, async (req, res) => {
  try {
    const { approved, doctorNotes } = req.body;
    
    const scan = await MedicalScan.findByIdAndUpdate(
      req.params.id,
      {
        status: approved ? 'approved' : 'reviewed',
        doctorNotes,
        reviewedBy: req.user.userId,
        reviewedAt: new Date(),
      },
      { new: true }
    );
    
    res.json(scan);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's patients
router.get('/patients', auth, async (req, res) => {
  try {
    // Get patients who have appointments with this doctor
    const appointments = await Appointment.find({ doctorId: req.user.userId })
      .populate('patientId', 'name email phone dateOfBirth')
      .distinct('patientId');
    
    const patients = await User.find({
      _id: { $in: appointments },
      role: 'patient'
    }).select('-password');
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient queue (today's appointments)
router.get('/patient-queue', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const appointments = await Appointment.find({
      doctorId: req.user.userId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'confirmed'] }
    }).populate('patientId', 'name phone dateOfBirth')
      .sort({ time: 1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
