const mongoose = require('mongoose');

const medicalScanSchema = new mongoose.Schema({
  scanId: {
    type: String,
    unique: true,
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  scanType: {
    type: String,
    required: true,
    enum: ['chest-xray', 'brain-mri', 'ct-scan', 'ultrasound', 'other']
  },
  imageUrl: {
    type: String,
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
  doctorNotes: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MedicalScan', medicalScanSchema);

