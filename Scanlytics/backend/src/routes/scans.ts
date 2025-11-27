import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import MedicalScan from '../models/MedicalScan';
import Patient from '../models/Patient';
import { authenticateToken, authorizeRoles, validateHIPAA } from '../middleware/auth';
import { generateScanId } from '../utils/generators';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/scans/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'scan-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/dicom'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and DICOM files are allowed.'));
    }
  }
});

router.use(authenticateToken);
router.use(validateHIPAA);

// Upload medical scan
router.post('/upload', authorizeRoles('hospital', 'doctor'), upload.single('scan'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No scan file provided'
      });
    }

    const { patientId, scanType, metadata } = req.body;

    if (!patientId || !scanType) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID and scan type are required'
      });
    }

    // Verify patient exists
    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    const scanId = generateScanId();

    // Create scan record
    const scan = new MedicalScan({
      scanId,
      patientId,
      scanType,
      filePath: req.file.path,
      fileSize: req.file.size,
      uploadedBy: req.user?._id,
      status: 'pending',
      metadata: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      }
    });

    await scan.save();

    // Send to AI service for analysis
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const formData = new FormData();
      
      // Read file and create blob
      const fileBuffer = fs.readFileSync(req.file.path);
      const blob = new Blob([fileBuffer], { type: req.file.mimetype });
      
      formData.append('image', blob, req.file.originalname);
      formData.append('scanId', scanId);
      formData.append('scanType', scanType);

      // Update status to processing
      scan.status = 'processing';
      await scan.save();

      // Send to AI service (don't await - let it process asynchronously)
      axios.post(`${aiServiceUrl}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000 // 2 minute timeout
      }).then(response => {
        console.log(`✅ AI analysis started for scan ${scanId}`);
      }).catch(error => {
        console.error(`❌ Failed to send scan ${scanId} to AI service:`, error.message);
        // Update scan status to failed
        MedicalScan.findOneAndUpdate(
          { scanId },
          { status: 'failed' },
          { new: true }
        ).exec();
      });

      // Notify via Socket.IO
      if (global.io) {
        global.io.to('doctors').emit('scan_uploaded', {
          scanId,
          patientId,
          scanType,
          uploadedBy: req.user?.name,
          timestamp: new Date().toISOString()
        });
      }

    } catch (aiError) {
      console.error('AI service error:', aiError);
      // Continue with upload success even if AI fails
    }

    res.status(201).json({
      success: true,
      message: 'Scan uploaded successfully',
      data: {
        scanId,
        patientId,
        scanType,
        status: scan.status,
        aiAnalysisETA: '30-60 seconds',
        uploadTime: scan.createdAt
      }
    });
  } catch (error: any) {
    // Clean up file if scan creation failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Scan upload failed',
      details: error.message
    });
  }
});

// Get scan analysis results
router.get('/:scanId/analysis', authorizeRoles('patient', 'doctor', 'hospital'), async (req, res) => {
  try {
    const { scanId } = req.params;

    const scan = await MedicalScan.findOne({ scanId })
      .populate('uploadedBy', 'name')
      .populate('doctorReview.reviewedBy', 'name');

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }

    // Check if user has access to this scan
    if (req.user?.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient?.patientId !== scan.patientId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: {
        scanId: scan.scanId,
        patientId: scan.patientId,
        scanType: scan.scanType,
        status: scan.status,
        aiAnalysis: scan.aiAnalysis,
        doctorReview: scan.doctorReview,
        uploadedBy: scan.uploadedBy,
        createdAt: scan.createdAt,
        updatedAt: scan.updatedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan analysis',
      details: error.message
    });
  }
});

// Get all scans (with filters)
router.get('/', authorizeRoles('doctor', 'hospital'), async (req, res) => {
  try {
    const { patientId, status, scanType, limit = 50, page = 1 } = req.query;
    
    const filters: any = {};
    if (patientId) filters.patientId = patientId;
    if (status) filters.status = status;
    if (scanType) filters.scanType = scanType;

    const skip = (Number(page) - 1) * Number(limit);

    const scans = await MedicalScan.find(filters)
      .populate('uploadedBy', 'name')
      .populate('doctorReview.reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await MedicalScan.countDocuments(filters);

    res.json({
      success: true,
      data: scans,
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
      error: 'Failed to fetch scans',
      details: error.message
    });
  }
});

// Doctor review of AI analysis
router.post('/:scanId/review', authorizeRoles('doctor'), async (req, res) => {
  try {
    const { scanId } = req.params;
    const { notes, approved } = req.body;

    const scan = await MedicalScan.findOne({ scanId });
    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }

    scan.doctorReview = {
      reviewedBy: req.user?._id,
      notes,
      approved,
      reviewDate: new Date()
    };

    if (approved) {
      scan.status = 'completed';
    }

    await scan.save();

    // Notify patient via Socket.IO
    if (global.io) {
      global.io.to(`patient_${scan.patientId}`).emit('analysis_reviewed', {
        scanId,
        approved,
        reviewedBy: req.user?.name,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: scan
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to submit review',
      details: error.message
    });
  }
});

export default router;
