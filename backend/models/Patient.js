const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientId: {
        type: String,
        unique: true,
        required: true
    },
    personalInfo: {
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['male', 'female', 'other']
        },
        phone: String,
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String
        }
    },
    medicalInfo: {
        bloodType: String,
        allergies: [String],
        chronicConditions: [String],
        currentMedications: [String],
        insuranceInfo: {
            provider: String,
            policyNumber: String
        }
    },
    priorityScore: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);