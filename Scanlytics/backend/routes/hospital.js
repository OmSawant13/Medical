const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const MedicalScan = require('../models/MedicalScan');
const auth = require('../middleware/auth');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Get hospital profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload medical scan
router.post('/upload-scan', auth, upload.single('scanFile'), async (req, res) => {
  try {
    const { patientId, scanType, patientName } = req.body;
    
    const scan = new MedicalScan({
      patientId,
      patientName,
      scanType,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      filePath: req.file.path,
      uploadedBy: req.user.userId,
      status: 'uploaded',
    });

    await scan.save();
    
    // Simulate AI processing
    setTimeout(async () => {
      scan.status = 'processing';
      await scan.save();
      
      setTimeout(async () => {
        scan.status = 'analysis_complete';
        scan.aiResults = {
          confidence: 0.85 + Math.random() * 0.1,
          findings: ['Analysis complete', 'Preliminary results available'],
          recommendations: ['Doctor review recommended', 'Follow standard protocols'],
        };
        await scan.save();
      }, 5000);
    }, 2000);

    res.status(201).json(scan);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upload history
router.get('/uploads', auth, async (req, res) => {
  try {
    const scans = await MedicalScan.find({ uploadedBy: req.user.userId })
      .sort({ uploadDate: -1 });
    
    res.json(scans);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get system metrics
router.get('/metrics', auth, async (req, res) => {
  try {
    const totalScans = await MedicalScan.countDocuments();
    const processingQueue = await MedicalScan.countDocuments({ status: 'processing' });
    
    res.json({
      totalScans,
      processingQueue,
      averageProcessingTime: '2.3 min',
      systemUptime: '99.8%',
      aiAccuracy: 94.7,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
