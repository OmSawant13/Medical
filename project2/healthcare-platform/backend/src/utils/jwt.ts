import jwt from 'jsonwebtoken';

// Centralized JWT configuration
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'healthcare-platform-secret-key-2024',
  expiresIn: '24h',
  issuer: 'healthcare-platform',
  audience: 'healthcare-platform-users'
};

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'patient' | 'doctor' | 'hospital';
  roleSpecificId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token with consistent payload structure
 */
export const generateToken = (payload: {
  userId: string | any;
  email: string;
  role: 'patient' | 'doctor' | 'hospital';
  roleSpecificId?: string;
}): string => {
  // Ensure userId is always a string
  const tokenPayload: JWTPayload = {
    userId: String(payload.userId),
    email: payload.email,
    role: payload.role,
    roleSpecificId: payload.roleSpecificId || '',
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(tokenPayload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience
  });
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    }) as JWTPayload;

    // Ensure userId is string
    if (decoded.userId) {
      decoded.userId = String(decoded.userId);
    }

    return decoded;
  } catch (error: any) {
    // Provide specific error messages
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not active yet');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  return jwt.decode(token) as JWTPayload | null;
};

