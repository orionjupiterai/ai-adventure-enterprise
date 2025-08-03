import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Import slices
import { createGameSlice } from './slices/gameSlice';
import { createPlayerSlice } from './slices/playerSlice';
import { createWorldSlice } from './slices/worldSlice';
import { createUISlice } from './slices/uiSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createAuthSlice } from './slices/authSlice';

// Combined store
const useStore = create(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get, store) => ({
          // Combine all slices
          ...createGameSlice(set, get, store),
          ...createPlayerSlice(set, get, store),
          ...createWorldSlice(set, get, store),
          ...createUISlice(set, get, store),
          ...createSettingsSlice(set, get, store),
          ...createAuthSlice(set, get, store),
          
          // Global actions
          resetStore: () => set((state) => {
            // Reset to initial state
            Object.keys(state).forEach(key => {
              if (typeof state[key] === 'object' && state[key] !== null) {
                state[key] = {};
              }
            });
          }),
        }))
      ),
      {
        name: 'immersive-rpg-store',
        partialize: (state) => ({
          // Only persist certain parts of the state
          player: state.player,
          settings: state.settings,
          auth: state.auth,
        }),
      }
    ),
    {
      name: 'ImmersiveRPG',
    }
  )
);

// Export individual slice hooks for better organization
export const useGameStore = () => useStore((state) => ({
  gameState: state.gameState,
  isLoading: state.isLoading,
  currentScene: state.currentScene,
  combatActive: state.combatActive,
  npcInteraction: state.npcInteraction,
  startGame: state.startGame,
  pauseGame: state.pauseGame,
  resumeGame: state.resumeGame,
  endGame: state.endGame,
  updateGameState: state.updateGameState,
}));

export const usePlayerStore = () => useStore((state) => ({
  player: state.player,
  inventory: state.inventory,
  equipment: state.equipment,
  skills: state.skills,
  updatePlayer: state.updatePlayer,
  addItem: state.addItem,
  removeItem: state.removeItem,
  equipItem: state.equipItem,
  unequipItem: state.unequipItem,
  learnSkill: state.learnSkill,
  levelUp: state.levelUp,
}));

export const useWorldStore = () => useStore((state) => ({
  world: state.world,
  currentLocation: state.currentLocation,
  discoveredLocations: state.discoveredLocations,
  activeQuests: state.activeQuests,
  completedQuests: state.completedQuests,
  factions: state.factions,
  updateWorld: state.updateWorld,
  changeLocation: state.changeLocation,
  discoverLocation: state.discoverLocation,
  startQuest: state.startQuest,
  completeQuest: state.completeQuest,
  updateFactionRelation: state.updateFactionRelation,
}));

export const useUIStore = () => useStore((state) => ({
  activeModal: state.activeModal,
  notifications: state.notifications,
  tooltips: state.tooltips,
  sidebarOpen: state.sidebarOpen,
  openModal: state.openModal,
  closeModal: state.closeModal,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  toggleSidebar: state.toggleSidebar,
  showTooltip: state.showTooltip,
  hideTooltip: state.hideTooltip,
}));

export const useSettingsStore = () => useStore((state) => ({
  settings: state.settings,
  updateSettings: state.updateSettings,
  resetSettings: state.resetSettings,
}));

export const useAuthStore = () => useStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  login: state.login,
  logout: state.logout,
  updateUser: state.updateUser,
}));

export default useStore;