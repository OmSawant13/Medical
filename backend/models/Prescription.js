const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    prescriptionId: {
        type: String,
        unique: true,
        required: true
    },
    appointmentId: {
        type: String,
        required: true,
        ref: 'Appointment'
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
    // Digital prescription (typed by doctor)
    digitalPrescription: {
        medicines: [{
            name: String,
            dosage: String,
            frequency: String,
            duration: String,
            instructions: String
        }],
        diagnosis: String,
        notes: String,
        followUpDate: Date
    },
    // Image prescription (uploaded by doctor)
    imagePrescription: {
        filePath: String,
        fileName: String,
        fileSize: Number,
        mimeType: String
    },
    prescriptionType: {
        type: String,
        enum: ['digital', 'image', 'both'],
        default: 'digital'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Prescription', prescriptionSchema);

