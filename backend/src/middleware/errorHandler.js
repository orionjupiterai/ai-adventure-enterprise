const logger = require('../utils/logger');
const config = require('../config/environment');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', code = 'AUTH_REQUIRED') {
    super(message, 401, code);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied', code = 'ACCESS_DENIED') {
    super(message, 403, code);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists', field = null) {
    super(message, 409, 'CONFLICT', { field });
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', retryAfter = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Generate error ID for tracking
  const errorId = require('uuid').v4();
  
  // Enhanced error logging
  const errorInfo = {
    errorId,
    name: err.name,
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    stack: err.stack,
    request: {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: config.isDevelopment() ? req.body : '[HIDDEN]',
      headers: {
        'user-agent': req.get('User-Agent'),
        'content-type': req.get('Content-Type'),
        'origin': req.get('Origin')
      },
      ip: req.ip,
      user: req.user?.id
    },
    timestamp: new Date().toISOString()
  };

  // Log based on error severity
  if (err.statusCode >= 500) {
    logger.error('Server error occurred', errorInfo);
  } else if (err.statusCode >= 400) {
    logger.warn('Client error occurred', errorInfo);
  } else {
    logger.info('Non-critical error occurred', errorInfo);
  }

  // Handle known error types
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details = null;

  // Custom app errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  }
  // Validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = err.errors;
  }
  // Sequelize errors
  else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Database validation failed';
    code = 'DB_VALIDATION_ERROR';
    details = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  }
  else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
    details = {
      fields: err.errors.map(e => e.path),
      constraint: err.original?.constraint
    };
  }
  else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Invalid reference';
    code = 'INVALID_REFERENCE';
    details = {
      field: err.fields,
      table: err.table
    };
  }
  else if (err.name === 'SequelizeConnectionError') {
    statusCode = 503;
    message = 'Database connection error';
    code = 'DB_CONNECTION_ERROR';
  }
  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'INVALID_TOKEN';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
    code = 'TOKEN_EXPIRED';
  }
  else if (err.name === 'NotBeforeError') {
    statusCode = 401;
    message = 'Token not active yet';
    code = 'TOKEN_NOT_ACTIVE';
  }
  // Multer errors
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
    code = 'FILE_TOO_LARGE';
    details = { maxSize: err.limit };
  }
  else if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 400;
    message = 'Too many files';
    code = 'TOO_MANY_FILES';
  }
  else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
    code = 'UNEXPECTED_FILE';
  }
  // Syntax errors
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON format';
    code = 'INVALID_JSON';
  }
  // Permission errors
  else if (err.code === 'EACCES' || err.code === 'EPERM') {
    statusCode = 500;
    message = 'Permission denied';
    code = 'PERMISSION_DENIED';
  }
  // File system errors
  else if (err.code === 'ENOENT') {
    statusCode = 404;
    message = 'File not found';
    code = 'FILE_NOT_FOUND';
  }
  else if (err.code === 'EMFILE' || err.code === 'ENFILE') {
    statusCode = 503;
    message = 'Too many open files';
    code = 'TOO_MANY_FILES';
  }
  // MongoDB/Redis errors
  else if (err.name === 'MongoError' || err.name === 'RedisError') {
    statusCode = 503;
    message = 'Database service unavailable';
    code = 'DB_SERVICE_ERROR';
  }
  // Network errors
  else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'External service unavailable';
    code = 'SERVICE_UNAVAILABLE';
  }
  else if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = 'Request timeout';
    code = 'TIMEOUT';
  }

  // Security: Don't expose internal errors in production
  if (!config.isDevelopment() && statusCode >= 500) {
    message = 'Internal server error';
    details = null;
  }

  // Build error response
  const errorResponse = {
    error: message,
    code,
    errorId,
    timestamp: new Date().toISOString()
  };

  // Add details if available
  if (details) {
    errorResponse.details = details;
  }

  // Add stack trace in development
  if (config.isDevelopment()) {
    errorResponse.stack = err.stack;
    errorResponse.originalError = {
      name: err.name,
      message: err.message
    };
  }

  // Add retry information for specific errors
  if (statusCode === 429 && details?.retryAfter) {
    res.set('Retry-After', details.retryAfter);
  }

  // Set security headers
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// 404 handler for unmatched routes
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global uncaught exception handler
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', {
    error: err.message,
    stack: err.stack,
    pid: process.pid
  });
  
  // Give some time for logging before exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Global unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise
  });
});

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
};