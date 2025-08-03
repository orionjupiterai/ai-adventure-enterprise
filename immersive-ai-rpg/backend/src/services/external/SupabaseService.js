import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Supabase credentials not found. Using mock database.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient();

// Mock Supabase client for development without Supabase
function createMockSupabaseClient() {
  const mockData = {
    users: new Map(),
    games: new Map(),
    game_saves: new Map(),
  };

  return {
    from: (table) => ({
      select: (columns = '*') => ({
        eq: (column, value) => ({
          single: async () => {
            const items = Array.from(mockData[table]?.values() || []);
            const item = items.find(i => i[column] === value);
            return { data: item || null, error: item ? null : { code: 'PGRST116' } };
          },
          order: () => ({
            limit: () => ({
              single: async () => {
                const items = Array.from(mockData[table]?.values() || []);
                const item = items.find(i => i[column] === value);
                return { data: item || null, error: item ? null : { code: 'PGRST116' } };
              },
            }),
          }),
        }),
        single: async () => {
          const items = Array.from(mockData[table]?.values() || []);
          return { data: items[0] || null, error: items[0] ? null : { code: 'PGRST116' } };
        },
      }),
      
      insert: (data) => ({
        select: () => ({
          single: async () => {
            if (!mockData[table]) mockData[table] = new Map();
            mockData[table].set(data.id, data);
            return { data, error: null };
          },
        }),
      }),
      
      update: (updates) => ({
        eq: (column, value) => ({
          select: () => ({
            single: async () => {
              const items = Array.from(mockData[table]?.values() || []);
              const item = items.find(i => i[column] === value);
              if (item) {
                Object.assign(item, updates);
                return { data: item, error: null };
              }
              return { data: null, error: { code: 'PGRST116' } };
            },
          }),
        }),
      }),
      
      delete: () => ({
        eq: (column, value) => ({
          single: async () => {
            const items = Array.from(mockData[table]?.values() || []);
            const item = items.find(i => i[column] === value);
            if (item) {
              mockData[table].delete(item.id);
              return { data: item, error: null };
            }
            return { data: null, error: { code: 'PGRST116' } };
          },
        }),
      }),
    }),
  };
}