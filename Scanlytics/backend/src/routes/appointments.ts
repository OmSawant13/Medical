import express from 'express';
import Appointment from '../models/Appointment';
import Patient from '../models/Patient';
import Doctor from '../models/Doctor';
import { authenticateToken, authorizeRoles, validateHIPAA } from '../middleware/auth';
import { generateAppointmentId, generateQRCode, generateMeetingLink } from '../utils/generators';

const router = express.Router();

router.use(authenticateToken);
router.use(validateHIPAA);

// Create new appointment
router.post('/', authorizeRoles('patient', 'doctor', 'hospital'), async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, appointmentTime, type, symptoms } = req.body;

    if (!patientId || !doctorId || !appointmentDate || !appointmentTime || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Verify patient and doctor exist
    const [patient, doctor] = await Promise.all([
      Patient.findOne({ patientId }),
      Doctor.findOne({ doctorId })
    ]);

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    const appointmentId = generateAppointmentId();

    // Generate QR code and meeting link
    const qrCode = await generateQRCode(appointmentId);
    const meetingLink = generateMeetingLink(appointmentId);

    const appointment = new Appointment({
      appointmentId,
      patientId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      type,
      symptoms: symptoms || [],
      qrCode,
      meetingLink: type === 'video-call' ? meetingLink : undefined
    });

    await appointment.save();

    // Notify via Socket.IO
    if (global.io) {
      global.io.to(`doctor_${doctorId}`).emit('new_appointment', {
        appointmentId,
        patientName: patient.personalInfo?.name || 'Patient',
        appointmentDate,
        appointmentTime,
        type,
        symptoms: symptoms || []
      });

      global.io.to(`patient_${patientId}`).emit('appointment_confirmed', {
        appointmentId,
        doctorName: doctor.name || 'Doctor',
        appointmentDate,
        appointmentTime,
        qrCode,
        meetingLink: type === 'video-call' ? meetingLink : undefined
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: {
        appointmentId,
        patientId,
        doctorId,
        appointmentDate,
        appointmentTime,
        type,
        status: 'scheduled',
        qrCode,
        meetingLink: type === 'video-call' ? meetingLink : undefined
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to create appointment',
      details: error.message
    });
  }
});

// Get appointments
router.get('/', authorizeRoles('patient', 'doctor', 'hospital'), async (req, res) => {
  try {
    const { patientId, doctorId, status, date, limit = 50, page = 1 } = req.query;
    
    const filters: any = {};
    
    if (req.user?.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      filters.patientId = patient?.patientId;
    } else if (req.user?.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      filters.doctorId = doctor?.doctorId;
    } else {
      // Hospital can see all, or filter by patientId/doctorId
      if (patientId) filters.patientId = patientId;
      if (doctorId) filters.doctorId = doctorId;
    }
    
    if (status) filters.status = status;
    if (date) {
      const queryDate = new Date(date as string);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filters.appointmentDate = { $gte: queryDate, $lt: nextDay };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const appointments = await Appointment.find(filters)
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Appointment.countDocuments(filters);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments',
      details: error.message
    });
  }
});

// Update appointment status
router.put('/:appointmentId/status', authorizeRoles('doctor', 'hospital'), async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes, diagnosis, prescription } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;
    if (diagnosis) appointment.diagnosis = diagnosis;
    if (prescription) appointment.prescription = prescription;

    await appointment.save();

    // Notify patient
    if (global.io) {
      global.io.to(`patient_${appointment.patientId}`).emit('appointment_updated', {
        appointmentId,
        status,
        notes,
        diagnosis,
        prescription,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update appointment',
      details: error.message
    });
  }
});

// Patient check-in
router.post('/:appointmentId/checkin', authorizeRoles('patient', 'hospital'), async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    appointment.status = 'confirmed';
    await appointment.save();

    // Notify doctor
    if (global.io) {
      global.io.to(`doctor_${appointment.doctorId}`).emit('patient_checkin', {
        appointmentId,
        patientId: appointment.patientId,
        checkInTime: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Check-in successful',
      data: appointment
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Check-in failed',
      details: error.message
    });
  }
});

// Get appointment analytics
router.get('/analytics', authorizeRoles('doctor', 'hospital'), async (req, res) => {
  try {
    const analytics = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    const totalAppointments = await Appointment.countDocuments();
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    res.json({
      success: true,
      data: {
        totalAppointments,
        todayAppointments,
        statusBreakdown: analytics,
        completionRate: ((analytics.find(a => a._id === 'completed')?.count || 0) / totalAppointments * 100).toFixed(1)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics',
      details: error.message
    });
  }
});

export default router;
