const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointment_id: {
    type: String,
    unique: true,
    required: false // Will be generated in pre-save hook
  },
  patient_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  doctor_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  date_time: {
    type: Date,
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  uploaded_files: {
    type: [String], // URLs to uploaded files
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'cancelled'],
    default: 'pending'
  },
  qr_code: {
    type: String,
    unique: true,
    sparse: true
  },
  expires_at: {
    type: Date,
    required: true
  },
  visit_completed: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate appointment_id before saving
appointmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.appointment_id) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.appointment_id = `APT-${Date.now().toString().slice(-8)}-${random}`;
  }
  next();
});

// Index for efficient queries
appointmentSchema.index({ patient_id: 1, date_time: -1 });
appointmentSchema.index({ doctor_id: 1, date_time: -1 });
appointmentSchema.index({ qr_code: 1 });
appointmentSchema.index({ expires_at: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

