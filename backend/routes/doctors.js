const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const { auth, authorize } = require('../middleware/auth');
const { logAccessSync } = require('../middleware/accessLogger');

// @route   GET /api/doctors/dashboard
// @desc    Get doctor dashboard
// @access  Private (Doctor)
router.get('/dashboard', [auth, authorize('doctor')], async (req, res) => {
  try {
    const doctorId = req.user.user_id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's appointments
    const todayAppointmentsRaw = await Appointment.find({
      doctor_id: doctorId,
      date_time: { $gte: today, $lt: tomorrow },
      status: { $in: ['pending', 'accepted'] }
    })
      .sort({ date_time: 1 });
    
    const todayAppointments = await Promise.all(
      todayAppointmentsRaw.map(async (apt) => {
        const patient = await User.findOne({ user_id: apt.patient_id }).select('name user_id allergies');
        return {
          ...apt.toObject(),
          patient_id: patient || { name: 'Unknown', user_id: apt.patient_id, allergies: [] }
        };
      })
    );

    // Pending requests
    const pendingRequestsRaw = await Appointment.find({
      doctor_id: doctorId,
      status: 'pending'
    })
      .sort({ date_time: 1 });
    
    const pendingRequests = await Promise.all(
      pendingRequestsRaw.map(async (apt) => {
        const patient = await User.findOne({ user_id: apt.patient_id }).select('name user_id allergies');
        return {
          ...apt.toObject(),
          patient_id: patient || { name: 'Unknown', user_id: apt.patient_id, allergies: [] }
        };
      })
    );

    // Past patients (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pastAppointmentsRaw = await Appointment.find({
      doctor_id: doctorId,
      status: 'completed',
      date_time: { $gte: thirtyDaysAgo }
    })
      .sort({ date_time: -1 })
      .limit(20);
    
    const pastAppointments = await Promise.all(
      pastAppointmentsRaw.map(async (apt) => {
        const patient = await User.findOne({ user_id: apt.patient_id }).select('name user_id');
        return {
          ...apt.toObject(),
          patient_id: patient || { name: 'Unknown', user_id: apt.patient_id }
        };
      })
    );

    res.json({
      todayAppointments,
      pendingRequests,
      pastPatients: pastAppointments
    });
  } catch (error) {
    console.error('Doctor Dashboard Error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard' });
  }
});

// @route   GET /api/doctors/patient/:patientId
// @desc    Get patient view for doctor (read-only)
// @access  Private (Doctor)
router.get('/patient/:patientId', [auth, authorize('doctor')], async (req, res) => {
  try {
    const { patientId } = req.params;

    // Get patient
    const patient = await User.findOne({ user_id: patientId, role: 'patient' })
      .select('-password');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get current appointment if exists
    const currentAppointment = await Appointment.findOne({
      patient_id: patientId,
      doctor_id: req.user.user_id,
      status: { $in: ['pending', 'accepted'] }
    })
      .sort({ date_time: -1 })
      .limit(1);

    // Get medical timeline
    const recordsRaw = await MedicalRecord.find({ patient_id: patientId })
      .sort({ timestamp: -1 })
      .limit(20);
    
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

    // Log access
    await logAccessSync(
      patientId,
      req.user.user_id,
      'view_profile',
      'patient_profile',
      patientId,
      req
    );

    res.json({
      patient: {
        user_id: patient.user_id,
        name: patient.name,
        allergies: patient.allergies,
        family_id: patient.family_id
      },
      currentAppointment: currentAppointment ? {
        symptoms: currentAppointment.symptoms,
        date_time: currentAppointment.date_time
      } : null,
      medicalTimeline: records
    });
  } catch (error) {
    console.error('Get Patient View Error:', error);
    res.status(500).json({ message: 'Server error fetching patient view' });
  }
});

// @route   POST /api/doctors/refer
// @desc    Refer patient to hospital
// @access  Private (Doctor)
router.post('/refer', [
  auth,
  authorize('doctor'),
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('hospital_id').notEmpty().withMessage('Hospital ID is required'),
  body('reason').trim().notEmpty().withMessage('Reason is required')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { patient_id, hospital_id, reason } = req.body;

    // Verify patient and hospital exist
    const patient = await User.findOne({ user_id: patient_id, role: 'patient' });
    const hospital = await User.findOne({ user_id: hospital_id, role: 'hospital', isVerified: true });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found or not verified' });
    }

    // Create referral record
    const referralRecord = new MedicalRecord({
      patient_id,
      doctor_id: req.user.user_id,
      hospital_id,
      summary: `Referral to ${hospital.name}: ${reason}`,
      record_type: 'other'
    });

    await referralRecord.save();

    // Log access
    await logAccessSync(
      patient_id,
      req.user.user_id,
      'upload_record',
      'medical_record',
      referralRecord.record_id,
      req
    );

    res.status(201).json({
      message: 'Patient referred successfully',
      referral: referralRecord
    });
  } catch (error) {
    console.error('Refer Patient Error:', error);
    res.status(500).json({ message: 'Server error creating referral' });
  }
});

// @route   GET /api/doctors/search
// @desc    Search doctors (for patients) - with filters
// @access  Private (Patient)
router.get('/search', [auth, authorize('patient')], async (req, res) => {
  try {
    const { name, specialization, city, minFee, maxFee, availability } = req.query;
    let query = { role: 'doctor', isVerified: true };

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = parseFloat(minFee);
      if (maxFee) query.consultationFee.$lte = parseFloat(maxFee);
    }

    let doctors = await User.find(query)
      .select('user_id name email phone doctor_id specialization qualification education experience consultationFee clinicName address city state zipCode consultationHours')
      .limit(100);

    // Filter by availability if requested
    if (availability === 'today' || availability) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      doctors = doctors.filter(doctor => {
        if (!doctor.consultationHours || !doctor.consultationHours[today]) return false;
        return doctor.consultationHours[today].available === true;
      });
    }

    res.json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    console.error('Search Doctors Error:', error);
    res.status(500).json({ success: false, message: 'Server error searching doctors' });
  }
});

// @route   GET /api/doctors/:doctorId
// @desc    Get doctor profile details
// @access  Private (Patient)
router.get('/:doctorId', [auth, authorize('patient')], async (req, res) => {
  try {
    const doctor = await User.findOne({ 
      user_id: req.params.doctorId, 
      role: 'doctor',
      isVerified: true 
    })
      .select('user_id name email phone doctor_id specialization qualification education experience consultationFee clinicName consultationHours address city state zipCode');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({
      success: true,
      doctor: doctor.toObject()
    });
  } catch (error) {
    console.error('Get Doctor Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching doctor' });
  }
});('/:doctorId', [auth, authorize('patient')], async (req, res) => {
  try {
    const doctor = await User.findOne({ 
      user_id: req.params.doctorId, 
      role: 'doctor', 
      isVerified: true 
    })
      .select('-password');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Get doctor's availability stats
    const upcomingAppointments = await Appointment.countDocuments({
      doctor_id: doctor.user_id,
      status: { $in: ['pending', 'accepted'] },
      date_time: { $gte: new Date() }
    });

    res.json({
      success: true,
      doctor: {
        ...doctor.toObject(),
        upcomingAppointments
      }
    });
  } catch (error) {
    console.error('Get Doctor Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching doctor profile' });
  }
});

module.exports = router;

