const { body, param, query, validationResult } = require('express-validator');
const { sanitizeHtml } = require('sanitize-html');
const logger = require('../utils/logger');

// Enhanced validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', {
      errors: errors.array(),
      ip: req.ip,
      user: req.user?.id,
      endpoint: req.originalUrl
    });

    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Sanitization utilities
const sanitizeText = (text) => {
  if (typeof text !== 'string') return text;
  
  // Remove HTML tags and normalize whitespace
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter: (text) => text.trim().replace(/\s+/g, ' ')
  });
};

const sanitizeRichText = (text) => {
  if (typeof text !== 'string') return text;
  
  // Allow basic formatting tags for rich text content
  return sanitizeHtml(text, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {},
    allowedSchemes: []
  });
};

// Common validation rules
const commonValidations = {
  // User fields
  username: () => body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
    .customSanitizer(sanitizeText),

  email: () => body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email too long'),

  password: (minLength = 8) => body('password')
    .isLength({ min: minLength, max: 128 })
    .withMessage(`Password must be ${minLength}-128 characters`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  displayName: () => body('displayName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be 1-100 characters')
    .customSanitizer(sanitizeText),

  // World fields
  worldName: () => body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('World name must be 1-255 characters')
    .customSanitizer(sanitizeText),

  worldDescription: () => body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Description too long (max 5000 characters)')
    .customSanitizer(sanitizeRichText),

  worldTags: () => body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed')
    .custom((tags) => {
      if (!Array.isArray(tags)) return true;
      return tags.every(tag => 
        typeof tag === 'string' && 
        tag.length >= 1 && 
        tag.length <= 50 &&
        /^[a-zA-Z0-9\s-]+$/.test(tag)
      );
    })
    .withMessage('Tags must be 1-50 characters and contain only letters, numbers, spaces, and hyphens'),

  // Game session fields
  sessionName: () => body('sessionName')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Session name must be 1-255 characters')
    .customSanitizer(sanitizeText),

  gameState: () => body('gameState')
    .optional()
    .isObject()
    .withMessage('Game state must be an object'),

  // Room fields
  roomName: () => body('roomName')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Room name must be 1-255 characters')
    .customSanitizer(sanitizeText),

  maxPlayers: () => body('maxPlayers')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('Max players must be between 2 and 10'),

  roomCode: () => body('roomCode')
    .optional()
    .isLength({ min: 4, max: 10 })
    .withMessage('Room code must be 4-10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Room code can only contain uppercase letters and numbers'),

  // Rating fields
  rating: () => body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  review: () => body('review')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Review too long (max 1000 characters)')
    .customSanitizer(sanitizeRichText),

  // UUID parameter validation
  uuidParam: (paramName = 'id') => param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),

  // Pagination validation
  page: () => query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000')
    .toInt(),

  limit: (maxLimit = 100) => query('limit')
    .optional()
    .isInt({ min: 1, max: maxLimit })
    .withMessage(`Limit must be between 1 and ${maxLimit}`)
    .toInt(),

  // Search validation
  searchQuery: () => query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be 1-100 characters')
    .customSanitizer(sanitizeText),

  // Sort validation
  sortField: (allowedFields) => query('sortBy')
    .optional()
    .isIn(allowedFields)
    .withMessage(`Sort field must be one of: ${allowedFields.join(', ')}`),

  sortOrder: () => query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  // File validation
  fileType: (allowedTypes) => body('fileType')
    .optional()
    .isIn(allowedTypes)
    .withMessage(`File type must be one of: ${allowedTypes.join(', ')}`),

  // JSON validation
  jsonData: (fieldName) => body(fieldName)
    .optional()
    .custom((value) => {
      try {
        if (typeof value === 'string') {
          JSON.parse(value);
        }
        return true;
      } catch (error) {
        throw new Error('Must be valid JSON');
      }
    }),

  // Custom validators
  isBoolean: (fieldName) => body(fieldName)
    .optional()
    .isBoolean()
    .withMessage(`${fieldName} must be a boolean`)
    .toBoolean(),

  isUrl: (fieldName) => body(fieldName)
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage(`${fieldName} must be a valid URL`)
    .isLength({ max: 500 })
    .withMessage(`${fieldName} URL too long`),

  // Array validation
  isStringArray: (fieldName, maxItems = 10, maxLength = 100) => body(fieldName)
    .optional()
    .isArray({ max: maxItems })
    .withMessage(`${fieldName} must be an array with maximum ${maxItems} items`)
    .custom((arr) => {
      if (!Array.isArray(arr)) return true;
      return arr.every(item => 
        typeof item === 'string' && 
        item.length <= maxLength
      );
    })
    .withMessage(`All ${fieldName} items must be strings with maximum ${maxLength} characters`)
};

