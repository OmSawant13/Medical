const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        unique: true,
        required: true
    },
    patientId: {
        type: String,
        required: true
    },
    doctorId: {
        type: String,
        required: true
    },
    hospitalId: String,
    appointmentDate: {
        type: Date,
        required: true
    },
    appointmentTime: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        default: 30
    },
    type: {
        type: String,
        enum: ['consultation', 'follow-up', 'emergency', 'video-call'],
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
    },
    meetingLink: String,
    qrCode: String,
    notes: String,
    symptoms: [String],
    diagnosis: String,
    prescription: [String],
    followUpRequired: {
        type: Boolean,
        default: false
    },
    followUpDate: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);