const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema({
  share_id: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  patient_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  shared_with: {
    type: String, // Doctor user_id
    ref: 'User',
    index: true
  },
  token: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  expires_at: {
    type: Date,
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate share_id before saving
shareLinkSchema.pre('save', async function(next) {
  if (this.isNew && !this.share_id) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.share_id = `SHARE-${Date.now().toString().slice(-8)}-${random}`;
  }
  next();
});

// Index for efficient queries
shareLinkSchema.index({ patient_id: 1, isActive: 1 });
shareLinkSchema.index({ token: 1 });
shareLinkSchema.index({ expires_at: 1 });

module.exports = mongoose.model('ShareLink', shareLinkSchema);

