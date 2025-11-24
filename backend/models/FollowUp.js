const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  followup_id: {
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
    required: true,
    ref: 'User',
    index: true
  },
  appointment_id: {
    type: String,
    ref: 'Appointment'
  },
  scheduled_date: {
    type: Date,
    required: true,
    index: true
  },
  reason: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  reminder_sent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate followup_id before saving
followUpSchema.pre('save', async function(next) {
  if (this.isNew && !this.followup_id) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.followup_id = `FU-${Date.now().toString().slice(-8)}-${random}`;
  }
  next();
});

// Indexes for efficient queries
followUpSchema.index({ patient_id: 1, scheduled_date: -1 });
followUpSchema.index({ doctor_id: 1, scheduled_date: -1 });
followUpSchema.index({ scheduled_date: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);

