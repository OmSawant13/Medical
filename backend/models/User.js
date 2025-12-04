const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'hospital'], required: true },
  name: { type: String, required: true },
  roleSpecificId: { type: String, unique: true, sparse: true },
  age: { type: Number },
  
  // Common fields
  phone: { type: String },
  address: { type: String },
  
  // Patient specific fields
  dateOfBirth: { type: String },
  bloodType: { type: String },
  emergencyContact: { type: String },
  allergies: [{ type: String }],
  medications: [{ type: String }],
  
  // Doctor specific fields
  specialization: { type: String },
  licenseNumber: { type: String },
  yearsOfExperience: { type: Number },
  hospitalAffiliation: { type: String },
  consultationFee: { type: Number },
  availability: {
    monday: { available: { type: Boolean, default: true }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
    tuesday: { available: { type: Boolean, default: true }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
    wednesday: { available: { type: Boolean, default: true }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
    thursday: { available: { type: Boolean, default: true }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
    friday: { available: { type: Boolean, default: true }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
    saturday: { available: { type: Boolean, default: false }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
    sunday: { available: { type: Boolean, default: false }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
  },
  
  // Notification preferences
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    appointmentReminders: { type: Boolean, default: true },
    scanResults: { type: Boolean, default: true },
    medicationReminders: { type: Boolean, default: true },
    newPatients: { type: Boolean, default: true },
    urgentCases: { type: Boolean, default: true },
    aiAlerts: { type: Boolean, default: true },
  },
  
  // Privacy settings
  privacy: {
    shareDataWithDoctors: { type: Boolean, default: true },
    shareDataForResearch: { type: Boolean, default: false },
    allowMarketingEmails: { type: Boolean, default: false },
  },
  
  // Hospital specific fields
  hospitalName: { type: String },
  hospitalType: { type: String },
  
  lastLogin: { type: Date },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
