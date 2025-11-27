const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  type: { type: String, required: true },
  symptoms: { type: String },
  status: { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled'], default: 'scheduled' },
  qrCode: { type: String },
  meetingLink: { type: String },
  notes: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Appointment', appointmentSchema);
