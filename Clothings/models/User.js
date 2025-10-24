const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return !this.firebaseId;
        }
    },
    firebaseId: {
        type: String,
        unique: true,
        sparse: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    phone: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    addresses: [{
        type: {
            type: String,
            enum: ['billing', 'shipping'],
            required: true
        },
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true,
            default: 'US'
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    preferences: {
        newsletter: {
            type: Boolean,
            default: true
        },
        smsUpdates: {
            type: Boolean,
            default: false
        },
        sizePreferences: {
            tops: String,
            bottoms: String,
            shoes: String
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'moderator'],
        default: 'customer'
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Indexes
// Indexes are already created by unique: true in schema
// userSchema.index({ email: 1 }); // Already created by unique: true
// userSchema.index({ firebaseId: 1 }); // Already created by unique: true
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);