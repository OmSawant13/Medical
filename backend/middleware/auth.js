const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { verifyAccessToken } = require('../utils/jwt');

const authenticateToken = async(req, res, next) => {
    try {
        // Check both lowercase and capitalized header names (Express normalizes to lowercase)
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing');
        console.log('🔑 Request headers keys:', Object.keys(req.headers).filter(k => k.toLowerCase().includes('auth')));
        
        if (authHeader) {
            console.log('🔑 Auth header value (first 20 chars):', authHeader.substring(0, 20) + '...');
        }
        
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            console.log('❌ No token found in request');
            return res.status(401).json({
                success: false,
                error: 'Access token required',
                code: 'NO_TOKEN'
            });
        }

        console.log('✅ Token found, verifying...');

        // Verify access token
        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch (error) {
            // Provide specific error messages
            if (error.message.includes('expired') || error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Access token expired',
                    message: 'Your access token has expired. Please refresh your token or login again.',
                    code: 'ACCESS_TOKEN_EXPIRED'
                });
            } else if (error.message.includes('Invalid') || error.name === 'JsonWebTokenError') {
                return res.status(403).json({
                    success: false,
                    error: 'Invalid access token',
                    message: 'Your access token is invalid. Please login again.',
                    code: 'INVALID_ACCESS_TOKEN'
                });
            }
            return res.status(401).json({
                success: false,
                error: 'Token verification failed',
                message: 'Authentication failed. Please login again.',
                code: 'TOKEN_VERIFY_ERROR',
                details: error.message
            });
        }

        // Find user in database
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'User account is inactive',
                code: 'USER_INACTIVE'
            });
        }

        // Attach user to request object
        // Convert Mongoose document to plain object to ensure role is accessible
        req.user = user;
        req.userRole = user.role; // Store role separately for easy access
        req.tokenPayload = decoded; // Also attach decoded token for reference
        
        // Ensure req.user.role is accessible (handle Mongoose document)
        if (typeof req.user.role === 'undefined') {
            // Try to get role from document
            const userObj = user.toObject ? user.toObject() : user;
            req.user.role = userObj.role || user.role;
        }
        
        console.log('✅ User attached to request:', {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            hasRole: !!user.role,
            userType: typeof user,
            isMongooseDoc: typeof user.get === 'function'
        });
        
        // Fetch role-specific ID from database (non-blocking)
        let roleSpecificId = '';
        try {
            if (user.role === 'patient') {
                const patient = await Patient.findOne({ userId: user._id });
                if (patient) {
                    roleSpecificId = patient.patientId || '';
                    req.patientId = patient.patientId;
                    req.patient = patient; // Attach full patient object
                    console.log('✅ Patient ID fetched:', roleSpecificId);
                } else {
                    console.warn('⚠️ Patient profile not found for user:', user._id);
                }
            } else if (user.role === 'doctor') {
                const doctor = await Doctor.findOne({ userId: user._id });
                if (doctor) {
                    roleSpecificId = doctor.doctorId || '';
                    req.doctorId = doctor.doctorId;
                    req.doctor = doctor; // Attach full doctor object
                    console.log('✅ Doctor ID fetched:', roleSpecificId);
                } else {
                    console.warn('⚠️ Doctor profile not found for user:', user._id);
                }
            }
        } catch (profileError) {
            console.warn('⚠️ Error fetching role-specific profile:', profileError.message);
            // Continue anyway - not critical for authentication
        }
        
        // Double-check req.user is set before calling next
        if (!req.user) {
            console.error('❌ CRITICAL: req.user not set after authentication!');
            return res.status(500).json({
                success: false,
                error: 'Internal authentication error',
                code: 'AUTH_INTERNAL_ERROR'
            });
        }
        
        console.log('✅ User authenticated:', user.email, 'Role:', user.role, 'RoleSpecificId:', roleSpecificId);
        console.log('✅ Calling next() - req.user exists:', !!req.user, 'req.user.role:', req.user.role);
        next();
    } catch (error) {
        console.error('❌ Authentication error:', error);
        return res.status(403).json({
            success: false,
            error: 'Authentication failed',
            code: 'AUTH_ERROR',
            details: error.message
        });
    }
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        console.log('🔐 authorizeRoles middleware called for:', req.method, req.path);
        console.log('🔐 authorizeRoles check:', {
            hasUser: !!req.user,
            userRole: req.user?.role,
            userRoleAlt: req.userRole,
            allowedRoles: allowedRoles,
            reqKeys: Object.keys(req).filter(k => k.startsWith('user') || k.startsWith('token'))
        });
        
        if (!req.user) {
            console.error('❌ authorizeRoles: req.user is missing!');
            console.error('❌ This means authenticateToken middleware did not set req.user');
            console.error('❌ Request path:', req.path);
            console.error('❌ Request method:', req.method);
            console.error('❌ req.userRole:', req.userRole);
            console.error('❌ req.tokenPayload:', req.tokenPayload);
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required',
                message: 'User not authenticated. Please login again.',
                code: 'AUTH_REQUIRED',
                debug: {
                    hasUser: false,
                    hasUserRole: !!req.userRole,
                    hasTokenPayload: !!req.tokenPayload
                }
            });
        }

        // Handle both Mongoose document and plain object
        const userRole = req.user.role || req.user.get?.('role') || (typeof req.user.toObject === 'function' ? req.user.toObject().role : null);
        
        if (!userRole) {
            console.error('❌ authorizeRoles: User role not found', {
                userKeys: Object.keys(req.user),
                userType: typeof req.user
            });
            return res.status(403).json({
                success: false,
                error: 'User role not found',
                details: 'User object does not have a role property',
                code: 'ROLE_NOT_FOUND'
            });
        }

        console.log('✅ authorizeRoles: User role:', userRole, 'Allowed:', allowedRoles);

        if (!allowedRoles.includes(userRole)) {
            console.error('❌ authorizeRoles: Role mismatch', {
                userRole: userRole,
                allowedRoles: allowedRoles
            });
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                message: `This endpoint requires one of: ${allowedRoles.join(', ')}. Your role: ${userRole}`,
                requiredRoles: allowedRoles,
                userRole: userRole,
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        console.log('✅ authorizeRoles: Access granted');
        next();
    };
};

const validateHIPAA = (req, res, next) => {
    // HIPAA compliance checks
    const sensitiveFields = ['ssn', 'dateOfBirth', 'medicalHistory'];
    const hasAuditLog = req.headers['x-audit-log'] === 'true';

    if (!hasAuditLog) {
        console.warn('HIPAA Warning: Request missing audit log header');
    }

    // Log access to sensitive data
    console.log(`HIPAA Audit: User ${req.user?.email} accessed ${req.path} at ${new Date().toISOString()}`);

    next();
};

const rateLimiter = (windowMs, max) => {
    const requests = new Map();

    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        if (!requests.has(key)) {
            requests.set(key, []);
        }

        const userRequests = requests.get(key);
        const recentRequests = userRequests.filter((time) => time > windowStart);

        if (recentRequests.length >= max) {
            return res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        recentRequests.push(now);
        requests.set(key, recentRequests);

        next();
    };
};

const sanitizeInput = (req, res, next) => {
    // Basic input sanitization
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                sanitized[key] = sanitize(obj[key]);
            }
            return sanitized;
        }
        return obj;
    };

    req.body = sanitize(req.body);
    req.query = sanitize(req.query);

    next();
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    validateHIPAA,
    rateLimiter,
    sanitizeInput
};