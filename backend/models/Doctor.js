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
    licenseNumber: String,
    experience: {
        type: Number,
        default: 0
    },
    qualifications: [String],
    hospitalAffiliation: String,
    consultationFee: {
        type: Number,
        default: 0
    },
    availability: {
        monday: { available: Boolean, startTime: String, endTime: String },
        tuesday: { available: Boolean, startTime: String, endTime: String },
        wednesday: { available: Boolean, startTime: String, endTime: String },
        thursday: { available: Boolean, startTime: String, endTime: String },
        friday: { available: Boolean, startTime: String, endTime: String },
        saturday: { available: Boolean, startTime: String, endTime: String },
        sunday: { available: Boolean, startTime: String, endTime: String }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);