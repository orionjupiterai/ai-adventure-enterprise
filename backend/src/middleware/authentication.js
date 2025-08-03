const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models');
const { sessionStore } = require('../config/redis');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Generate tokens
const generateTokens = (userId) => {
  const payload = { userId, type: 'access' };
  const refreshPayload = { userId, type: 'refresh', tokenId: uuidv4() };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  
  return { accessToken, refreshToken, tokenId: refreshPayload.tokenId };
};

// Verify access token
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'access') {
      return null;
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash'] }
    });
    
    return user;
  } catch (error) {
    return null;
  }
};

// Verify refresh token
const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      return null;
    }

    // Check if token is in session store (not revoked)
    const sessionData = await sessionStore.getSession(decoded.tokenId);
    if (!sessionData || sessionData.userId !== decoded.userId) {
      return null;
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash'] }
    });
    
    return { user, tokenId: decoded.tokenId };
  } catch (error) {
    return null;
  }
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Create session
const createSession = async (userId, tokenId, userAgent = '', ipAddress = '') => {
  const sessionData = {
    userId,
    userAgent,
    ipAddress,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };
  
  // Set session with 7 days TTL (matching refresh token)
  const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
  await sessionStore.setSession(tokenId, sessionData, ttl);
  
  return sessionData;
};

// Update session activity
const updateSessionActivity = async (tokenId) => {
  const sessionData = await sessionStore.getSession(tokenId);
  if (sessionData) {
    sessionData.lastActivity = new Date().toISOString();
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    await sessionStore.setSession(tokenId, sessionData, ttl);
  }
};

// Revoke session
const revokeSession = async (tokenId) => {
  await sessionStore.deleteSession(tokenId);
};

// Required authentication middleware
const required = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    const user = await verifyToken(token);

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional authentication middleware
const optional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await verifyToken(token);
      
      if (user && user.is_active) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Admin authentication middleware
const admin = async (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

// Rate limiting check middleware
const checkRateLimit = (limit = 100, window = 3600) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.ip;
      const key = `rate_limit:${userId}:${Math.floor(Date.now() / (window * 1000))}`;
      
      const { redis } = require('../config/redis');
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, window);
      }
      
      if (current > limit) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: window
        });
      }
      
      res.set('X-RateLimit-Limit', limit);
      res.set('X-RateLimit-Remaining', Math.max(0, limit - current));
      res.set('X-RateLimit-Reset', new Date(Date.now() + window * 1000).toISOString());
      
      next();
    } catch (error) {
      logger.error('Rate limiting error:', error);
      next(); // Continue on error
    }
  };
};

module.exports = {
  required,
  optional,
  admin,
  verifyToken,
  verifyRefreshToken,
  generateTokens,
  hashPassword,
  comparePassword,
  createSession,
  updateSessionActivity,
  revokeSession,
  checkRateLimit
};