import { logger } from '../utils/logger.js';
import { supabase } from './external/SupabaseService.js';
import { RedisService } from './external/RedisService.js';

export async function initializeServices() {
  try {
    logger.info('Initializing services...');
    
    // Initialize Redis
    if (process.env.REDIS_URL) {
      await RedisService.initialize();
      logger.info('Redis connected');
    } else {
      logger.warn('Redis URL not provided, caching disabled');
    }
    
    // Test Supabase connection
    if (process.env.SUPABASE_URL) {
      const { error } = await supabase.from('users').select('count').limit(1);
      if (error && error.code !== 'PGRST116') {
        logger.error('Supabase connection error:', error);
      } else {
        logger.info('Supabase connected');
      }
    } else {
      logger.warn('Supabase not configured, using mock database');
    }
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
}