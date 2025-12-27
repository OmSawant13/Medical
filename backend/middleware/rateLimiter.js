/**
 * Production-grade rate limiting middleware
 */

// In-memory store (for production, use Redis)
const requestStore = new Map();

/**
 * Rate limiter middleware
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Custom error message
 * @param {boolean} options.skipSuccessfulRequests - Skip counting successful requests
 */
const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 5, // 5 requests default
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false
  } = options;

  return (req, res, next) => {
    // Get client identifier (IP address or user ID if authenticated)
    const key = req.user ? `user:${req.user._id}` : `ip:${req.ip || req.connection.remoteAddress}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Initialize or get existing requests
    if (!requestStore.has(key)) {
      requestStore.set(key, []);
    }

    const requests = requestStore.get(key);
    
    // Filter requests within the time window
    const recentRequests = requests.filter((request) => request.time > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= max) {
      const retryAfter = Math.ceil((recentRequests[0].time + windowMs - now) / 1000);
      
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message,
        retryAfter,
        code: 'RATE_LIMIT_EXCEEDED'
      });
      return;
    }

    // Store request timestamp
    recentRequests.push({ time: now, path: req.path });

    // Update store
    requestStore.set(key, recentRequests);

    // Clean up old entries periodically (every 5 minutes)
    if (Math.random() < 0.01) { // 1% chance to clean up
      for (const [storeKey, storeRequests] of requestStore.entries()) {
        const validRequests = storeRequests.filter((r) => r.time > now - windowMs);
        if (validRequests.length === 0) {
          requestStore.delete(storeKey);
        } else {
          requestStore.set(storeKey, validRequests);
        }
      }
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - recentRequests.length));
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };
};

/**
 * Login-specific rate limiter (stricter)
 */
const loginRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts. Please try again after 15 minutes.'
});

/**
 * General API rate limiter
 */
const apiRateLimiter = rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many API requests. Please slow down.'
});

module.exports = {
  rateLimiter,
  loginRateLimiter,
  apiRateLimiter
};

