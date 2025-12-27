import express from 'express';
import Patient from '../models/Patient';
import MedicalScan from '../models/MedicalScan';
import Appointment from '../models/Appointment';
import { authenticateToken, authorizeRoles, validateHIPAA } from '../middleware/auth';
import { calculatePriorityScore } from '../utils/generators';

const router = express.Router();

// All patient routes require authentication
router.use(authenticateToken);
router.use(validateHIPAA);

// Get patient profile
router.get('/profile', authorizeRoles('patient', 'doctor', 'hospital'), async (req, res) => {
  try {
    const { patientId } = req.query;
    
    let patient;
    if (req.user?.role === 'patient') {
      // Patients can only access their own profile
      patient = await Patient.findOne({ userId: req.user._id }).populate('userId', 'name email');
    } else {
      // Doctors and hospitals can access by patientId
      patient = await Patient.findOne({ patientId }).populate('userId', 'name email');
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient profile',
      details: error.message
    });
  }
});

// Update patient profile
router.put('/profile', authorizeRoles('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user?._id });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found'
      });
    }

    const { personalInfo, medicalInfo } = req.body;

    if (personalInfo) {
      patient.personalInfo = { ...patient.personalInfo, ...personalInfo };
    }
    
    if (medicalInfo) {
      patient.medicalInfo = { ...patient.medicalInfo, ...medicalInfo };
      
      // Recalculate priority score if symptoms or conditions changed
      const symptoms = medicalInfo.currentSymptoms || [];
      const age = personalInfo?.dateOfBirth 
        ? Math.floor((Date.now() - new Date(personalInfo.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 30;
      
      patient.priorityScore = calculatePriorityScore(
        symptoms,
        age,
        medicalInfo.chronicConditions || []
      );
    }

    await patient.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: patient
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: error.message
    });
  }
});

// Get patient medical scans
router.get('/scans', authorizeRoles('patient', 'doctor'), async (req, res) => {
  try {
    let patientId;
    
    if (req.user?.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      patientId = patient?.patientId;
    } else {
      patientId = req.query.patientId;
    }

    const scans = await MedicalScan.find({ patientId })
      .populate('uploadedBy', 'name')
      .populate('doctorReview.reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: scans
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch medical scans',
      details: error.message
    });
  }
});

// Get patient appointments
router.get('/appointments', authorizeRoles('patient', 'doctor'), async (req, res) => {
  try {
    let patientId;
    
    if (req.user?.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      patientId = patient?.patientId;
    } else {
      patientId = req.query.patientId;
    }

    const appointments = await Appointment.find({ patientId })
      .sort({ appointmentDate: -1 });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments',
      details: error.message
    });
  }
});

// Get patient analytics (for RFM analysis demo)
router.get('/analytics', authorizeRoles('doctor', 'hospital'), async (req, res) => {
  try {
    const analytics = await Patient.aggregate([
      // Match active patients from last year
      {
        $lookup: {
          from: 'appointments',
          localField: 'patientId',
          foreignField: 'patientId',
          as: 'appointments'
        }
      },
      {
        $lookup: {
          from: 'medicalscans',
          localField: 'patientId',
          foreignField: 'patientId',
          as: 'scans'
        }
      },
      {
        $addFields: {
          totalAppointments: { $size: '$appointments' },
          totalScans: { $size: '$scans' },
          lastVisit: { $max: '$appointments.appointmentDate' },
          totalCost: {
            $sum: {
              $map: {
                input: '$appointments',
                as: 'appointment',
                in: { $ifNull: ['$$appointment.cost', 150] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          recencyScore: {
            $cond: [
              { $gte: ['$lastVisit', new Date(Date.now() - 30*24*60*60*1000)] }, 3,
              { $cond: [
                { $gte: ['$lastVisit', new Date(Date.now() - 90*24*60*60*1000)] }, 2, 1
              ]}
            ]
          },
          frequencyScore: {
            $cond: [
              { $gte: ['$totalAppointments', 10] }, 3,
              { $cond: [{ $gte: ['$totalAppointments', 5] }, 2, 1] }
            ]
          },
          monetaryScore: {
            $cond: [
              { $gte: ['$totalCost', 1000] }, 3,
              { $cond: [{ $gte: ['$totalCost', 500] }, 2, 1] }
            ]
          }
        }
      },
      {
        $addFields: {
          rfmScore: { $add: ['$recencyScore', '$frequencyScore', '$monetaryScore'] },
          segment: {
            $switch: {
              branches: [
                { case: { $gte: ['$rfmScore', 8] }, then: 'VIP_Patient' },
                { case: { $gte: ['$rfmScore', 6] }, then: 'Regular_Patient' },
                { case: { $gte: ['$rfmScore', 4] }, then: 'At_Risk_Patient' }
              ],
              default: 'New_Patient'
            }
          }
        }
      },
      { $sort: { rfmScore: -1 } }
    ]);

    res.json({
      success: true,
      data: analytics,
      summary: {
        totalPatients: analytics.length,
        vipPatients: analytics.filter(p => p.segment === 'VIP_Patient').length,
        regularPatients: analytics.filter(p => p.segment === 'Regular_Patient').length,
        atRiskPatients: analytics.filter(p => p.segment === 'At_Risk_Patient').length,
        newPatients: analytics.filter(p => p.segment === 'New_Patient').length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate patient analytics',
      details: error.message
    });
  }
});

export default router;
