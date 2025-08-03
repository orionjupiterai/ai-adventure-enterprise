import { apiClient } from './client';

export const gameAPI = {
  // Start a new game
  startGame: async (gameConfig) => {
    const response = await apiClient.post('/game/start', gameConfig);
    return response.data;
  },

  // Get current game state
  getGameState: async (sessionId) => {
    const response = await apiClient.get(`/game/state/${sessionId}`);
    return response.data;
  },

  // Get active session
  getActiveSession: async () => {
    try {
      const response = await apiClient.get('/game/active');
      return response.data.session;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Save game
  saveGame: async (saveData) => {
    const response = await apiClient.post('/game/save', saveData);
    return response.data;
  },

  // Load game
  loadGame: async (saveId) => {
    const response = await apiClient.get(`/game/load/${saveId}`);
    return response.data;
  },

  // Get all saves
  getSaves: async () => {
    const response = await apiClient.get('/game/saves');
    return response.data.saves;
  },

  // Delete save
  deleteSave: async (saveId) => {
    const response = await apiClient.delete(`/game/save/${saveId}`);
    return response.data;
  },

  // Process player action
  processAction: async (actionData) => {
    const response = await apiClient.post('/game/action', actionData);
    return response.data;
  },

  // Get game statistics
  getStats: async (sessionId) => {
    const response = await apiClient.get(`/game/stats/${sessionId}`);
    return response.data;
  },

  // End game session
  endGame: async (sessionId) => {
    const response = await apiClient.post(`/game/end/${sessionId}`);
    return response.data;
  },

  // Quick save
  quickSave: async (sessionId) => {
    const response = await apiClient.post('/game/quick-save', { sessionId });
    return response.data;
  },

  // Quick load
  quickLoad: async () => {
    const response = await apiClient.get('/game/quick-load');
    return response.data;
  },
};