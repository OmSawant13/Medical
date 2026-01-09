const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: String,
    unique: true,
    required: true
  },
  specialization: [String],
  licenseNumber: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  qualifications: [String],
  availability: {
    days: [String],
    startTime: String,
    endTime: String
  },
  performanceMetrics: {
    totalConsultations: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);

