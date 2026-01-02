const express = require('express');
const Doctor = require('../models/Doctor');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const MedicalScan = require('../models/MedicalScan');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get patient queue for the logged-in doctor
router.get('/patient-queue', authenticateToken, authorizeRoles('doctor'), async (req, res) => {
  try {
    // Find doctor profile for the logged-in user
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    }

    // Get today's start and end
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find appointments
    const appointments = await Appointment.find({
      doctorId: doctor.doctorId,
      appointmentDate: { $gte: today },
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    }).sort({ appointmentDate: 1, appointmentTime: 1 });

    // Populate patient details manually since we store patientId string
    const queue = await Promise.all(appointments.map(async (apt) => {
      const patient = await Patient.findOne({ patientId: apt.patientId });
      // Calculate wait time (mock logic for now, or based on appointment time vs now)
      const aptTime = new Date(`${apt.appointmentDate.toISOString().split('T')[0]}T${apt.appointmentTime}`);
      const waitTime = Math.max(0, Math.floor((Date.now() - aptTime.getTime()) / 60000));

      return {
        appointmentId: apt.appointmentId,
        patientId: apt.patientId,
        patientName: patient?.personalInfo?.name || 'Unknown',
        patientPhone: patient?.personalInfo?.phone || '',
        patientAge: patient?.personalInfo?.dateOfBirth ?
          Math.floor((new Date().getTime() - new Date(patient.personalInfo.dateOfBirth).getTime()) / 31557600000) : null,
        appointmentDate: apt.appointmentDate,
        appointmentTime: apt.appointmentTime,
        type: apt.type,
        status: apt.status,
        priority: patient?.priorityScore || 1,
        symptoms: apt.symptoms || [],
        waitTime: waitTime
      };
    }));

    res.json({ success: true, data: queue });
  } catch (error) {
    console.error('Error fetching patient queue:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch patient queue' });
  }
});

// Get pending scans for review
router.get('/pending-scans', authenticateToken, authorizeRoles('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    }

    // Find scans that are processed but not reviewed, OR assigned to this doctor
    // For now, we'll fetch all completed scans for patients that don't have a review yet
    const scans = await MedicalScan.find({
      status: 'completed',
      'doctorReview.approved': { $exists: false }
    }).sort({ createdAt: -1 });

    // Enrich with patient name
    const pendingScans = await Promise.all(scans.map(async (scan) => {
      const patient = await Patient.findOne({ patientId: scan.patientId });
      return {
        scanId: scan.scanId,
        patientId: scan.patientId,
        patientName: patient?.personalInfo?.name || 'Unknown',
        scanType: scan.scanType,
        date: scan.createdAt,
        status: 'pending_review', // Frontend expects this status
        aiAnalysis: scan.aiAnalysis,
        doctorNotes: scan.doctorReview?.notes
      };
    }));

    res.json({ success: true, data: pendingScans });
  } catch (error) {
    console.error('Error fetching pending scans:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending scans' });
  }
});

// Get all patients for this doctor
router.get('/patients', authenticateToken, authorizeRoles('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    }

    // Find all unique patientIds from appointments with this doctor
    const distinctPatientIds = await Appointment.distinct('patientId', { doctorId: doctor.doctorId });

    const patients = await Patient.find({ patientId: { $in: distinctPatientIds } });

    const patientsList = patients.map(p => ({
      patientId: p.patientId,
      name: p.personalInfo?.name || 'Unknown',
      age: p.personalInfo?.dateOfBirth ?
        Math.floor((new Date().getTime() - new Date(p.personalInfo.dateOfBirth).getTime()) / 31557600000) : null,
      gender: p.personalInfo?.gender,
      contact: p.personalInfo?.phone,
      email: p.userId?.email, // This needs population if email is in User model
      lastVisit: new Date(), // Placeholder, real logic would query last appointment
      totalVisits: 1, // Placeholder
      chronicConditions: p.medicalInfo?.chronicConditions || [],
      status: 'active'
    }));

    res.json({ success: true, data: patientsList });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch patients' });
  }
});

// Get doctor details by doctorId
router.get('/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findOne({ doctorId })
      .populate('userId', 'name email');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Return full doctor details
    res.json({
      success: true,
      data: {
        doctorId: doctor.doctorId,
        name: doctor.userId?.name || 'Dr. Unknown',
        email: doctor.userId?.email || '',
        specialization: Array.isArray(doctor.specialization)
          ? doctor.specialization
          : (doctor.specialization ? [doctor.specialization] : []),
        experience: doctor.experience || 0,
        consultationFee: doctor.consultationFee || 0,
        availability: doctor.availability || {},
        qualifications: Array.isArray(doctor.qualifications)
          ? doctor.qualifications
          : (doctor.qualifications ? [doctor.qualifications] : []),
        licenseNumber: doctor.licenseNumber || '',
        hospitalAffiliation: doctor.hospitalAffiliation || ''
      }
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor details',
      details: error.message
    });
  }
});

module.exports = router;

