const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const { auth, authorize } = require('../middleware/auth');
const { logAccessSync } = require('../middleware/accessLogger');

// @route   GET /api/patients/dashboard
// @desc    Get patient dashboard data
// @access  Private (Patient)
router.get('/dashboard', [auth, authorize('patient')], async (req, res) => {
  try {
    const patientId = req.user.user_id;

    // Get upcoming appointments
    const upcomingAppointmentsRaw = await Appointment.find({
      patient_id: patientId,
      status: { $in: ['pending', 'accepted'] },
      date_time: { $gte: new Date() }
    })
      .sort({ date_time: 1 })
      .limit(10);
    
    // Manually populate doctor_id
    const upcomingAppointments = await Promise.all(
      upcomingAppointmentsRaw.map(async (apt) => {
        const doctor = await User.findOne({ user_id: apt.doctor_id }).select('name user_id');
        return {
          ...apt.toObject(),
          doctor_id: doctor || { name: 'Unknown', user_id: apt.doctor_id }
        };
      })
    );

    // Get past appointments
    const pastAppointmentsRaw = await Appointment.find({
      patient_id: patientId,
      status: 'completed'
    })
      .sort({ date_time: -1 })
      .limit(10);
    
    // Manually populate doctor_id
    const pastAppointments = await Promise.all(
      pastAppointmentsRaw.map(async (apt) => {
        const doctor = await User.findOne({ user_id: apt.doctor_id }).select('name user_id');
        return {
          ...apt.toObject(),
          doctor_id: doctor || { name: 'Unknown', user_id: apt.doctor_id }
        };
      })
    );

    // Get recent records
    const recentRecords = await MedicalRecord.find({ patient_id: patientId })
      .sort({ timestamp: -1 })
      .limit(5);

    res.json({
      upcomingAppointments,
      pastAppointments,
      recentRecords,
      patient: {
        user_id: req.user.user_id,
        name: req.user.name,
        allergies: req.user.allergies
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard' });
  }
});

// @route   GET /api/patients/:patientId
// @desc    Get patient profile (Doctor/Hospital can view)
// @access  Private
router.get('/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check access
    if (req.user.role === 'patient' && req.user.user_id !== patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await User.findOne({ user_id: patientId, role: 'patient' })
      .select('-password');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Log access for doctors/hospitals
    if (req.user.role !== 'patient') {
      await logAccessSync(
        patientId,
        req.user.user_id,
        'view_profile',
        'patient_profile',
        patientId,
        req
      );
    }

    res.json(patient);
  } catch (error) {
    console.error('Get Patient Error:', error);
    res.status(500).json({ message: 'Server error fetching patient' });
  }
});

// @route   GET /api/patients/:patientId/history
// @desc    Get patient medical history timeline
// @access  Private (Patient or Doctor/Hospital)
router.get('/:patientId/history', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check access
    if (req.user.role === 'patient' && req.user.user_id !== patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all records and appointments
    const recordsRaw = await MedicalRecord.find({ patient_id: patientId })
      .sort({ timestamp: -1 });
    
    const records = await Promise.all(
      recordsRaw.map(async (record) => {
        const doctor = record.doctor_id ? await User.findOne({ user_id: record.doctor_id }).select('name user_id') : null;
        const hospital = record.hospital_id ? await User.findOne({ user_id: record.hospital_id }).select('name user_id') : null;
        return {
          ...record.toObject(),
          doctor_id: doctor || null,
          hospital_id: hospital || null
        };
      })
    );

    const appointmentsRaw = await Appointment.find({ patient_id: patientId })
      .sort({ date_time: -1 });
    
    const appointments = await Promise.all(
      appointmentsRaw.map(async (apt) => {
        const doctor = await User.findOne({ user_id: apt.doctor_id }).select('name user_id');
        return {
          ...apt.toObject(),
          doctor_id: doctor || { name: 'Unknown', user_id: apt.doctor_id }
        };
      })
    );

    // Combine and sort by date
    const timeline = [
      ...records.map(r => ({ type: 'record', data: r, date: r.timestamp })),
      ...appointments.map(a => ({ type: 'appointment', data: a, date: a.date_time }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

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

    res.json({ timeline, patient_id: patientId });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({ message: 'Server error fetching history' });
  }
});

// @route   PATCH /api/patients/profile
// @desc    Update patient profile
// @access  Private (Patient)
router.patch('/profile', [auth, authorize('patient')], async (req, res) => {
  try {
    const { name, phone, allergies } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (allergies) updates.allergies = allergies;

    const patient = await User.findOneAndUpdate(
      { user_id: req.user.user_id },
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json(patient);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;

