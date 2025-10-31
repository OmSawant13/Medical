const jwt = require('jsonwebtoken');
const { auth } = require('../config/firebase');

// Middleware to verify JWT token
const authenticateToken = async(req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify Firebase token
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            email_verified: decodedToken.email_verified,
            name: decodedToken.name,
            picture: decodedToken.picture
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Middleware to check if user is premium
const checkPremium = async(req, res, next) => {
    try {
        const { db, COLLECTIONS } = require('../config/firebase');

        const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.user.uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userData = userDoc.data();

        if (!userData.isPremium || !userData.premiumExpiresAt) {
            return res.status(403).json({
                success: false,
                message: 'Premium subscription required'
            });
        }

        // Check if premium subscription is still valid
        if (new Date() > userData.premiumExpiresAt.toDate()) {
            return res.status(403).json({
                success: false,
                message: 'Premium subscription has expired'
            });
        }

        req.user.isPremium = true;
        next();
    } catch (error) {
        console.error('Premium check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking premium status'
        });
    }
};

// Middleware to check if user profile is complete
const checkCompleteProfile = async(req, res, next) => {
    try {
        const { db, COLLECTIONS } = require('../config/firebase');

        const profileDoc = await db.collection(COLLECTIONS.PROFILES).doc(req.user.uid).get();

        if (!profileDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found. Please complete your profile.'
            });
        }

        const profileData = profileDoc.data();
        const requiredFields = ['firstName', 'lastName', 'age', 'gender', 'location', 'interests', 'photos'];

        const missingFields = requiredFields.filter(field => {
            if (field === 'photos') {
                return !profileData[field] || profileData[field].length === 0;
            }
            return !profileData[field];
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Profile incomplete',
                missingFields
            });
        }

        req.user.profile = profileData;
        next();
    } catch (error) {
        console.error('Profile check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking profile completeness'
        });
    }
};

// Middleware to check if user is verified
const checkVerified = async(req, res, next) => {
    try {
        const { db, COLLECTIONS } = require('../config/firebase');

        const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.user.uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userData = userDoc.data();

        if (!userData.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Account verification required'
            });
        }

        next();
    } catch (error) {
        console.error('Verification check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking verification status'
        });
    }
};

// Middleware to check if user is active (not banned/suspended)
const checkActive = async(req, res, next) => {
    try {
        const { db, COLLECTIONS } = require('../config/firebase');

        const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.user.uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userData = userDoc.data();

        if (userData.status === 'banned') {
            return res.status(403).json({
                success: false,
                message: 'Account has been banned'
            });
        }

        if (userData.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Account has been suspended'
            });
        }

        if (userData.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is not active'
            });
        }

        next();
    } catch (error) {
        console.error('Active check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking account status'
        });
    }
};

// Middleware to check rate limiting (basic implementation)
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        const clientId = req.user?.uid || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old entries
        for (const [key, value] of requests.entries()) {
            if (value.timestamp < windowStart) {
                requests.delete(key);
            }
        }

        const clientRequests = requests.get(clientId) || { count: 0, timestamp: now };

        if (clientRequests.timestamp < windowStart) {
            clientRequests.count = 1;
            clientRequests.timestamp = now;
        } else {
            clientRequests.count++;
        }

        requests.set(clientId, clientRequests);

        if (clientRequests.count > maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later'
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    checkPremium,
    checkCompleteProfile,
    checkVerified,
    checkActive,
    rateLimit
};