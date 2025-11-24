const mongoose = require('mongoose');

const longTermPatientSchema = new mongoose.Schema({
  longterm_id: {
    type: String,
    unique: true,
    required: false
  },
  doctor_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  patient_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  appointment_id: {
    type: String,
    ref: 'Appointment'
  },
  reason: {
    type: String,
    trim: true,
    default: ''
  },
  diagnosis: {
    type: String,
    trim: true,
    default: ''
  },
  treatment_plan: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'monitoring', 'recovered', 'discharged'],
    default: 'active'
  },
  start_date: {
    type: Date,
    default: Date.now
  },
  last_check_date: {
    type: Date,
    default: Date.now
  },
  next_check_date: {
    type: Date
  },
  check_frequency: {
    type: String,
    enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
    default: 'daily'
  },
  notes: [{
    date: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      required: true
    },
    doctor_id: {
      type: String,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate longterm_id before saving
longTermPatientSchema.pre('save', async function(next) {
  if (this.isNew && !this.longterm_id) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.longterm_id = `LTP-${Date.now().toString().slice(-8)}-${random}`;
  }
  next();
});

// Index for efficient queries
longTermPatientSchema.index({ doctor_id: 1, status: 1 });
longTermPatientSchema.index({ patient_id: 1 });
longTermPatientSchema.index({ next_check_date: 1 });

module.exports = mongoose.model('LongTermPatient', longTermPatientSchema);

