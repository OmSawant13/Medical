import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { verifyToken, JWTPayload } from '../utils/jwt';

interface AuthRequest extends Request {
  user?: IUser;
  tokenPayload?: JWTPayload;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    // Verify token using centralized utility
    let decoded: JWTPayload;
    try {
      decoded = verifyToken(token);
    } catch (error: any) {
      // Provide specific error messages
      if (error.message === 'Token has expired') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.message === 'Invalid token') {
        return res.status(403).json({
          success: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      throw error;
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
    req.user = user;
    req.tokenPayload = decoded; // Also attach decoded token for reference
    next();
  } catch (error: any) {
    console.error('❌ Authentication error:', error);
    return res.status(403).json({ 
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
      details: error.message
    });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

export const validateHIPAA = (req: AuthRequest, res: Response, next: NextFunction) => {
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

export const rateLimiter = (windowMs: number, max: number) => {
  const requests = new Map();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    const recentRequests = userRequests.filter((time: number) => time > windowStart);
    
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

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Basic input sanitization
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
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
