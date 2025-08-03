export const createUISlice = (set, get) => ({
  // UI state
  activeModal: null,
  notifications: [],
  tooltips: {},
  sidebarOpen: true,
  inventoryOpen: false,
  mapOpen: false,
  questLogOpen: false,
  
  // Actions
  openModal: (modalId, props = {}) => {
    set((state) => {
      state.activeModal = { id: modalId, props };
    });
  },
  
  closeModal: () => {
    set((state) => {
      state.activeModal = null;
    });
  },
  
  addNotification: (notification) => {
    const id = Date.now();
    set((state) => {
      state.notifications.push({
        id,
        ...notification,
        timestamp: Date.now(),
      });
      
      // Auto-remove after duration
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 5000);
    });
    
    return id;
  },
  
  removeNotification: (id) => {
    set((state) => {
      const index = state.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        state.notifications.splice(index, 1);
      }
    });
  },
  
  toggleSidebar: () => {
    set((state) => {
      state.sidebarOpen = !state.sidebarOpen;
    });
  },
  
  toggleInventory: () => {
    set((state) => {
      state.inventoryOpen = !state.inventoryOpen;
    });
  },
  
  toggleMap: () => {
    set((state) => {
      state.mapOpen = !state.mapOpen;
    });
  },
  
  toggleQuestLog: () => {
    set((state) => {
      state.questLogOpen = !state.questLogOpen;
    });
  },
  
  showTooltip: (key, content, position) => {
    set((state) => {
      state.tooltips[key] = { content, position, visible: true };
    });
  },
  
  hideTooltip: (key) => {
    set((state) => {
      if (state.tooltips[key]) {
        state.tooltips[key].visible = false;
      }
    });
  },
  
  clearTooltip: (key) => {
    set((state) => {
      delete state.tooltips[key];
    });
  },
  
  // Keyboard shortcuts
  registerKeyboardShortcuts: () => {
    const handleKeyPress = (e) => {
      const state = get();
      
      // Don't trigger shortcuts when typing
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 'i':
          state.toggleInventory();
          break;
        case 'm':
          state.toggleMap();
          break;
        case 'q':
          state.toggleQuestLog();
          break;
        case 'escape':
          if (state.activeModal) {
            state.closeModal();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  },
});