const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    unique: true,
    required: true
  },
  appointmentId: {
    type: String,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  doctorId: {
    type: String,
    required: true
  },
  hospitalId: {
    type: String,
    required: false
  },
  diagnosis: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  digitalPrescription: {
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    diagnosis: String,
    notes: String,
    followUpDate: Date
  },
  imagePrescription: {
    filePath: String,
    fileName: String,
    fileSize: Number,
    mimeType: String
  },
  prescriptionType: {
    type: String,
    enum: ['digital', 'image', 'both'],
    default: 'digital'
  },
  followUpDate: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
prescriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Prescription', prescriptionSchema);

