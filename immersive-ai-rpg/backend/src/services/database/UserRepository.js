import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../external/SupabaseService.js';
import { logger } from '../../utils/logger.js';

export class UserRepository {
  constructor() {
    this.tableName = 'users';
  }

  async create(userData) {
    try {
      const user = {
        id: uuidv4(),
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(user)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to create user', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to find user by ID', error);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to find user by email', error);
      throw error;
    }
  }

  async findByUsername(username) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to find user by username', error);
      throw error;
    }
  }

  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to update user', error);
      throw error;
    }
  }

  async updateLastLogin(id) {
    return this.update(id, { last_login: new Date().toISOString() });
  }

  async updatePassword(id, passwordHash) {
    return this.update(id, { password_hash: passwordHash });
  }

  async updateSettings(id, settings) {
    return this.update(id, { settings });
  }

  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return true;
    } catch (error) {
      logger.error('Failed to delete user', error);
      throw error;
    }
  }

  async list(filters = {}) {
    try {
      let query = supabase.from(this.tableName).select('*');
      
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to list users', error);
      throw error;
    }
  }
}