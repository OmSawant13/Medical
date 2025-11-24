const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  family_id: {
    type: String,
    unique: true,
    required: false, // Will be generated in pre-save hook
    index: true
  },
  members: {
    type: [String], // Array of user_ids
    default: [],
    index: true
  },
  parent_family_id: {
    type: String,
    ref: 'Family',
    default: null,
    index: true
  },
  medical_pattern: {
    type: {
      hereditary_diseases: [String],
      risk_factors: [String],
      summary: String,
      analyzed_at: Date
    },
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate family_id before saving
familySchema.pre('save', async function(next) {
  if (this.isNew && !this.family_id) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.family_id = `FAM-${Date.now().toString().slice(-8)}-${random}`;
  }
  next();
});

// Index for ancestry queries
familySchema.index({ parent_family_id: 1 });

module.exports = mongoose.model('Family', familySchema);

