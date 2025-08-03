const Redis = require('ioredis');
const logger = require('../utils/logger');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('reconnecting', () => {
  logger.info('Redis client reconnecting');
});

const connectRedis = async () => {
  try {
    await redis.ping();
    logger.info('Redis connection established successfully');
    return redis;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

// Session management utilities
const sessionStore = {
  // Set session data with TTL (default 24 hours)
  async setSession(sessionId, data, ttl = 86400) {
    try {
      const key = `session:${sessionId}`;
      await redis.setex(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error('Error setting session:', error);
      return false;
    }
  },

  // Get session data
  async getSession(sessionId) {
    try {
      const key = `session:${sessionId}`;
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  },

  // Delete session
  async deleteSession(sessionId) {
    try {
      const key = `session:${sessionId}`;
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('Error deleting session:', error);
      return false;
    }
  },

  // Update session TTL
  async refreshSession(sessionId, ttl = 86400) {
    try {
      const key = `session:${sessionId}`;
      await redis.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error('Error refreshing session:', error);
      return false;
    }
  }
};

// Cache utilities
const cache = {
  // Set cache with TTL
  async set(key, value, ttl = 3600) {
    try {
      await redis.setex(`cache:${key}`, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Error setting cache:', error);
      return false;
    }
  },

  // Get cache
  async get(key) {
    try {
      const data = await redis.get(`cache:${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting cache:', error);
      return null;
    }
  },

  // Delete cache
  async del(key) {
    try {
      await redis.del(`cache:${key}`);
      return true;
    } catch (error) {
      logger.error('Error deleting cache:', error);
      return false;
    }
  },

  // Clear all cache with pattern
  async clearPattern(pattern) {
    try {
      const keys = await redis.keys(`cache:${pattern}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Error clearing cache pattern:', error);
      return false;
    }
  }
};

// Real-time data utilities for multiplayer
const realtime = {
  // Set user online status
  async setUserOnline(userId, socketId) {
    try {
      await redis.setex(`online:${userId}`, 300, socketId); // 5 minutes TTL
      await redis.sadd('online_users', userId);
      return true;
    } catch (error) {
      logger.error('Error setting user online:', error);
      return false;
    }
  },

  // Set user offline
  async setUserOffline(userId) {
    try {
      await redis.del(`online:${userId}`);
      await redis.srem('online_users', userId);
      return true;
    } catch (error) {
      logger.error('Error setting user offline:', error);
      return false;
    }
  },

  // Get online users
  async getOnlineUsers() {
    try {
      return await redis.smembers('online_users');
    } catch (error) {
      logger.error('Error getting online users:', error);
      return [];
    }
  },

  // Check if user is online
  async isUserOnline(userId) {
    try {
      return await redis.exists(`online:${userId}`);
    } catch (error) {
      logger.error('Error checking user online status:', error);
      return false;
    }
  }
};

module.exports = { 
  redis, 
  connectRedis, 
  sessionStore, 
  cache, 
  realtime 
};