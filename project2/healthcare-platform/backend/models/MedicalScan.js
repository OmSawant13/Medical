const mongoose = require('mongoose');

const medicalScanSchema = new mongoose.Schema({
    scanId: {
        type: String,
        unique: true,
        required: true
    },
    patientId: {
        type: String,
        required: true
    },
    doctorId: String,
    hospitalId: String,
    scanType: {
        type: String,
        required: true,
        enum: ['chest-xray', 'brain-mri', 'bone-xray', 'ct-scan', 'ultrasound']
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: Number,
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    aiAnalysis: {
        confidence: Number,
        findings: [String],
        recommendations: [String],
        processingTime: Number,
        modelVersion: String,
        requiresDoctorReview: Boolean
    },
    doctorReview: {
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String,
        approved: Boolean,
        reviewDate: Date
    },
    metadata: {
        originalName: String,
        mimeType: String,
        dimensions: {
            width: Number,
            height: Number
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MedicalScan', medicalScanSchema);