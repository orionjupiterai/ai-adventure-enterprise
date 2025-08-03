const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { Server } = require('socket.io');
const http = require('http');

// Import configurations
const config = require('./config/environment');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const authentication = require('./middleware/authentication');
const { securityValidation } = require('./middleware/validation');

// Import routes
const authRoutes = require('./api/routes/auth.routes');
const worldRoutes = require('./api/routes/world.routes');
const gameRoutes = require('./api/routes/game.routes');
const userRoutes = require('./api/routes/user.routes');
const multiplayerRoutes = require('./api/routes/multiplayer.routes');
const aiRoutes = require('./api/routes/ai.routes');
const aiEnhancedRoutes = require('./api/routes/ai-enhanced.routes');

// Import GraphQL
const { setupGraphQL } = require('./api/graphql');

// Import WebSocket handlers
const { setupSocketHandlers } = require('./services/websocket');

const app = express();
const server = http.createServer(app);

// Configure WebSocket server
const io = new Server(server, {
  cors: config.websocket.cors,
  pingTimeout: config.websocket.pingTimeout,
  pingInterval: config.websocket.pingInterval,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Trust proxy if configured
if (config.security.trustProxy) {
  app.set('trust proxy', true);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.security.helmet.csp ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  } : false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression with custom filter
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = Array.isArray(config.cors.origin) 
      ? config.cors.origin 
      : [config.cors.origin];
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));

// Body parsing with enhanced security
app.use(express.json({ 
  limit: '10mb',
  strict: true,
  type: ['application/json', 'application/*+json']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000
}));

// Security validation middleware
app.use(securityValidation.preventNoSQLInjection);
app.use(securityValidation.preventXSS);

// Rate limiting
app.use(rateLimiter.general);

// Request logging
app.use(morgan(config.isDevelopment() ? 'dev' : 'combined', { 
  stream: { 
    write: message => logger.info(message.trim())
  },
  skip: (req, res) => res.statusCode < 400 // Only log errors in production
}));

// Static file serving with security headers
const staticOptions = {
  maxAge: config.isProduction() ? '1d' : 0,
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
  }
};

app.use('/uploads', express.static(path.join(__dirname, '../../uploads'), staticOptions));
app.use('/worlds', express.static(path.join(__dirname, '../../worlds'), staticOptions));

// Enhanced health check
app.get('/health', async (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: require('../package.json').version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };

  // Check database connection
  try {
    const { sequelize } = require('./config/database');
    await sequelize.authenticate();
    healthData.database = 'connected';
  } catch (error) {
    healthData.database = 'disconnected';
    healthData.status = 'degraded';
  }

  // Check Redis connection
  try {
    const { redis } = require('./config/redis');
    await redis.ping();
    healthData.redis = 'connected';
  } catch (error) {
    healthData.redis = 'disconnected';
    healthData.status = 'degraded';
  }

  const statusCode = healthData.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthData);
});

// API version info
app.get('/api', (req, res) => {
  res.json({
    name: 'Adventure Platform API',
    version: require('../package.json').version,
    description: 'Backend API for Adventure Platform Pro',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      worlds: '/api/worlds',
      games: '/api/games',
      users: '/api/users',
      multiplayer: '/api/multiplayer',
      ai: '/api/ai'
    },
    features: config.features
  });
});

// API Routes with enhanced middleware
app.use('/api/auth', rateLimiter.auth, authRoutes);
app.use('/api/worlds', authentication.optional, worldRoutes);
app.use('/api/games', authentication.required, rateLimiter.gameAction, gameRoutes);
app.use('/api/users', authentication.required, userRoutes);
app.use('/api/multiplayer', authentication.required, rateLimiter.gameAction, multiplayerRoutes);

// AI routes only if enabled
if (config.features.aiEnabled) {
  app.use('/api/ai', authentication.required, rateLimiter.ai, aiRoutes);
}

// Enhanced AI routes with n8n integration
if (process.env.N8N_BASE_URL && process.env.N8N_API_KEY) {
  app.use('/api/ai/v2', authentication.required, rateLimiter.ai, aiEnhancedRoutes);
}

// 404 handler for API routes
app.use('/api/*', notFoundHandler);

// Error handling
app.use(errorHandler);

// Initialize services
async function initializeApp() {
  try {
    logger.info('Starting Adventure Platform backend...');
    
    // Connect to databases
    logger.info('Connecting to PostgreSQL...');
    await connectDB();
    logger.info('✓ PostgreSQL connected successfully');

    logger.info('Connecting to Redis...');
    await connectRedis();
    logger.info('✓ Redis connected successfully');

    // Setup GraphQL
    if (config.features.aiEnabled || config.isDevelopment()) {
      logger.info('Setting up GraphQL...');
      await setupGraphQL(app);
      logger.info('✓ GraphQL endpoint ready at /graphql');
    }

    // Setup WebSocket
    logger.info('Initializing WebSocket handlers...');
    const socketHandlers = setupSocketHandlers(io);
    logger.info('✓ WebSocket handlers initialized');

    // Start server
    const PORT = config.PORT;
    const HOST = process.env.HOST || '0.0.0.0';
    
    server.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running on ${config.BASE_URL}`);
      logger.info(`📍 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 Frontend URL: ${config.FRONTEND_URL}`);
      logger.info(`📊 Health check: ${config.BASE_URL}/health`);
      logger.info(`📚 API info: ${config.BASE_URL}/api`);
      
      if (config.features.aiEnabled) {
        logger.info('🤖 AI features enabled');
      }
      
      if (config.isDevelopment()) {
        logger.info('🔧 Development mode - additional logging enabled');
        logger.info(`📈 GraphQL Playground: ${config.BASE_URL}/graphql`);
      }
      
      // Log enabled features
      const enabledFeatures = Object.entries(config.features)
        .filter(([key, value]) => value)
        .map(([key]) => key);
      
      if (enabledFeatures.length > 0) {
        logger.info(`✨ Features enabled: ${enabledFeatures.join(', ')}`);
      }
    });

    // Store socket handlers for graceful shutdown
    app.socketHandlers = socketHandlers;

  } catch (error) {
    logger.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  try {
    // Stop accepting new connections
    server.close(() => {
      logger.info('✓ HTTP server closed');
    });

    // Close WebSocket connections
    if (io) {
      io.close(() => {
        logger.info('✓ WebSocket server closed');
      });
    }

    // Close database connections
    try {
      const { sequelize } = require('./config/database');
      await sequelize.close();
      logger.info('✓ Database connections closed');
    } catch (error) {
      logger.warn('Warning: Error closing database connections:', error.message);
    }

    // Close Redis connection
    try {
      const { redis } = require('./config/redis');
      await redis.quit();
      logger.info('✓ Redis connection closed');
    } catch (error) {
      logger.warn('Warning: Error closing Redis connection:', error.message);
    }

    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Promise Rejection:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise
  });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the application
if (require.main === module) {
  initializeApp();
}

module.exports = { 
  app, 
  server, 
  io, 
  initializeApp,
  gracefulShutdown
};