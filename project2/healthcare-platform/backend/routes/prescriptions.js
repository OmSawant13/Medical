const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { generatePrescriptionId } = require('../utils/generators');

const router = express.Router();

// All prescription routes require authentication
router.use(authenticateToken);

// Configure multer for prescription image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/prescriptions/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'prescription-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and PDF files are allowed.'));
        }
    }
});

// Doctor uploads prescription (digital or image)
router.post('/', authorizeRoles('doctor'), upload.single('prescriptionImage'), async (req, res) => {
    try {
        const { appointmentId, medicines, diagnosis, notes, followUpDate, prescriptionType } = req.body;

        console.log('📋 Prescription creation request:', {
            appointmentId,
            hasDiagnosis: !!diagnosis,
            hasNotes: !!notes,
            hasMedicines: !!medicines,
            hasImage: !!req.file
        });

        if (!appointmentId) {
            return res.status(400).json({
                success: false,
                error: 'Appointment ID is required'
            });
        }

        // Verify appointment exists and belongs to this doctor
        const appointment = await Appointment.findOne({ appointmentId });
        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        // Check if doctor is authorized
        const Doctor = require('../models/Doctor');
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor || doctor.doctorId !== appointment.doctorId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: This appointment does not belong to you'
            });
        }

        const prescriptionId = generatePrescriptionId();

        // Parse medicines if provided as JSON string
        let medicinesArray = [];
        if (medicines) {
            try {
                medicinesArray = typeof medicines === 'string' ? JSON.parse(medicines) : medicines;
            } catch (e) {
                medicinesArray = Array.isArray(medicines) ? medicines : [];
            }
        }

        // Ensure at least some data is provided
        if (!diagnosis && !notes && medicinesArray.length === 0 && !req.file) {
            return res.status(400).json({
                success: false,
                error: 'At least one of the following is required: diagnosis, notes, medicines, or prescription image'
            });
        }

        const prescriptionData = {
            prescriptionId,
            appointmentId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            hospitalId: appointment.hospitalId || null,
            diagnosis: diagnosis || '', // Top-level diagnosis for easy access
            notes: notes || '', // Top-level notes for easy access
            prescriptionType: prescriptionType || (req.file ? 'image' : 'digital'),
            digitalPrescription: {
                medicines: medicinesArray,
                diagnosis: diagnosis || '',
                notes: notes || '',
                followUpDate: followUpDate ? new Date(followUpDate) : null
            }
        };

        // If image uploaded
        if (req.file) {
            prescriptionData.imagePrescription = {
                filePath: req.file.path,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            };
            if (prescriptionData.prescriptionType === 'digital') {
                prescriptionData.prescriptionType = 'both';
            }
        }

        const prescription = new Prescription(prescriptionData);
        await prescription.save();

        // Update appointment with prescription reference and diagnosis
        appointment.prescription = medicinesArray.map(m => `${m.name} - ${m.dosage}`); // For backward compatibility
        if (diagnosis) {
            appointment.diagnosis = diagnosis;
        }
        if (notes) {
            appointment.notes = notes;
        }
        await appointment.save();

        console.log('✅ Prescription saved:', {
            prescriptionId: prescription.prescriptionId,
            appointmentId: prescription.appointmentId,
            patientId: prescription.patientId,
            hasDiagnosis: !!prescription.diagnosis,
            hasMedicines: prescription.digitalPrescription?.medicines?.length > 0,
            hasImage: !!prescription.imagePrescription
        });

        res.status(201).json({
            success: true,
            message: 'Prescription uploaded successfully',
            data: prescription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to upload prescription',
            details: error.message
        });
    }
});

// Patient gets all prescriptions (doctors can also access by patientId)
router.get('/patient', authorizeRoles('patient', 'doctor'), async (req, res) => {
    try {
        const Patient = require('../models/Patient');
        let patient;
        let patientId;

        if (req.user.role === 'patient') {
            // Patients can only access their own prescriptions
            patient = await Patient.findOne({ userId: req.user._id });
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    error: 'Patient not found'
                });
            }
            patientId = patient.patientId;
        } else if (req.user.role === 'doctor') {
            // Doctors can access by patientId query parameter
            patientId = req.query.patientId;
            if (!patientId) {
                return res.status(400).json({
                    success: false,
                    error: 'patientId is required for doctors'
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        const prescriptions = await Prescription.find({ patientId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: prescriptions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch prescriptions',
            details: error.message
        });
    }
});

// Patient downloads prescription (image or PDF)
router.get('/:prescriptionId/download', authorizeRoles('patient'), async (req, res) => {
    try {
        const { prescriptionId } = req.params;

        const Patient = require('../models/Patient');
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }

        const prescription = await Prescription.findOne({ prescriptionId });
        if (!prescription) {
            return res.status(404).json({
                success: false,
                error: 'Prescription not found'
            });
        }

        // Verify patient owns this prescription
        if (prescription.patientId !== patient.patientId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: This prescription does not belong to you'
            });
        }

        // If image prescription exists
        if (prescription.imagePrescription && prescription.imagePrescription.filePath) {
            const filePath = prescription.imagePrescription.filePath;

            if (fs.existsSync(filePath)) {
                res.download(filePath, prescription.imagePrescription.fileName, (err) => {
                    if (err) {
                        res.status(500).json({
                            success: false,
                            error: 'Failed to download file'
                        });
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Prescription file not found'
                });
            }
        } else {
            // Generate PDF from digital prescription
            res.json({
                success: true,
                message: 'Digital prescription - use /view endpoint',
                data: prescription.digitalPrescription
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to download prescription',
            details: error.message
        });
    }
});

// Patient views prescription details
router.get('/:prescriptionId', authorizeRoles('patient', 'doctor'), async (req, res) => {
    try {
        const { prescriptionId } = req.params;

        const prescription = await Prescription.findOne({ prescriptionId })
            .populate('appointmentId', 'appointmentDate appointmentTime symptoms diagnosis');

        if (!prescription) {
            return res.status(404).json({
                success: false,
                error: 'Prescription not found'
            });
        }

        // Verify authorization
        if (req.user.role === 'patient') {
            const Patient = require('../models/Patient');
            const patient = await Patient.findOne({ userId: req.user._id });
            if (prescription.patientId !== patient.patientId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized'
                });
            }
        }

        res.json({
            success: true,
            data: prescription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch prescription',
            details: error.message
        });
    }
});

module.exports = router;

