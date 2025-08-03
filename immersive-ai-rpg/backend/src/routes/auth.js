import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { authSchemas } from '../utils/validators.js';
import { UserRepository } from '../services/database/UserRepository.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

const router = Router();
const userRepository = new UserRepository();

// Register new user
router.post('/register',
  validateRequest(authSchemas.register),
  async (req, res, next) => {
    try {
      const { email, username, password } = req.body;

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        throw new AppError('Email already registered', 409);
      }

      const existingUsername = await userRepository.findByUsername(username);
      if (existingUsername) {
        throw new AppError('Username already taken', 409);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const user = await userRepository.create({
        email,
        username,
        passwordHash,
        settings: {
          theme: 'dark',
          soundEnabled: true,
          autoSave: true,
        },
      });

      // Generate tokens
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        token,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login
router.post('/login',
  validateRequest(authSchemas.login),
  async (req, res, next) => {
    try {
      const { email, password, rememberMe } = req.body;

      // Find user
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if user is banned
      if (user.status === 'banned') {
        throw new AppError('Account is banned', 403);
      }

      // Update last login
      await userRepository.updateLastLogin(user.id);

      // Generate tokens
      const tokenExpiry = rememberMe ? '30d' : '7d';
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: tokenExpiry }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          settings: user.settings,
        },
        token,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user
router.get('/me',
  authMiddleware,
  async (req, res, next) => {
    try {
      const user = await userRepository.findById(req.user.id);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          settings: user.settings,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Refresh token
router.post('/refresh',
  validateRequest(authSchemas.refresh),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      // Get user
      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new access token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        next(new AppError('Invalid refresh token', 401));
      } else {
        next(error);
      }
    }
  }
);

// Update user settings
router.patch('/settings',
  authMiddleware,
  validateRequest(authSchemas.updateSettings),
  async (req, res, next) => {
    try {
      const { settings } = req.body;
      
      await userRepository.updateSettings(req.user.id, settings);

      res.json({
        success: true,
        message: 'Settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Change password
router.post('/change-password',
  authMiddleware,
  validateRequest(authSchemas.changePassword),
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user
      const user = await userRepository.findById(userId);
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // Update password
      await userRepository.updatePassword(userId, passwordHash);

      logger.info(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Logout (optional - mainly for logging)
router.post('/logout',
  authMiddleware,
  (req, res) => {
    logger.info(`User logged out: ${req.user.email}`);
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
);

export default router;