const path = require('path');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Validate JWT secret strength
const validateJWTSecret = (secret, name) => {
  if (secret.length < 32) {
    console.error(`${name} must be at least 32 characters long for security`);
    process.exit(1);
  }
  if (secret === 'your_jwt_secret_change_in_production' || 
      secret === 'your_refresh_secret_change_in_production') {
    console.error(`${name} must be changed from default value in production`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

validateJWTSecret(process.env.JWT_SECRET, 'JWT_SECRET');
validateJWTSecret(process.env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');

const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  BASE_URL: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  
  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://adventure_user:adventure_secret@localhost:5432/adventure_platform',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'adventure_platform',
    user: process.env.DB_USER || 'adventure_user',
    password: process.env.DB_PASSWORD || 'adventure_secret',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    }
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // Password hashing
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  
  // File uploads
  uploads: {
    maxSize: process.env.UPLOAD_MAX_SIZE || '100MB',
    avatarMaxSize: process.env.AVATAR_MAX_SIZE || '5MB',
    worldMaxSize: process.env.WORLD_MAX_SIZE || '50MB',
    saveMaxSize: process.env.SAVE_MAX_SIZE || '10MB',
    tempMaxSize: process.env.TEMP_MAX_SIZE || '100MB',
    paths: {
      base: path.join(__dirname, '../../../uploads'),
      avatars: path.join(__dirname, '../../../uploads/avatars'),
      worlds: path.join(__dirname, '../../../uploads/worlds'),
      saves: path.join(__dirname, '../../../uploads/saves'),
      temp: path.join(__dirname, '../../../uploads/temp')
    }
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    auth: {
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
      windowMs: 15 * 60 * 1000
    },
    ai: {
      max: parseInt(process.env.AI_RATE_LIMIT_MAX) || 20,
      windowMs: 60 * 1000
    },
    upload: {
      max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX) || 50,
      windowMs: 60 * 60 * 1000
    }
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    console: process.env.NODE_ENV === 'development'
  },
  
  // OpenAI (optional)
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
    enabled: process.env.ENABLE_AI_FEATURES === 'true' && !!process.env.OPENAI_API_KEY
  },
  
  // Email (optional)
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    },
    from: process.env.EMAIL_FROM || 'Adventure Platform <noreply@adventureplatform.com>',
    enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)
  },
  
  // Security
  security: {
    trustProxy: process.env.TRUST_PROXY === 'true',
    helmet: {
      csp: process.env.HELMET_CSP_ENABLED === 'true'
    }
  },
  
  // Session
  session: {
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    rolling: true,
    resave: false,
    saveUninitialized: false
  },
  
  // Feature flags
  features: {
    aiEnabled: process.env.ENABLE_AI_FEATURES === 'true',
    voiceChatEnabled: process.env.ENABLE_VOICE_CHAT === 'true',
    analyticsEnabled: process.env.ENABLE_ANALYTICS === 'true',
    emailVerificationEnabled: process.env.ENABLE_EMAIL_VERIFICATION === 'true'
  },
  
  // Monitoring
  monitoring: {
    healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
    metricsEnabled: process.env.METRICS_ENABLED === 'true'
  },
  
  // Development
  development: {
    seedData: process.env.DEVELOPMENT_SEED_DATA === 'true',
    autoMigrate: process.env.DEVELOPMENT_AUTO_MIGRATE !== 'false'
  },
  
  // WebSocket
  websocket: {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  }
};

// Production environment validations
if (config.NODE_ENV === 'production') {
  const productionChecks = [
    { check: () => config.jwt.secret.length >= 64, message: 'JWT_SECRET should be at least 64 characters in production' },
    { check: () => config.jwt.refreshSecret.length >= 64, message: 'JWT_REFRESH_SECRET should be at least 64 characters in production' },
    { check: () => config.bcrypt.rounds >= 12, message: 'BCRYPT_ROUNDS should be at least 12 in production' },
    { check: () => config.database.ssl, message: 'Database SSL should be enabled in production' },
    { check: () => config.BASE_URL.startsWith('https://'), message: 'BASE_URL should use HTTPS in production' }
  ];
  
  const failedChecks = productionChecks.filter(check => !check.check());
  if (failedChecks.length > 0) {
    console.warn('Production security warnings:');
    failedChecks.forEach(check => console.warn(`- ${check.message}`));
  }
}

// Helper functions
config.isDevelopment = () => config.NODE_ENV === 'development';
config.isProduction = () => config.NODE_ENV === 'production';
config.isTest = () => config.NODE_ENV === 'test';

// Size conversion helpers
config.parseSize = (size) => {
  if (typeof size === 'number') return size;
  if (typeof size !== 'string') return 0;
  
  const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i);
  
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  
  return Math.floor(value * units[unit]);
};

// Convert upload sizes to bytes
Object.keys(config.uploads).forEach(key => {
  if (key.includes('Size')) {
    config.uploads[key] = config.parseSize(config.uploads[key]);
  }
});

module.exports = config;