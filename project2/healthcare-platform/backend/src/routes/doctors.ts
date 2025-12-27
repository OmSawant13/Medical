import express from 'express';
import Doctor from '../models/Doctor';
import MedicalScan from '../models/MedicalScan';
import Appointment from '../models/Appointment';
import { authenticateToken, authorizeRoles, validateHIPAA } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);
router.use(validateHIPAA);

// Get doctor profile
router.get('/profile', authorizeRoles('doctor', 'hospital'), async (req, res) => {
  try {
    const { doctorId } = req.query;
    
    let doctor;
    if (req.user?.role === 'doctor') {
      doctor = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'name email');
    } else {
      doctor = await Doctor.findOne({ doctorId }).populate('userId', 'name email');
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor profile',
      details: error.message
    });
  }
});

// Get pending reviews for doctor
router.get('/pending-reviews', authorizeRoles('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user?._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found'
      });
    }

    const pendingScans = await MedicalScan.find({
      status: 'completed',
      'aiAnalysis.requiresDoctorReview': true,
      'doctorReview.reviewedBy': { $exists: false }
    }).populate('uploadedBy', 'name');

    res.json({
      success: true,
      data: pendingScans
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending reviews',
      details: error.message
    });
  }
});

// Get doctor performance metrics
router.get('/metrics', authorizeRoles('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user?._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found'
      });
    }

    const [appointmentStats, reviewStats] = await Promise.all([
      Appointment.aggregate([
        { $match: { doctorId: doctor.doctorId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      MedicalScan.aggregate([
        { $match: { 'doctorReview.reviewedBy': req.user?._id } },
        {
          $group: {
            _id: '$doctorReview.approved',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const totalAppointments = appointmentStats.reduce((sum, stat) => sum + stat.count, 0);
    const completedAppointments = appointmentStats.find(s => s._id === 'completed')?.count || 0;
    const totalReviews = reviewStats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      success: true,
      data: {
        totalAppointments,
        completedAppointments,
        completionRate: totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(1) : 0,
        totalReviews,
        averageRating: doctor.performanceMetrics.averageRating,
        appointmentBreakdown: appointmentStats,
        reviewBreakdown: reviewStats
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor metrics',
      details: error.message
    });
  }
});

export default router;
