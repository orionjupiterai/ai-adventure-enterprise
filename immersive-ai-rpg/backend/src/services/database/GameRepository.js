import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../external/SupabaseService.js';
import { logger } from '../../utils/logger.js';

export class GameRepository {
  constructor() {
    this.gamesTable = 'games';
    this.savesTable = 'game_saves';
  }

  async createGame(gameData) {
    try {
      const game = {
        id: uuidv4(),
        ...gameData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.gamesTable)
        .insert(game)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to create game', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const { data, error } = await supabase
        .from(this.gamesTable)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to find game by ID', error);
      throw error;
    }
  }

  async findBySessionId(sessionId) {
    try {
      const { data, error } = await supabase
        .from(this.gamesTable)
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to find game by session ID', error);
      throw error;
    }
  }

  async getActiveGame(userId) {
    try {
      const { data, error } = await supabase
        .from(this.gamesTable)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to get active game', error);
      throw error;
    }
  }

  async updateGameState(sessionId, gameState) {
    try {
      const { data, error } = await supabase
        .from(this.gamesTable)
        .update({
          game_state: gameState,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to update game state', error);
      throw error;
    }
  }

  async saveGame(saveData) {
    try {
      const save = {
        id: uuidv4(),
        ...saveData,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.savesTable)
        .insert(save)
        .select()
        .single();

      if (error) throw error;
      
      // Update last save time in games table
      await supabase
        .from(this.gamesTable)
        .update({ last_save: new Date().toISOString() })
        .eq('id', saveData.gameId);
      
      return data;
    } catch (error) {
      logger.error('Failed to save game', error);
      throw error;
    }
  }

  async loadGame(saveId, userId) {
    try {
      const { data, error } = await supabase
        .from(this.savesTable)
        .select('*')
        .eq('id', saveId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to load game', error);
      throw error;
    }
  }

  async getUserSaves(userId) {
    try {
      const { data, error } = await supabase
        .from(this.savesTable)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      logger.error('Failed to get user saves', error);
      throw error;
    }
  }

  async deleteSave(saveId, userId) {
    try {
      const { error } = await supabase
        .from(this.savesTable)
        .delete()
        .eq('id', saveId)
        .eq('user_id', userId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      logger.error('Failed to delete save', error);
      throw error;
    }
  }

  async updateGameStatus(sessionId, status) {
    try {
      const { data, error } = await supabase
        .from(this.gamesTable)
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to update game status', error);
      throw error;
    }
  }
}