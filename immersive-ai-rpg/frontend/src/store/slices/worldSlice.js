export const createWorldSlice = (set, get) => ({
  // World state
  world: {
    id: null,
    name: '',
    theme: 'fantasy',
    description: '',
    currentTime: 'day',
    weather: 'clear',
    season: 'spring',
  },
  
  currentLocation: null,
  discoveredLocations: [],
  activeQuests: [],
  completedQuests: [],
  factions: [],
  worldEvents: [],
  
  // Actions
  updateWorld: (updates) => {
    set((state) => {
      Object.assign(state.world, updates);
    });
  },
  
  changeLocation: (location) => {
    set((state) => {
      state.currentLocation = location;
      
      // Add to discovered locations if new
      if (!state.discoveredLocations.find(l => l.id === location.id)) {
        state.discoveredLocations.push(location);
      }
    });
  },
  
  discoverLocation: (location) => {
    set((state) => {
      if (!state.discoveredLocations.find(l => l.id === location.id)) {
        state.discoveredLocations.push(location);
      }
    });
  },
  
  startQuest: (quest) => {
    set((state) => {
      if (!state.activeQuests.find(q => q.id === quest.id)) {
        state.activeQuests.push({
          ...quest,
          startedAt: Date.now(),
          progress: {},
          status: 'active',
        });
      }
    });
  },
  
  updateQuestProgress: (questId, progress) => {
    set((state) => {
      const quest = state.activeQuests.find(q => q.id === questId);
      if (quest) {
        quest.progress = { ...quest.progress, ...progress };
      }
    });
  },
  
  completeQuest: (questId) => {
    set((state) => {
      const questIndex = state.activeQuests.findIndex(q => q.id === questId);
      if (questIndex !== -1) {
        const quest = state.activeQuests[questIndex];
        quest.status = 'completed';
        quest.completedAt = Date.now();
        
        // Move to completed quests
        state.completedQuests.push(quest);
        state.activeQuests.splice(questIndex, 1);
      }
    });
  },
  
  failQuest: (questId) => {
    set((state) => {
      const questIndex = state.activeQuests.findIndex(q => q.id === questId);
      if (questIndex !== -1) {
        const quest = state.activeQuests[questIndex];
        quest.status = 'failed';
        quest.failedAt = Date.now();
        
        // Move to completed quests (failed quests are also "completed")
        state.completedQuests.push(quest);
        state.activeQuests.splice(questIndex, 1);
      }
    });
  },
  
  updateFactionRelation: (factionId, change) => {
    set((state) => {
      const faction = state.factions.find(f => f.id === factionId);
      if (faction) {
        faction.reputation = Math.max(-100, Math.min(100, faction.reputation + change));
        
        // Update faction status based on reputation
        if (faction.reputation >= 50) {
          faction.status = 'allied';
        } else if (faction.reputation >= 0) {
          faction.status = 'neutral';
        } else if (faction.reputation >= -50) {
          faction.status = 'unfriendly';
        } else {
          faction.status = 'hostile';
        }
      }
    });
  },
  
  addWorldEvent: (event) => {
    set((state) => {
      state.worldEvents.push({
        ...event,
        timestamp: Date.now(),
      });
      
      // Keep only recent events
      if (state.worldEvents.length > 50) {
        state.worldEvents.shift();
      }
    });
  },
  
  advanceTime: () => {
    set((state) => {
      const timeOrder = ['dawn', 'morning', 'day', 'evening', 'night'];
      const currentIndex = timeOrder.indexOf(state.world.currentTime);
      const nextIndex = (currentIndex + 1) % timeOrder.length;
      state.world.currentTime = timeOrder[nextIndex];
      
      // Chance of weather change
      if (Math.random() < 0.3) {
        const weatherTypes = ['clear', 'cloudy', 'rain', 'storm', 'fog'];
        state.world.weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
      }
    });
  },
  
  // Computed getters
  get activeQuestCount() {
    return get().activeQuests.length;
  },
  
  get discoveredLocationCount() {
    return get().discoveredLocations.length;
  },
  
  get alliedFactions() {
    return get().factions.filter(f => f.status === 'allied');
  },
  
  get hostileFactions() {
    return get().factions.filter(f => f.status === 'hostile');
  },
});