const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  record_id: {
    type: String,
    unique: true,
    required: true
  },
  patient_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  doctor_id: {
    type: String,
    ref: 'User',
    index: true
  },
  hospital_id: {
    type: String,
    ref: 'User',
    index: true
  },
  appointment_id: {
    type: String,
    ref: 'Appointment'
  },
  summary: {
    type: String,
    default: ''
  },
  ai_summary: {
    type: String,
    default: ''
  },
  files: {
    type: [String], // URLs to files
    default: []
  },
  record_type: {
    type: String,
    enum: ['prescription', 'lab_test', 'xray', 'discharge_summary', 'other'],
    default: 'other'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate record_id before saving
medicalRecordSchema.pre('save', async function(next) {
  if (this.isNew && !this.record_id) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.record_id = `REC-${Date.now().toString().slice(-8)}-${random}`;
  }
  next();
});

// Indexes for efficient queries
medicalRecordSchema.index({ patient_id: 1, timestamp: -1 });
medicalRecordSchema.index({ doctor_id: 1, timestamp: -1 });
medicalRecordSchema.index({ hospital_id: 1, timestamp: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);

