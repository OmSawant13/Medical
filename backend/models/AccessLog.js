const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  log_id: {
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
  accessed_by: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  access_type: {
    type: String,
    enum: ['view_profile', 'view_records', 'view_family_history', 'upload_record', 'scan_qr'],
    required: true
  },
  resource_type: {
    type: String,
    enum: ['patient_profile', 'medical_record', 'family_history', 'appointment'],
    required: true
  },
  resource_id: {
    type: String
  },
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Generate log_id before saving
accessLogSchema.pre('save', async function(next) {
  if (this.isNew && !this.log_id) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.log_id = `LOG-${Date.now().toString().slice(-8)}-${random}`;
  }
  next();
});

// Indexes for efficient queries
accessLogSchema.index({ patient_id: 1, timestamp: -1 });
accessLogSchema.index({ accessed_by: 1, timestamp: -1 });
accessLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);

