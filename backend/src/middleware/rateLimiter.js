const rateLimit = require('express-rate-limit');
const { redis } = require('../config/redis');
const logger = require('../utils/logger');

// Create a Redis store with error handling
const createRedisStore = (prefix) => {
  try {
    const RedisStore = require('rate-limit-redis');
    return new RedisStore({
      client: redis,
      prefix: `rl:${prefix}:`,
      sendCommand: (...args) => redis.call(...args)
    });
  } catch (error) {
    logger.warn('Redis store unavailable for rate limiting, falling back to memory store');
    return undefined; // Will use default memory store
  }
};

// Custom response handler
const createRateLimitHandler = (type) => (req, res) => {
  const retryAfter = Math.round(req.rateLimit.resetTime / 1000) || 1;
  
  logger.warn(`Rate limit exceeded for ${type}`, {
    ip: req.ip,
    user: req.user?.id,
    userAgent: req.get('User-Agent'),
    endpoint: req.originalUrl,
    remaining: req.rateLimit.remaining,
    resetTime: new Date(req.rateLimit.resetTime)
  });

  res.status(429).json({
    error: `Too many ${type} requests`,
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter,
    limit: req.rateLimit.limit,
    remaining: req.rateLimit.remaining,
    resetTime: new Date(req.rateLimit.resetTime)
  });
};

// General API rate limiter
const general = rateLimit({
  store: createRedisStore('general'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for general API usage
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('API')
});

// Strict rate limiter for authentication
const auth = rateLimit({
  store: createRedisStore('auth'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased slightly but still strict
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  handler: createRateLimitHandler('authentication')
});

// Progressive rate limiter for failed authentication attempts
const authProgressive = rateLimit({
  store: createRedisStore('auth_fail'),
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: (req) => {
    // Progressive limiting: fewer attempts allowed with each failure
    const failedAttempts = req.rateLimit?.totalHits || 0;
    if (failedAttempts < 3) return 5;
    if (failedAttempts < 6) return 3;
    return 1;
  },
  keyGenerator: (req) => req.ip,
  skip: (req, res) => res.statusCode < 400, // Only count failed attempts
  handler: createRateLimitHandler('failed authentication')
});

// Rate limiter for AI endpoints
const ai = rateLimit({
  store: createRedisStore('ai'),
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Increased for better UX
  message: 'AI request limit exceeded, please wait before trying again.',
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: createRateLimitHandler('AI')
});

// Rate limiter for file uploads
const upload = rateLimit({
  store: createRedisStore('upload'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Increased for better UX
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: createRateLimitHandler('upload')
});

// Rate limiter for game actions (multiplayer)
const gameAction = rateLimit({
  store: createRedisStore('game'),
  windowMs: 60 * 1000, // 1 minute
  max: 120, // Allow many game actions per minute
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: createRateLimitHandler('game action')
});

// Rate limiter for world creation/updates
const worldModification = rateLimit({
  store: createRedisStore('world_mod'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limited world modifications per hour
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: createRateLimitHandler('world modification')
});

// Rate limiter for password reset attempts
const passwordReset = rateLimit({
  store: createRedisStore('password_reset'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Very limited password reset attempts
  keyGenerator: (req) => req.body.email || req.ip,
  handler: createRateLimitHandler('password reset')
});

// Stricter rate limiter for admin endpoints
const admin = rateLimit({
  store: createRedisStore('admin'),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limited admin actions per minute
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: createRateLimitHandler('admin action')
});

// Dynamic rate limiter based on user tier/subscription
const createDynamicLimiter = (baseLimit, windowMs = 60 * 1000) => {
  return rateLimit({
    store: createRedisStore('dynamic'),
    windowMs,
    max: (req) => {
      const user = req.user;
      if (!user) return Math.floor(baseLimit * 0.5); // Guests get half
      if (user.is_admin) return baseLimit * 10; // Admins get 10x
      // Could add premium user tiers here
      return baseLimit;
    },
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: createRateLimitHandler('dynamic')
  });
};

module.exports = {
  general,
  auth,
  authProgressive,
  ai,
  upload,
  gameAction,
  worldModification,
  passwordReset,
  admin,
  createDynamicLimiter
};