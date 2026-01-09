const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  hospitalId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    fullAddress: String
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  contact: {
    phone: String,
    email: String
  },
  specialties: [String],
  facilities: [String],
  rating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isOpen: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Hospital', hospitalSchema);

