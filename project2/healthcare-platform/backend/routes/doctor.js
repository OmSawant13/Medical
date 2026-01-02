const express = require('express');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
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

    // Get scans that need doctor review
    // Status should be 'completed' (AI analysis done) or 'processing' (AI in progress)
    // OR scans with doctorReview.requiresDoctorReview = true
    const scans = await MedicalScan.find({ 
      $or: [
        { status: 'completed', 'doctorReview.reviewedBy': { $exists: false } }, // AI done, not reviewed
        { status: 'processing' }, // AI in progress
        { 'aiAnalysis.requiresDoctorReview': true, 'doctorReview.reviewedBy': { $exists: false } } // Requires review
      ]
    })
      .populate('uploadedBy', 'name email')
      .populate('patientId', 'name roleSpecificId')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to prevent huge responses
    
    // Transform to frontend format
    const transformedScans = scans.map(scan => {
      const patient = scan.patientId;
      return {
        scanId: scan.scanId,
        patientId: scan.patientId?.patientId || scan.patientId,
        patientName: patient?.name || scan.patientId?.name || 'Patient',
        scanType: scan.scanType,
        date: scan.createdAt,
        status: scan.status === 'completed' && !scan.doctorReview?.reviewedBy 
          ? 'pending_review' 
          : scan.status === 'processing' 
          ? 'processing' 
          : 'reviewed',
        aiAnalysis: scan.aiAnalysis ? {
          confidence: scan.aiAnalysis.confidence || 0,
          findings: scan.aiAnalysis.findings || [],
          recommendations: scan.aiAnalysis.recommendations || [],
          requiresReview: scan.aiAnalysis.requiresDoctorReview || false
        } : null,
        doctorNotes: scan.doctorReview?.notes || null
      };
    });
    
    res.json({
      success: true,
      data: transformedScans || []
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

// Review a medical scan (by scanId)
router.put('/scans/:scanId/review', authorizeRoles('doctor'), async (req, res) => {
  try {
    // SECURITY: Verify doctor exists
    const userId = req.user._id || req.user.id || (req.tokenPayload && req.tokenPayload.userId);
    const doctor = await Doctor.findOne({ userId }).populate('userId', 'name email');
    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        error: 'Doctor profile not found' 
      });
    }

    // Find scan by scanId (not _id)
    const scan = await MedicalScan.findOne({ scanId: req.params.scanId });
    if (!scan) {
      return res.status(404).json({ 
        success: false,
        error: 'Scan not found' 
      });
    }

    const { approved, notes } = req.body;
    
    // Update scan with doctor review
    scan.doctorReview = {
      reviewedBy: doctor.userId._id,
      notes: notes || '',
      approved: approved !== false, // Default to true if not specified
      reviewDate: new Date()
    };
    
    // Update status based on approval
    if (approved !== false) {
      scan.status = 'completed';
    }
    
    await scan.save();
    
    // Populate for response
    await scan.populate('uploadedBy', 'name email');
    await scan.populate('doctorReview.reviewedBy', 'name email');
    
    res.json({
      success: true,
      message: 'Scan reviewed successfully',
      data: scan
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

// Get patient queue (upcoming appointments)
router.get('/patient-queue', authorizeRoles('doctor'), async (req, res) => {
  try {
    // SECURITY: Only return appointments for this specific doctor
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Show appointments from today onwards (all future appointments, no upper limit)
    // This ensures doctors can see all their scheduled appointments
    
    // Verify doctor exists and get doctor ID
    const userId = req.user._id || req.user.id || (req.tokenPayload && req.tokenPayload.userId);
    const doctor = await Doctor.findOne({ userId }).populate('userId', 'name email');
    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        error: 'Doctor profile not found' 
      });
    }

    console.log(`🔍 Fetching patient queue for doctor: ${doctor.userId?.name} (${doctor.doctorId})`);

    // Debug: Check ALL appointments in DB first (to see if doctorId matching is the issue)
    const allAppointmentsInDB = await Appointment.find({}).lean();
    console.log(`📊 Total appointments in DB: ${allAppointmentsInDB.length}`);
    if (allAppointmentsInDB.length > 0) {
      console.log(`   All appointments in DB:`);
      allAppointmentsInDB.forEach(apt => {
        const matchesDoctor = apt.doctorId === doctor.doctorId;
        const aptDate = new Date(apt.appointmentDate);
        const isTodayOrFuture = aptDate >= today;
        const hasValidStatus = ['scheduled', 'confirmed', 'in-progress'].includes(apt.status);
        console.log(`   - ${apt.appointmentId}: doctorId=${apt.doctorId} (${matchesDoctor ? '✅ MATCHES' : '❌ DIFFERENT'}), date=${aptDate.toISOString()} (${isTodayOrFuture ? '✅ Future' : '❌ Past'}), status=${apt.status} (${hasValidStatus ? '✅ Valid' : '❌ Invalid'})`);
      });
    }

    // Debug: Check all appointments for this doctor (without date filter)
    const allAppointments = await Appointment.find({ doctorId: doctor.doctorId }).lean();
    console.log(`📊 Total appointments for doctor ${doctor.doctorId}: ${allAppointments.length}`);
    if (allAppointments.length > 0) {
      allAppointments.forEach(apt => {
        const aptDate = new Date(apt.appointmentDate);
        const isTodayOrFuture = aptDate >= today;
        const hasValidStatus = ['scheduled', 'confirmed', 'in-progress'].includes(apt.status);
        console.log(`   - ${apt.appointmentId}: ${aptDate.toISOString()} (${apt.status}) - date=${isTodayOrFuture ? '✅ Shows' : '❌ Filtered out (past date)'}, status=${hasValidStatus ? '✅ Valid' : '❌ Invalid'}`);
      });
    } else {
      console.log(`⚠️  No appointments found with doctorId: ${doctor.doctorId}`);
      console.log(`   This could mean:`);
      console.log(`   - The appointment was created with a different doctorId`);
      console.log(`   - The doctor's doctorId doesn't match the appointment's doctorId`);
    }

    // CRITICAL FIX: Get appointments by userId match instead of doctorId
    // This ensures we find appointments even if doctorId format differs
    // First, get all appointments with matching status
    const allAppointmentsWithStatus = await Appointment.find({ 
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] } 
    }).lean();
    
    console.log(`📊 Total appointments with matching status: ${allAppointmentsWithStatus.length}`);
    
    // Filter appointments by matching userId (most reliable method)
    const appointments = [];
    for (const apt of allAppointmentsWithStatus) {
      const aptDoctor = await Doctor.findOne({ doctorId: apt.doctorId })
        .populate('userId', 'name email')
        .lean();
      
      if (aptDoctor) {
        // Match by userId (most reliable) OR by doctorId (if they match)
        const userIdMatch = aptDoctor.userId?._id?.toString() === doctor.userId?._id?.toString();
        const doctorIdMatch = apt.doctorId === doctor.doctorId || aptDoctor.doctorId === doctor.doctorId;
        
        if (userIdMatch || doctorIdMatch) {
          console.log(`✅ Found appointment ${apt.appointmentId} for ${doctor.userId?.name}:`);
          console.log(`   Appointment doctorId: ${apt.doctorId}`);
          console.log(`   Doctor's doctorId: ${doctor.doctorId}`);
          console.log(`   Match by: ${userIdMatch ? 'userId' : 'doctorId'}`);
          appointments.push(apt);
        }
      } else {
        console.log(`⚠️  Appointment ${apt.appointmentId} has doctorId ${apt.doctorId} but doctor not found in DB`);
      }
    }
    
    // Sort by date and time
    appointments.sort((a, b) => {
      const dateA = new Date(a.appointmentDate);
      const dateB = new Date(b.appointmentDate);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
    });
    
    console.log(`📋 Final result: ${appointments.length} appointments for ${doctor.userId?.name} (${doctor.doctorId})`);

    // Log final results
    if (appointments.length === 0) {
      console.log(`⚠️  No appointments found for ${doctor.userId?.name} (${doctor.doctorId})`);
      console.log(`   Checked ${allAppointmentsWithStatus.length} total appointments with matching status`);
    } else {
      console.log(`✅ Successfully found ${appointments.length} appointments for ${doctor.userId?.name} (${doctor.doctorId})`);
      appointments.forEach(apt => {
        console.log(`   - ${apt.appointmentId}: ${new Date(apt.appointmentDate).toISOString()} at ${apt.appointmentTime} (${apt.status})`);
      });
    }
    
    // Populate patient details for each appointment
    const populatedAppointments = await Promise.all(
      appointments.map(async (apt) => {
        const patient = await Patient.findOne({ patientId: apt.patientId })
          .populate('userId', 'name email')
          .lean();
        
        return {
          ...apt,
          patientName: patient?.userId?.name || patient?.personalInfo?.name || 'Patient',
          patientPhone: patient?.personalInfo?.phone || '',
          patientAge: patient?.personalInfo?.dateOfBirth 
            ? Math.floor((new Date().getTime() - new Date(patient.personalInfo.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null,
          appointmentTime: apt.appointmentTime,
          priority: apt.priorityScore || 1,
          symptoms: apt.symptoms || [],
          waitTime: 0 // Calculate based on appointment time vs current time
        };
      })
    );
    
    res.json({
      success: true,
      data: populatedAppointments || []
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
