const express = require('express');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalScan = require('../models/MedicalScan');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// Get patient profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update patient profile
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

// Get patient appointments
router.get('/appointments', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.userId })
      .populate('doctorId', 'name specialization')
      .sort({ date: 1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Book new appointment
router.post('/appointments', auth, async (req, res) => {
  try {
    const { doctorName, date, time, type, symptoms } = req.body;
    
    const appointment = new Appointment({
      patientId: req.user.userId,
      doctorName,
      date,
      time,
      type,
      symptoms,
      status: 'scheduled',
      qrCode: generateQRCode(req.user.userId, doctorName, date, time),
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medical scans
router.get('/scans', auth, async (req, res) => {
  try {
    const scans = await MedicalScan.find({ patientId: req.user.userId })
      .sort({ date: -1 });
    
    res.json(scans);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { unread: false });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

function generateQRCode(patientId, doctorName, date, time) {
  const appointmentId = `A${Date.now()}`;
  return JSON.stringify({
    type: 'HEALTHCARE_APPOINTMENT',
    appointmentId,
    patientId,
    doctorName,
    date,
    time,
    hospitalId: 'HEALTHCARE_AI_HOSPITAL',
    validUntil: date,
    checksum: `${appointmentId}-${date.replace(/-/g, '')}-${time.replace(/[^0-9]/g, '')}`,
  });
}

module.exports = router;
