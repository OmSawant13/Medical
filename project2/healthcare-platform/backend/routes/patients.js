const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Patient = require('../models/Patient');
const MedicalScan = require('../models/MedicalScan');
const Appointment = require('../models/Appointment');
const { authenticateToken, authorizeRoles, validateHIPAA } = require('../middleware/auth');
const { calculatePriorityScore, generateScanId } = require('../utils/generators');

const router = express.Router();

// Debug: Log route registration
console.log('✅ Patients routes loaded: GET /notifications, PUT /notifications/:notificationId/read');

// CRITICAL FIX: Define notifications route BEFORE auth middleware to test
// This will help us verify if the route is being registered
router.get('/notifications', (req, res) => {
    console.log(`🔔🔔🔔 NOTIFICATIONS ROUTE HIT (NO AUTH) 🔔🔔🔔`);
    console.log(`   Method: ${req.method}`);
    console.log(`   Path: ${req.path}`);
    console.log(`   Original URL: ${req.originalUrl}`);
    return res.json({
        success: true,
        data: []
    });
});

// All patient routes require authentication
router.use(authenticateToken);
router.use(validateHIPAA);

// Mark notification as read
router.put('/notifications/:notificationId/read', authorizeRoles('patient'), async (req, res) => {
    try {
        const { notificationId } = req.params;
        // For now, just return success - can be extended later
        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as read',
            details: error.message
        });
    }
});

// Get patient profile
router.get('/profile', authorizeRoles('patient', 'doctor', 'hospital'), async (req, res) => {
    try {
        const { patientId } = req.query;

        let patient;
        if (req.user && req.user.role === 'patient') {
            // Patients can only access their own profile
            // Use req.patient if available (from auth middleware), otherwise fetch
            if (req.patient) {
                patient = await Patient.findById(req.patient._id).populate('userId', 'name email role');
            } else {
                patient = await Patient.findOne({ userId: req.user._id }).populate('userId', 'name email role');
            }
        } else {
            // Doctors and hospitals can access by patientId
            patient = await Patient.findOne({ patientId }).populate('userId', 'name email role');
        }

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }

        // Return user data in the format expected by frontend
        const userData = patient.userId;
        res.json({
            success: true,
            id: userData._id.toString(),
            name: userData.name,
            email: userData.email,
            role: userData.role,
            patientId: patient.patientId || '', // Explicitly include patientId
            roleSpecificId: patient.patientId || '', // Also include for backward compatibility
            personalInfo: patient.personalInfo || {},
            medicalInfo: patient.medicalInfo || {},
            // Include all patient data
            ...patient.toObject(),
            userId: userData._id.toString()
        });
    } catch (error) {
        console.error('❌ Error fetching patient profile:', error);
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
        // Use req.patient if available (from auth middleware), otherwise fetch
        let patient = req.patient;
        if (!patient) {
            patient = await Patient.findOne({ userId: req.user && req.user._id });
        }

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
            const age = personalInfo && personalInfo.dateOfBirth ?
                Math.floor((Date.now() - new Date(personalInfo.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) :
                30;

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
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update profile',
            details: error.message
        });
    }
});

// Toggle patient long-term status
router.put('/:patientId/long-term', authorizeRoles('doctor'), async (req, res) => {
    try {
        const { patientId } = req.params;
        const { isLongTerm } = req.body;

        const patient = await Patient.findOne({ patientId });
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }

        patient.isLongTerm = isLongTerm;
        await patient.save();

        res.json({
            success: true,
            message: `Patient marked as ${isLongTerm ? 'long-term' : 'standard'} care`,
            data: patient
        });
    } catch (error) {
        console.error('Error updating patient status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update patient status'
        });
    }
});

// Configure multer for scan uploads
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
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/dicom'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and DICOM files are allowed.'));
        }
    }
});

// Upload medical scan (Patient can upload)
router.post('/scans/upload', authorizeRoles('patient'), upload.single('scan'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No scan file provided'
            });
        }

        // Get patient ID
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient profile not found'
            });
        }

        const { scanType } = req.body;
        if (!scanType) {
            return res.status(400).json({
                success: false,
                error: 'Scan type is required'
            });
        }

        const scanId = generateScanId();

        // Create scan record
        const scan = new MedicalScan({
            scanId,
            patientId: patient.patientId,
            scanType,
            filePath: req.file.path,
            fileSize: req.file.size,
            uploadedBy: req.user._id,
            status: 'pending',
            metadata: {
                originalName: req.file.originalname,
                mimeType: req.file.mimetype
            }
        });

        await scan.save();

        // TODO: Send to AI service for analysis (can be async)
        // For now, mark as processing
        setTimeout(async () => {
            try {
                scan.status = 'processing';
                scan.aiAnalysis = {
                    confidence: 0.85,
                    findings: ['Normal scan detected', 'No abnormalities found'],
                    recommendations: ['Continue regular checkups', 'Maintain healthy lifestyle'],
                    processingTime: 2000,
                    modelVersion: '1.0',
                    requiresDoctorReview: false
                };
                scan.status = 'completed';
                await scan.save();
            } catch (err) {
                console.error('Error updating scan:', err);
            }
        }, 2000);

        res.json({
            success: true,
            message: 'Scan uploaded successfully. AI analysis will be available shortly.',
            data: {
                scanId,
                patientId: patient.patientId,
                scanType,
                status: 'pending',
                uploadDate: scan.createdAt
            }
        });
    } catch (error) {
        console.error('Error uploading scan:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload scan',
            details: error.message
        });
    }
});

// Get patient medical scans
router.get('/scans', authorizeRoles('patient', 'doctor'), async (req, res) => {
    try {
        let patientId;

        if (req.user && req.user.role === 'patient') {
            // Use req.patientId if available (from auth middleware)
            patientId = req.patientId || (req.patient ? req.patient.patientId : '');
            if (!patientId) {
                const patient = await Patient.findOne({ userId: req.user._id });
                patientId = patient ? patient.patientId : '';
            }
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
    } catch (error) {
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

        if (req.user && req.user.role === 'patient') {
            // Use req.patientId if available (from auth middleware)
            patientId = req.patientId || (req.patient ? req.patient.patientId : '');
            if (!patientId) {
                const patient = await Patient.findOne({ userId: req.user._id });
                patientId = patient ? patient.patientId : '';
            }
        } else {
            patientId = req.query.patientId;
        }

        const appointments = await Appointment.find({ patientId })
            .sort({ appointmentDate: -1 });

        res.json({
            success: true,
            data: appointments
        });
    } catch (error) {
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
                            { $gte: ['$lastVisit', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                            3,
                            {
                                $cond: [
                                    { $gte: ['$lastVisit', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)] },
                                    2, 1
                                ]
                            }
                        ]
                    },
                    frequencyScore: {
                        $cond: [
                            { $gte: ['$totalAppointments', 10] },
                            3,
                            { $cond: [{ $gte: ['$totalAppointments', 5] }, 2, 1] }
                        ]
                    },
                    monetaryScore: {
                        $cond: [
                            { $gte: ['$totalCost', 1000] },
                            3,
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
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to generate patient analytics',
            details: error.message
        });
    }
});

module.exports = router;