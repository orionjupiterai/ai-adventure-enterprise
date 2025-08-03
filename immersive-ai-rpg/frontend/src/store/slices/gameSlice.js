export const createGameSlice = (set, get) => ({
  // Game state
  gameState: null,
  isLoading: false,
  isPaused: false,
  currentScene: null,
  combatActive: false,
  npcInteraction: null,
  gameHistory: [],
  sessionId: null,
  
  // Actions
  startGame: async (worldConfig) => {
    set((state) => {
      state.isLoading = true;
    });
    
    try {
      // API call to start new game
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(worldConfig),
      });
      
      const data = await response.json();
      
      set((state) => {
        state.gameState = data.gameState;
        state.sessionId = data.sessionId;
        state.currentScene = data.initialScene;
        state.isLoading = false;
      });
      
      return data;
    } catch (error) {
      set((state) => {
        state.isLoading = false;
      });
      throw error;
    }
  },
  
  pauseGame: () => {
    set((state) => {
      state.isPaused = true;
    });
  },
  
  resumeGame: () => {
    set((state) => {
      state.isPaused = false;
    });
  },
  
  endGame: () => {
    set((state) => {
      state.gameState = null;
      state.currentScene = null;
      state.combatActive = false;
      state.npcInteraction = null;
      state.gameHistory = [];
      state.sessionId = null;
    });
  },
  
  updateGameState: (updates) => {
    set((state) => {
      Object.assign(state.gameState, updates);
    });
  },
  
  setCurrentScene: (scene) => {
    set((state) => {
      state.currentScene = scene;
      state.gameHistory.push({
        type: 'scene',
        data: scene,
        timestamp: Date.now(),
      });
    });
  },
  
  startCombat: (enemy) => {
    set((state) => {
      state.combatActive = true;
      state.gameState.combat = {
        enemy,
        turn: 'player',
        round: 1,
        log: [],
      };
    });
  },
  
  endCombat: (result) => {
    set((state) => {
      state.combatActive = false;
      state.gameState.combat = null;
      state.gameHistory.push({
        type: 'combat_result',
        data: result,
        timestamp: Date.now(),
      });
    });
  },
  
  startNPCInteraction: (npc) => {
    set((state) => {
      state.npcInteraction = npc;
    });
  },
  
  endNPCInteraction: () => {
    set((state) => {
      state.npcInteraction = null;
    });
  },
  
  addToHistory: (entry) => {
    set((state) => {
      state.gameHistory.push({
        ...entry,
        timestamp: Date.now(),
      });
      
      // Limit history size
      if (state.gameHistory.length > 100) {
        state.gameHistory.shift();
      }
    });
  },
  
  // Computed getters
  get isInCombat() {
    return get().combatActive;
  },
  
  get canSave() {
    const state = get();
    return state.gameState && !state.combatActive && !state.isLoading;
  },
});