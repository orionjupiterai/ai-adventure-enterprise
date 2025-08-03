const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User } = require('../../models');
const rateLimiter = require('../../middleware/rateLimiter');
const authentication = require('../../middleware/authentication');
const logger = require('../../utils/logger');

const router = express.Router();

// Register new user
router.post('/register', 
  rateLimiter.auth,
  [
    body('username').isLength({ min: 3, max: 50 }).isAlphanumeric(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('displayName').optional().isLength({ max: 100 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, displayName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email }]
        }
      });

      if (existingUser) {
        return res.status(409).json({ 
          error: existingUser.username === username ? 'Username already taken' : 'Email already registered' 
        });
      }

      // Hash password
      const hashedPassword = await authentication.hashPassword(password);

      // Create new user
      const user = await User.create({
        username,
        email,
        password_hash: hashedPassword,
        display_name: displayName || username
      });

      // Generate tokens
      const { accessToken, refreshToken, tokenId } = authentication.generateTokens(user.id);

      // Create session
      const userAgent = req.get('User-Agent') || '';
      const ipAddress = req.ip;
      await authentication.createSession(user.id, tokenId, userAgent, ipAddress);

      logger.info(`New user registered: ${username}`);

      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          isActive: user.is_active,
          isAdmin: user.is_admin,
          createdAt: user.created_at
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login
router.post('/login',
  rateLimiter.auth,
  [
    body('username').optional(),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password } = req.body;

      if (!username && !email) {
        return res.status(400).json({ error: 'Username or email required' });
      }

      // Find user
      const user = await User.findOne({
        where: username ? { username } : { email }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Validate password
      const isValidPassword = await authentication.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      // Generate tokens
      const { accessToken, refreshToken, tokenId } = authentication.generateTokens(user.id);

      // Create session
      const userAgent = req.get('User-Agent') || '';
      const ipAddress = req.ip;
      await authentication.createSession(user.id, tokenId, userAgent, ipAddress);

      logger.info(`User logged in: ${user.username}`);

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          isActive: user.is_active,
          isAdmin: user.is_admin,
          createdAt: user.created_at
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      next(error);
    }
  }
);

// Refresh token
router.post('/refresh', 
  rateLimiter.auth,
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { refreshToken } = req.body;

      // Verify refresh token
      const result = await authentication.verifyRefreshToken(refreshToken);
      if (!result) {
        return res.status(401).json({ 
          error: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      const { user, tokenId } = result;

      if (!user.is_active) {
        return res.status(403).json({ 
          error: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken, tokenId: newTokenId } = authentication.generateTokens(user.id);

      // Revoke old session and create new one
      await authentication.revokeSession(tokenId);
      
      const userAgent = req.get('User-Agent') || '';
      const ipAddress = req.ip;
      await authentication.createSession(user.id, newTokenId, userAgent, ipAddress);

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          isActive: user.is_active,
          isAdmin: user.is_admin,
          createdAt: user.created_at
        },
        accessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      next(error);
    }
  }
);

// Change password
router.post('/change-password',
  authentication.required,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);

      // Validate current password
      const isValidPassword = await authentication.comparePassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash and update password
      const hashedPassword = await authentication.hashPassword(newPassword);
      user.password_hash = hashedPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.username}`);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Logout
router.post('/logout',
  authentication.required,
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { refreshToken } = req.body;

      // Verify and revoke refresh token
      const result = await authentication.verifyRefreshToken(refreshToken);
      if (result) {
        await authentication.revokeSession(result.tokenId);
      }

      logger.info(`User logged out: ${req.user.username}`);

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Logout from all devices
router.post('/logout-all',
  authentication.required,
  async (req, res, next) => {
    try {
      const { redis } = require('../../config/redis');
      
      // Find all sessions for this user and revoke them
      const sessionKeys = await redis.keys(`session:*`);
      const sessionsToRevoke = [];

      for (const key of sessionKeys) {
        const sessionData = await redis.get(key);
        if (sessionData) {
          const data = JSON.parse(sessionData);
          if (data.userId === req.user.id) {
            sessionsToRevoke.push(key);
          }
        }
      }

      // Revoke all user sessions
      if (sessionsToRevoke.length > 0) {
        await redis.del(...sessionsToRevoke);
      }

      logger.info(`User logged out from all devices: ${req.user.username}`);

      res.json({ 
        message: 'Logged out from all devices successfully',
        revokedSessions: sessionsToRevoke.length
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user profile
router.get('/me', authentication.required, async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        displayName: req.user.display_name,
        avatarUrl: req.user.avatar_url,
        isActive: req.user.is_active,
        isAdmin: req.user.is_admin,
        createdAt: req.user.created_at,
        updatedAt: req.user.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/me',
  authentication.required,
  [
    body('displayName').optional().isLength({ max: 100 }),
    body('avatarUrl').optional().isURL()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { displayName, avatarUrl } = req.body;
      const user = await User.findByPk(req.user.id);

      if (displayName !== undefined) {
        user.display_name = displayName;
      }
      if (avatarUrl !== undefined) {
        user.avatar_url = avatarUrl;
      }

      await user.save();

      logger.info(`Profile updated for user: ${user.username}`);

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          isActive: user.is_active,
          isAdmin: user.is_admin,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user sessions
router.get('/sessions', authentication.required, async (req, res, next) => {
  try {
    const { redis } = require('../../config/redis');
    
    // Find all sessions for this user
    const sessionKeys = await redis.keys(`session:*`);
    const userSessions = [];

    for (const key of sessionKeys) {
      const sessionData = await redis.get(key);
      if (sessionData) {
        const data = JSON.parse(sessionData);
        if (data.userId === req.user.id) {
          userSessions.push({
            sessionId: key.replace('session:', ''),
            userAgent: data.userAgent,
            ipAddress: data.ipAddress,
            createdAt: data.createdAt,
            lastActivity: data.lastActivity
          });
        }
      }
    }

    res.json({ sessions: userSessions });
  } catch (error) {
    next(error);
  }
});

// Revoke specific session
router.delete('/sessions/:sessionId',
  authentication.required,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      
      // Verify session belongs to user
      const sessionData = await authentication.sessionStore.getSession(sessionId);
      if (!sessionData || sessionData.userId !== req.user.id) {
        return res.status(404).json({ error: 'Session not found' });
      }

      await authentication.revokeSession(sessionId);

      res.json({ message: 'Session revoked successfully' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;