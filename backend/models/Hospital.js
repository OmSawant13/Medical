const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hospitalId: {
        type: String,
        unique: true,
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
        country: {
            type: String,
            default: 'India'
        },
        fullAddress: String
    },
    location: {
        latitude: Number,
        longitude: Number
    },
    phone: String,
    email: String,
    departments: [String],
    facilities: [String],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for location-based search
hospitalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hospital', hospitalSchema);

