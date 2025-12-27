const jwt = require('jsonwebtoken');

// Production-grade JWT configuration
const JWT_CONFIG = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'healthcare-platform-access-secret-key-2024-production',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'healthcare-platform-refresh-secret-key-2024-production',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRES_IN || '15m', // Short-lived access token
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Long-lived refresh token
  issuer: 'healthcare-platform',
  audience: 'healthcare-platform-users'
};

/**
 * Generate Access Token (short-lived, 15 minutes)
 * @param {Object} payload - Token payload
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
  try {
    const tokenPayload = {
      userId: String(payload.userId),
      email: payload.email,
      role: payload.role,
      roleSpecificId: payload.roleSpecificId || '',
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(tokenPayload, JWT_CONFIG.accessTokenSecret, {
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });
    
    if (!token) {
      throw new Error('Access token generation returned empty string');
    }
    
    return token;
  } catch (error) {
    console.error('❌ Error generating access token:', error);
    throw error;
  }
};

/**
 * Generate Refresh Token (long-lived, 7 days)
 * @param {Object} payload - Token payload
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  try {
    const tokenPayload = {
      userId: String(payload.userId),
      email: payload.email,
      role: payload.role,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(tokenPayload, JWT_CONFIG.refreshTokenSecret, {
      expiresIn: JWT_CONFIG.refreshTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });
    
    if (!token) {
      throw new Error('Refresh token generation returned empty string');
    }
    
    return token;
  } catch (error) {
    console.error('❌ Error generating refresh token:', error);
    throw error;
  }
};

/**
 * Generate both access and refresh tokens
 * @param {Object} payload - Token payload
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokenPair = (payload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};

/**
 * Verify Access Token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.accessTokenSecret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    if (decoded.userId) {
      decoded.userId = String(decoded.userId);
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

/**
 * Verify Refresh Token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.refreshTokenSecret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    if (decoded.userId) {
      decoded.userId = String(decoded.userId);
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Verify token (auto-detect type)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  // Try access token first
  try {
    return verifyAccessToken(token);
  } catch (accessError) {
    // If access token fails, try refresh token
    try {
      return verifyRefreshToken(token);
    } catch (refreshError) {
      // If both fail, throw the access token error (more common)
      throw accessError;
    }
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token (not verified)
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken, // Backward compatibility
  decodeToken,
  JWT_CONFIG
};
