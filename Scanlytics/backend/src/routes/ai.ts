import express from 'express';
import MedicalScan from '../models/MedicalScan';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = express.Router();

// AI service callback for completed analysis
router.post('/analysis-complete', async (req, res) => {
  try {
    const { scanId, result } = req.body;

    if (!scanId || !result) {
      return res.status(400).json({
        success: false,
        error: 'Missing scanId or result'
      });
    }

    const scan = await MedicalScan.findOne({ scanId });
    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }

    // Update scan with AI analysis results
    scan.aiAnalysis = {
      confidence: result.confidence,
      findings: result.findings.map((f: any) => f.description),
      recommendations: result.recommendations.map((r: any) => r.action),
      processingTime: result.metadata.processingTime,
      modelVersion: result.metadata.modelVersion,
      requiresDoctorReview: result.requiresDoctorReview
    };

    scan.status = 'completed';
    await scan.save();

    // Notify relevant parties via Socket.IO
    if (global.io) {
      // Notify patient
      global.io.to(`patient_${scan.patientId}`).emit('analysis_complete', {
        scanId,
        confidence: result.confidence,
        findings: result.findings,
        recommendations: result.recommendations,
        requiresDoctorReview: result.requiresDoctorReview,
        timestamp: new Date().toISOString()
      });

      // Notify doctors if review is required
      if (result.requiresDoctorReview) {
        global.io.to('doctors').emit('review_required', {
          scanId,
          patientId: scan.patientId,
          scanType: scan.scanType,
          confidence: result.confidence,
          priority: result.findings.some((f: any) => f.severity === 'high') ? 'high' : 'medium'
        });
      }
    }

    console.log(`✅ AI analysis completed for scan ${scanId} (confidence: ${result.confidence})`);

    res.json({
      success: true,
      message: 'Analysis result processed successfully'
    });
  } catch (error: any) {
    console.error('Failed to process AI analysis result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process analysis result',
      details: error.message
    });
  }
});

// Get AI service status
router.get('/status', authenticateToken, authorizeRoles('doctor', 'hospital'), async (req, res) => {
  try {
    const pendingScans = await MedicalScan.countDocuments({ status: 'processing' });
    const completedToday = await MedicalScan.countDocuments({
      status: 'completed',
      updatedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    res.json({
      success: true,
      data: {
        status: 'online',
        pendingScans,
        completedToday,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get AI service status',
      details: error.message
    });
  }
});

export default router;
