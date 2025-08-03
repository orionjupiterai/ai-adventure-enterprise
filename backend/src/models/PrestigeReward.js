/**
 * Prestige Reward Model
 * Manages exclusive rewards for high-level players
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PrestigeReward = sequelize.define('PrestigeReward', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  reward_type: {
    type: DataTypes.ENUM(
      'cosmetic',       // Visual customization
      'story_arc',      // Exclusive narrative content
      'title',          // Player title/rank
      'emote',          // Character expressions
      'ability',        // Special game mechanics
      'customization',  // Creation tools
      'social',         // Community features
      'legacy'          // Permanent account features
    ),
    allowNull: false
  },
  rarity: {
    type: DataTypes.ENUM(
      'common',         // Tier 1-10 rewards
      'rare',           // Tier 11-25 rewards
      'epic',           // Tier 26-40 rewards
      'legendary',      // Tier 41-50 rewards
      'mythic'          // Special prestige rewards
    ),
    defaultValue: 'common'
  },
  unlock_requirements: {
    type: DataTypes.JSONB,
    allowNull: false,
    // Example: { prestige_level: 5, tier: 'luminary', season_points: 1000 }
  },
  reward_data: {
    type: DataTypes.JSONB,
    allowNull: false
    // Contains specific reward details (cosmetic IDs, story chapter refs, etc.)
  },
  category: {
    type: DataTypes.STRING(100),
    // Groups related rewards (e.g., 'ascendant_set', 'luminary_collection')
  },
  is_seasonal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  season_id: {
    type: DataTypes.STRING(50),
    // Only set if is_seasonal is true
  },
  is_exclusive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
    // Whether this reward can only be earned once
  },
  max_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
    // How many times this reward can be earned (-1 for unlimited)
  },
  intrinsic_value: {
    type: DataTypes.INTEGER,
    defaultValue: 100
    // GMEP compliance: intrinsic motivation value
  },
  social_recognition: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
    // Whether this reward provides social status
  },
  icon_url: {
    type: DataTypes.STRING(500)
  },
  preview_url: {
    type: DataTypes.STRING(500)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'prestige_rewards',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['reward_type']
    },
    {
      fields: ['rarity']
    },
    {
      fields: ['category']
    },
    {
      fields: ['season_id']
    },
    {
      fields: ['is_seasonal']
    }
  ]
});

// Instance methods
PrestigeReward.prototype.checkEligibility = function(playerPrestige) {
  const requirements = this.unlock_requirements;
  
  // Check prestige level
  if (requirements.prestige_level && playerPrestige.prestige_level < requirements.prestige_level) {
    return { eligible: false, reason: 'insufficient_prestige_level' };
  }
  
  // Check tier
  if (requirements.tier) {
    const tierOrder = ['initiate', 'ascendant', 'luminary', 'transcendent', 'eternal'];
    const requiredTierIndex = tierOrder.indexOf(requirements.tier);
    const playerTierIndex = tierOrder.indexOf(playerPrestige.tier);
    
    if (playerTierIndex < requiredTierIndex) {
      return { eligible: false, reason: 'insufficient_tier' };
    }
  }
  
  // Check seasonal points
  if (requirements.season_points && playerPrestige.current_season_points < requirements.season_points) {
    return { eligible: false, reason: 'insufficient_season_points' };
  }
  
  // Check specific achievements
  if (requirements.achievements) {
    // This would need to be checked against player's achievement data
    // For now, assume eligible
  }
  
  // Check if seasonal reward is still available
  if (this.is_seasonal && this.season_id !== playerPrestige.season_id) {
    return { eligible: false, reason: 'season_expired' };
  }
  
  return { eligible: true };
};

PrestigeReward.prototype.getDisplayInfo = function() {
  return {
    id: this.id,
    name: this.name,
    description: this.description,
    type: this.reward_type,
    rarity: this.rarity,
    category: this.category,
    isExclusive: this.is_exclusive,
    isSeasonal: this.is_seasonal,
    socialRecognition: this.social_recognition,
    iconUrl: this.icon_url,
    previewUrl: this.preview_url,
    intrinsicValue: this.intrinsic_value
  };
};

// Static methods for reward creation
PrestigeReward.createCosmetic = function(data) {
  return this.create({
    name: data.name,
    description: data.description,
    reward_type: 'cosmetic',
    rarity: data.rarity || 'common',
    unlock_requirements: data.requirements,
    reward_data: {
      cosmetic_id: data.cosmeticId,
      slot: data.slot, // 'aura', 'cloak', 'weapon', 'mount', etc.
      visual_effects: data.visualEffects || [],
      customization_options: data.customizationOptions || {}
    },
    category: data.category,
    icon_url: data.iconUrl,
    preview_url: data.previewUrl
  });
};

PrestigeReward.createStoryArc = function(data) {
  return this.create({
    name: data.name,
    description: data.description,
    reward_type: 'story_arc',
    rarity: data.rarity || 'rare',
    unlock_requirements: data.requirements,
    reward_data: {
      story_arc_id: data.storyArcId,
      chapter_count: data.chapterCount,
      estimated_playtime: data.estimatedPlaytime,
      narrative_branches: data.narrativeBranches || [],
      exclusive_characters: data.exclusiveCharacters || []
    },
    category: data.category,
    intrinsic_value: 200, // Story content has high intrinsic value
    icon_url: data.iconUrl
  });
};

PrestigeReward.createTitle = function(data) {
  return this.create({
    name: data.name,
    description: data.description,
    reward_type: 'title',
    rarity: data.rarity || 'common',
    unlock_requirements: data.requirements,
    reward_data: {
      title_text: data.titleText,
      title_color: data.titleColor || '#FFD700',
      title_effects: data.titleEffects || [],
      display_priority: data.displayPriority || 0
    },
    category: data.category,
    social_recognition: true,
    icon_url: data.iconUrl
  });
};

PrestigeReward.createAbility = function(data) {
  return this.create({
    name: data.name,
    description: data.description,
    reward_type: 'ability',
    rarity: data.rarity || 'epic',
    unlock_requirements: data.requirements,
    reward_data: {
      ability_id: data.abilityId,
      ability_type: data.abilityType, // 'passive', 'active', 'toggle'
      cooldown: data.cooldown || 0,
      description: data.mechanicsDescription,
      visual_effects: data.visualEffects || []
    },
    category: data.category,
    intrinsic_value: 150,
    icon_url: data.iconUrl
  });
};

module.exports = PrestigeReward;