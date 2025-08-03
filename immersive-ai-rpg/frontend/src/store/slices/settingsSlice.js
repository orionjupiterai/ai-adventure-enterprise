export const createSettingsSlice = (set, get) => ({
  // Settings state
  settings: {
    // Audio
    masterVolume: 50,
    soundEnabled: true,
    musicEnabled: true,
    voiceEnabled: true,
    soundVolume: 50,
    musicVolume: 50,
    voiceVolume: 50,
    
    // Gameplay
    autoSave: true,
    autoSaveInterval: 5, // minutes
    showHints: true,
    difficulty: 'standard',
    textSpeed: 'normal',
    skipSeen: false,
    confirmActions: true,
    pauseInMenus: true,
    
    // Display
    theme: 'dark',
    showFPS: false,
    fullscreen: false,
    resolution: 'auto',
    graphicsQuality: 'high',
    particleEffects: true,
    screenShake: true,
    
    // Controls
    keyBindings: {
      moveUp: 'w',
      moveDown: 's',
      moveLeft: 'a',
      moveRight: 'd',
      interact: 'e',
      inventory: 'i',
      map: 'm',
      questLog: 'q',
      quickSave: 'f5',
      quickLoad: 'f9',
    },
    
    // Accessibility
    colorblindMode: 'none',
    subtitles: true,
    largeText: false,
    highContrast: false,
    reduceMotion: false,
    
    // Privacy
    analytics: true,
    crashReports: true,
  },
  
  // Actions
  updateSettings: (updates) => {
    set((state) => {
      Object.assign(state.settings, updates);
      
      // Apply settings immediately
      get().applySettings(updates);
    });
  },
  
  updateKeybinding: (action, key) => {
    set((state) => {
      state.settings.keyBindings[action] = key;
    });
  },
  
  resetSettings: () => {
    set((state) => {
      // Reset to defaults
      state.settings = get().getDefaultSettings();
    });
  },
  
  resetKeybindings: () => {
    set((state) => {
      state.settings.keyBindings = get().getDefaultKeybindings();
    });
  },
  
  applySettings: (changedSettings) => {
    // Apply audio settings
    if ('masterVolume' in changedSettings) {
      // Update audio system master volume
    }
    
    // Apply theme
    if ('theme' in changedSettings) {
      document.documentElement.setAttribute('data-theme', changedSettings.theme);
    }
    
    // Apply accessibility settings
    if ('reduceMotion' in changedSettings) {
      document.documentElement.classList.toggle('reduce-motion', changedSettings.reduceMotion);
    }
    
    if ('largeText' in changedSettings) {
      document.documentElement.classList.toggle('large-text', changedSettings.largeText);
    }
    
    if ('highContrast' in changedSettings) {
      document.documentElement.classList.toggle('high-contrast', changedSettings.highContrast);
    }
  },
  
  getDefaultSettings: () => ({
    masterVolume: 50,
    soundEnabled: true,
    musicEnabled: true,
    voiceEnabled: true,
    soundVolume: 50,
    musicVolume: 50,
    voiceVolume: 50,
    autoSave: true,
    autoSaveInterval: 5,
    showHints: true,
    difficulty: 'standard',
    textSpeed: 'normal',
    skipSeen: false,
    confirmActions: true,
    pauseInMenus: true,
    theme: 'dark',
    showFPS: false,
    fullscreen: false,
    resolution: 'auto',
    graphicsQuality: 'high',
    particleEffects: true,
    screenShake: true,
    colorblindMode: 'none',
    subtitles: true,
    largeText: false,
    highContrast: false,
    reduceMotion: false,
    analytics: true,
    crashReports: true,
  }),
  
  getDefaultKeybindings: () => ({
    moveUp: 'w',
    moveDown: 's',
    moveLeft: 'a',
    moveRight: 'd',
    interact: 'e',
    inventory: 'i',
    map: 'm',
    questLog: 'q',
    quickSave: 'f5',
    quickLoad: 'f9',
  }),
  
  // Computed getters
  get effectiveVolume() {
    const { settings } = get();
    return {
      sound: settings.soundEnabled ? (settings.masterVolume * settings.soundVolume) / 100 : 0,
      music: settings.musicEnabled ? (settings.masterVolume * settings.musicVolume) / 100 : 0,
      voice: settings.voiceEnabled ? (settings.masterVolume * settings.voiceVolume) / 100 : 0,
    };
  },
});