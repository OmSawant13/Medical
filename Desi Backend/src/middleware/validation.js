const Joi = require('joi');

// Common validation schemas
const commonSchemas = {
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    age: Joi.number().integer().min(18).max(100).required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    name: Joi.string().min(2).max(50).required(),
    bio: Joi.string().max(500).allow(''),
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        address: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required()
    }),
    interests: Joi.array().items(Joi.string()).min(1).max(10).required(),
    photos: Joi.array().items(Joi.string().uri()).min(1).max(6).required()
};

// User registration validation
const validateRegistration = (req, res, next) => {
    const schema = Joi.object({
        email: commonSchemas.email,
        password: commonSchemas.password,
        firstName: commonSchemas.name,
        lastName: commonSchemas.name,
        phone: commonSchemas.phone,
        dateOfBirth: Joi.date().max('now').required(),
        gender: commonSchemas.gender,
        location: commonSchemas.location,
        interests: commonSchemas.interests,
        photos: commonSchemas.photos,
        bio: commonSchemas.bio
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => detail.message)
        });
    }
    next();
};

// User login validation
const validateLogin = (req, res, next) => {
    const schema = Joi.object({
        email: commonSchemas.email,
        password: commonSchemas.password
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => detail.message)
        });
    }
    next();
};

// Profile update validation
const validateProfileUpdate = (req, res, next) => {
    const schema = Joi.object({
        firstName: commonSchemas.name.optional(),
        lastName: commonSchemas.name.optional(),
        bio: commonSchemas.bio,
        age: commonSchemas.age.optional(),
        location: commonSchemas.location.optional(),
        interests: commonSchemas.interests.optional(),
        photos: commonSchemas.photos.optional(),
        height: Joi.number().min(120).max(220).optional(),
        education: Joi.string().max(100).optional(),
        occupation: Joi.string().max(100).optional(),
        relationshipStatus: Joi.string().valid('single', 'divorced', 'widowed').optional(),
        lookingFor: Joi.string().valid('serious', 'casual', 'friendship').optional(),
        drinking: Joi.string().valid('never', 'occasionally', 'frequently').optional(),
        smoking: Joi.string().valid('never', 'occasionally', 'frequently').optional(),
        exercise: Joi.string().valid('never', 'occasionally', 'frequently').optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => detail.message)
        });
    }
    next();
};

// Swipe validation
const validateSwipe = (req, res, next) => {
    const schema = Joi.object({
        targetUserId: Joi.string().required(),
        action: Joi.string().valid('like', 'pass', 'super_like').required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => detail.message)
        });
    }
    next();
};

// Message validation
const validateMessage = (req, res, next) => {
    const schema = Joi.object({
        conversationId: Joi.string().required(),
        content: Joi.string().min(1).max(1000).required(),
        type: Joi.string().valid('text', 'image', 'gif', 'sticker').default('text'),
        replyTo: Joi.string().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => detail.message)
        });
    }
    next();
};

// Location update validation
const validateLocationUpdate = (req, res, next) => {
    const schema = Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        address: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => detail.message)
        });
    }
    next();
};

// Search validation
const validateSearch = (req, res, next) => {
    const schema = Joi.object({
        ageMin: Joi.number().integer().min(18).max(100).optional(),
        ageMax: Joi.number().integer().min(18).max(100).optional(),
        gender: Joi.string().valid('male', 'female', 'all').optional(),
        distance: Joi.number().min(1).max(100).optional(),
        interests: Joi.array().items(Joi.string()).optional(),
        hasPhotos: Joi.boolean().optional(),
        isOnline: Joi.boolean().optional(),
        isVerified: Joi.boolean().optional(),
        sortBy: Joi.string().valid('distance', 'age', 'recent', 'popularity').optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(50).optional()
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => detail.message)
        });
    }
    next();
};

// Report validation
const validateReport = (req, res, next) => {
    const schema = Joi.object({
        reportedUserId: Joi.string().required(),
        reason: Joi.string().valid(
            'inappropriate_photos',
            'harassment',
            'fake_profile',
            'spam',
            'underage',
            'other'
        ).required(),
        description: Joi.string().max(500).optional(),
        evidence: Joi.array().items(Joi.string().uri()).optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => detail.message)
        });
    }
    next();
};

// Premium subscription validation
const validatePremiumSubscription = (req, res, next) => {
    const schema = Joi.object({
        planId: Joi.string().valid('basic', 'premium', 'vip').required(),
        paymentMethod: Joi.string().valid('card', 'upi', 'wallet').required(),
        duration: Joi.string().valid('1_month', '3_months', '6_months', '1_year').required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => detail.message)
        });
    }
    next();
};

// Generic validation middleware
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property]);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }
        next();
    };
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateProfileUpdate,
    validateSwipe,
    validateMessage,
    validateLocationUpdate,
    validateSearch,
    validateReport,
    validatePremiumSubscription,
    validate,
    commonSchemas
};