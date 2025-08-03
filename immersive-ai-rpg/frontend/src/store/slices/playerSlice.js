export const createPlayerSlice = (set, get) => ({
  // Player state
  player: {
    id: null,
    name: '',
    class: '',
    race: '',
    level: 1,
    experience: 0,
    experienceToNext: 100,
    hp_current: 100,
    hp_max: 100,
    mana_current: 50,
    mana_max: 50,
    stamina_current: 100,
    stamina_max: 100,
    stats: {
      strength: 10,
      dexterity: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      constitution: 10,
    },
    gold: 0,
    location: null,
    appearance: {},
    backstory: '',
  },
  
  inventory: [],
  equipment: {
    weapon: null,
    armor: null,
    accessory: null,
  },
  
  skills: [],
  unlockedSkills: [],
  skillPoints: 0,
  
  // Actions
  updatePlayer: (updates) => {
    set((state) => {
      Object.assign(state.player, updates);
    });
  },
  
  addItem: (item) => {
    set((state) => {
      const existingItem = state.inventory.find(i => i.id === item.id && i.stackable);
      if (existingItem) {
        existingItem.quantity += item.quantity || 1;
      } else {
        state.inventory.push({ ...item, quantity: item.quantity || 1 });
      }
    });
  },
  
  removeItem: (itemId, quantity = 1) => {
    set((state) => {
      const itemIndex = state.inventory.findIndex(i => i.id === itemId);
      if (itemIndex !== -1) {
        const item = state.inventory[itemIndex];
        if (item.quantity > quantity) {
          item.quantity -= quantity;
        } else {
          state.inventory.splice(itemIndex, 1);
        }
      }
    });
  },
  
  equipItem: (item, slot) => {
    set((state) => {
      // Unequip current item if any
      if (state.equipment[slot]) {
        state.inventory.push(state.equipment[slot]);
      }
      
      // Equip new item
      state.equipment[slot] = item;
      
      // Remove from inventory
      const itemIndex = state.inventory.findIndex(i => i.id === item.id);
      if (itemIndex !== -1) {
        state.inventory.splice(itemIndex, 1);
      }
    });
  },
  
  unequipItem: (slot) => {
    set((state) => {
      if (state.equipment[slot]) {
        state.inventory.push(state.equipment[slot]);
        state.equipment[slot] = null;
      }
    });
  },
  
  learnSkill: (skill) => {
    set((state) => {
      if (!state.skills.find(s => s.id === skill.id)) {
        state.skills.push(skill);
        state.unlockedSkills.push(skill.id);
        if (state.skillPoints > 0) {
          state.skillPoints--;
        }
      }
    });
  },
  
  levelUp: () => {
    set((state) => {
      state.player.level++;
      state.player.hp_max += 10;
      state.player.hp_current = state.player.hp_max;
      state.player.mana_max += 5;
      state.player.mana_current = state.player.mana_max;
      state.skillPoints += 1;
      state.player.experience = state.player.experience - state.player.experienceToNext;
      state.player.experienceToNext = Math.floor(state.player.experienceToNext * 1.5);
      
      // Increase stats
      state.player.stats.strength += 1;
      state.player.stats.constitution += 1;
    });
  },
  
  takeDamage: (damage) => {
    set((state) => {
      state.player.hp_current = Math.max(0, state.player.hp_current - damage);
    });
  },
  
  heal: (amount) => {
    set((state) => {
      state.player.hp_current = Math.min(state.player.hp_max, state.player.hp_current + amount);
    });
  },
  
  useMana: (amount) => {
    set((state) => {
      state.player.mana_current = Math.max(0, state.player.mana_current - amount);
    });
  },
  
  restoreMana: (amount) => {
    set((state) => {
      state.player.mana_current = Math.min(state.player.mana_max, state.player.mana_current + amount);
    });
  },
  
  // Computed getters
  get isAlive() {
    return get().player.hp_current > 0;
  },
  
  get canCast() {
    return get().player.mana_current > 0;
  },
  
  get inventoryWeight() {
    return get().inventory.reduce((total, item) => total + (item.weight || 0) * (item.quantity || 1), 0);
  },
});