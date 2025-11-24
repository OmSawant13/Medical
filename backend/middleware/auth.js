const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_super_secret_jwt_key_change_in_production_use_long_random_string') {
      console.warn('⚠️  WARNING: Using default JWT_SECRET. Change this in production!');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    
    if (!decoded.user_id) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token payload' 
      });
    }

    const user = await User.findOne({ user_id: decoded.user_id }).select('-password');

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found. Token is invalid.' 
      });
    }

    // Check if account is verified (for doctors and hospitals)
    if ((user.role === 'doctor' || user.role === 'hospital') && !user.isVerified) {
      return res.status(403).json({ 
        success: false,
        message: 'Account pending verification. Please contact administrator.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired. Please login again.' 
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format.' 
      });
    }
    console.error('Auth Error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Token validation failed' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    
    next();
  };
};

module.exports = { auth, authorize };

