const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    unique: true,
    required: false // Will be generated in pre-save hook
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'hospital'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  // Patient-specific fields
  ongoingMedications: {
    type: [String],
    default: []
  },
  chronicConditions: {
    type: [String],
    default: []
  },
  // Doctor-specific fields
  specialization: {
    type: String,
    trim: true,
    index: true
  },
  qualification: {
    type: String,
    trim: true
  },
  education: {
    type: [String], // Array of degrees/qualifications
    default: []
  },
  experience: {
    type: Number, // Years of experience
    min: 0
  },
  consultationFee: {
    type: Number,
    min: 0
  },
  consultationHours: {
    type: {
      monday: { start: String, end: String, available: Boolean },
      tuesday: { start: String, end: String, available: Boolean },
      wednesday: { start: String, end: String, available: Boolean },
      thursday: { start: String, end: String, available: Boolean },
      friday: { start: String, end: String, available: Boolean },
      saturday: { start: String, end: String, available: Boolean },
      sunday: { start: String, end: String, available: Boolean }
    },
    default: {}
  },
  certificateFile: {
    type: String // URL to uploaded certificate
  },
  clinicName: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  allergies: {
    type: [String],
    default: []
  },
  family_id: {
    type: String,
    index: true
  },
  doctor_id: {
    type: String,
    sparse: true // Only for doctors
  },
  hospital_id: {
    type: String,
    sparse: true // Only for hospitals
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Location fields for hospitals and patients
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Geospatial index for location-based queries
userSchema.index({ latitude: 1, longitude: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Generate unique user_id based on role
userSchema.pre('save', async function(next) {
  if (this.isNew && !this.user_id) {
    const prefix = this.role === 'patient' ? 'PAT' : this.role === 'doctor' ? 'DOC' : 'HOS';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.user_id = `${prefix}-${Date.now().toString().slice(-6)}-${random}`;
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

