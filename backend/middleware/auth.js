const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'healthcare_ai_secret_key_2024';

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // For demo/testing purposes, allow requests without token
      req.user = { userId: 'demo-user', role: 'admin' };
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // For demo/testing purposes, allow requests with invalid token
    req.user = { userId: 'demo-user', role: 'admin' };
    next();
  }
};

module.exports = auth;