// Preset validation chains for common endpoints
const validationPresets = {
  // Authentication
  register: [
    commonValidations.username(),
    commonValidations.email(),
    commonValidations.password(),
    commonValidations.displayName(),
    handleValidationErrors
  ],

  login: [
    body('username').optional(),
    commonValidations.email().optional(),
    body('password').notEmpty().withMessage('Password is required'),
    body().custom((body) => {
      if (!body.username && !body.email) {
        throw new Error('Username or email is required');
      }
      return true;
    }),
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    commonValidations.password(),
    handleValidationErrors
  ],

  refreshToken: [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    handleValidationErrors
  ],

  // World management
  createWorld: [
    commonValidations.worldName(),
    commonValidations.worldDescription(),
    commonValidations.worldTags(),
    body('worldData').isObject().withMessage('World data is required'),
    commonValidations.isBoolean('isPublic'),
    handleValidationErrors
  ],

  updateWorld: [
    commonValidations.uuidParam(),
    commonValidations.worldName().optional(),
    commonValidations.worldDescription(),
    commonValidations.worldTags(),
    body('worldData').optional().isObject(),
    commonValidations.isBoolean('isPublic'),
    handleValidationErrors
  ],

  // Game sessions
  createSession: [
    commonValidations.uuidParam('worldId'),
    commonValidations.sessionName(),
    commonValidations.gameState(),
    handleValidationErrors
  ],

  updateSession: [
    commonValidations.uuidParam(),
    commonValidations.gameState(),
    handleValidationErrors
  ],

  // Multiplayer rooms
  createRoom: [
    commonValidations.uuidParam('worldId'),
    commonValidations.roomName(),
    commonValidations.maxPlayers(),
    commonValidations.isBoolean('isPrivate'),
    handleValidationErrors
  ],

  joinRoom: [
    commonValidations.roomCode(),
    handleValidationErrors
  ],

  // Ratings and reviews
  rateWorld: [
    commonValidations.uuidParam('worldId'),
    commonValidations.rating(),
    commonValidations.review(),
    handleValidationErrors
  ],

  // Pagination and search
  pagination: [
    commonValidations.page(),
    commonValidations.limit(),
    commonValidations.searchQuery(),
    handleValidationErrors
  ],

  worldSearch: [
    commonValidations.page(),
    commonValidations.limit(50),
    commonValidations.searchQuery(),
    commonValidations.sortField(['name', 'created_at', 'rating_average', 'play_count']),
    commonValidations.sortOrder(),
    query('tags').optional().isString(),
    query('isPublic').optional().isBoolean().toBoolean(),
    handleValidationErrors
  ]
};

// Security middleware for preventing common attacks
const securityValidation = {
  // Prevent NoSQL injection
  preventNoSQLInjection: (req, res, next) => {
    const checkObject = (obj) => {
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (key.startsWith('$') || key.includes('.')) {
            return false;
          }
          if (!checkObject(obj[key])) {
            return false;
          }
        }
      }
      return true;
    };

    if (!checkObject(req.body) || !checkObject(req.query)) {
      return res.status(400).json({
        error: 'Invalid request format',
        code: 'INVALID_FORMAT'
      });
    }

    next();
  },

  // Prevent XSS in JSON data
  preventXSS: (req, res, next) => {
    const sanitizeObject = (obj) => {
      if (typeof obj === 'string') {
        return sanitizeText(obj);
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          obj[key] = sanitizeObject(obj[key]);
        }
      }
      return obj;
    };

    req.body = sanitizeObject(req.body);
    next();
  }
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  validationPresets,
  securityValidation,
  sanitizeText,
  sanitizeRichText
};