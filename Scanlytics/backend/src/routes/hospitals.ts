import express from 'express';
import MedicalScan from '../models/MedicalScan';
import Appointment from '../models/Appointment';
import Patient from '../models/Patient';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('hospital'));

// Hospital dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      totalPatients,
      todayAppointments,
      todayScans,
      pendingScans,
      completedScans
    ] = await Promise.all([
      Patient.countDocuments(),
      Appointment.countDocuments({
        appointmentDate: { $gte: startOfDay, $lte: endOfDay }
      }),
      MedicalScan.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }),
      MedicalScan.countDocuments({ status: 'processing' }),
      MedicalScan.countDocuments({ 
        status: 'completed',
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      })
    ]);

    const appointmentsByStatus = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalPatients,
        todayAppointments,
        todayScans,
        pendingScans,
        completedScans,
        appointmentsByStatus,
        systemStatus: {
          aiService: pendingScans === 0 ? 'idle' : 'processing',
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error.message
    });
  }
});

// System health check
router.get('/system-health', async (req, res) => {
  try {
    const dbHealth = await Patient.findOne().limit(1);
    
    res.json({
      success: true,
      data: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        aiService: 'healthy', // Would check AI service in production
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'System health check failed',
      details: error.message
    });
  }
});

export default router;
