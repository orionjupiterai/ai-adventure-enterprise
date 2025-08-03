/**
 * Prestige System Model
 * Manages high-level player progression following GMEP principles
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PrestigeSystem = sequelize.define('PrestigeSystem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  prestige_level: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 20 // Cap to prevent infinite progression
    }
  },
  total_prestige_points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  current_season_points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  season_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  tier: {
    type: DataTypes.ENUM(
      'initiate',      // Prestige 0-1
      'ascendant',     // Prestige 2-4  
      'luminary',      // Prestige 5-9
      'transcendent',  // Prestige 10-14
      'eternal'        // Prestige 15-20
    ),
    defaultValue: 'initiate'
  },
  unlocked_story_arcs: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  unlocked_cosmetics: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  unlocked_titles: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  mentor_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lifetime_hours_played: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  skill_masteries: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  last_prestige_date: {
    type: DataTypes.DATE
  },
  season_start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'prestige_systems',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['user_id'],
      unique: true
    },
    {
      fields: ['season_id']
    },
    {
      fields: ['tier']
    },
    {
      fields: ['prestige_level']
    }
  ]
});

// Instance methods
PrestigeSystem.prototype.canPrestige = function() {
  // Only allow prestige if player is level 100+ and hasn't prestiged in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return !this.last_prestige_date || this.last_prestige_date < thirtyDaysAgo;
};

PrestigeSystem.prototype.calculateNextTier = function() {
  const tierThresholds = {
    initiate: 2,
    ascendant: 5,
    luminary: 10,
    transcendent: 15,
    eternal: 21 // Max tier
  };

  for (const [tier, threshold] of Object.entries(tierThresholds)) {
    if (this.prestige_level < threshold) {
      return tier;
    }
  }
  return 'eternal';
};

PrestigeSystem.prototype.getSeasonProgress = function() {
  const seasonDuration = 90 * 24 * 60 * 60 * 1000; // 90 days
  const seasonStart = new Date(this.season_start_date);
  const seasonEnd = new Date(seasonStart.getTime() + seasonDuration);
  const now = new Date();
  
  if (now > seasonEnd) {
    return { expired: true, daysRemaining: 0, progress: 1.0 };
  }
  
  const totalDuration = seasonEnd - seasonStart;
  const elapsed = now - seasonStart;
  const progress = Math.max(0, Math.min(1, elapsed / totalDuration));
  const daysRemaining = Math.ceil((seasonEnd - now) / (24 * 60 * 60 * 1000));
  
  return { expired: false, daysRemaining, progress };
};

PrestigeSystem.prototype.getTierBenefits = function() {
  const benefits = {
    initiate: {
      storyArcs: ['prologue_extended'],
      cosmetics: ['prestige_aura_basic'],
      titles: ['The Awakened'],
      mentorSlots: 0,
      specialFeatures: []
    },
    ascendant: {
      storyArcs: ['prologue_extended', 'ascendant_chronicles'],
      cosmetics: ['prestige_aura_basic', 'ascendant_cloak', 'ethereal_weapons'],
      titles: ['The Awakened', 'Ascendant Scholar', 'Realm Walker'],
      mentorSlots: 2,
      specialFeatures: ['custom_world_templates']
    },
    luminary: {
      storyArcs: ['prologue_extended', 'ascendant_chronicles', 'luminary_saga'],
      cosmetics: ['prestige_aura_basic', 'ascendant_cloak', 'ethereal_weapons', 'luminary_crown', 'celestial_mount'],
      titles: ['The Awakened', 'Ascendant Scholar', 'Realm Walker', 'Luminary Master', 'Star Touched'],
      mentorSlots: 5,
      specialFeatures: ['custom_world_templates', 'advanced_ai_personalities', 'beta_feature_access']
    },
    transcendent: {
      storyArcs: ['prologue_extended', 'ascendant_chronicles', 'luminary_saga', 'transcendent_mysteries'],
      cosmetics: ['prestige_aura_basic', 'ascendant_cloak', 'ethereal_weapons', 'luminary_crown', 'celestial_mount', 'transcendent_form', 'reality_warper_effects'],
      titles: ['The Awakened', 'Ascendant Scholar', 'Realm Walker', 'Luminary Master', 'Star Touched', 'Transcendent One', 'Reality Shaper'],
      mentorSlots: 10,
      specialFeatures: ['custom_world_templates', 'advanced_ai_personalities', 'beta_feature_access', 'developer_collaboration', 'community_events_hosting']
    },
    eternal: {
      storyArcs: ['prologue_extended', 'ascendant_chronicles', 'luminary_saga', 'transcendent_mysteries', 'eternal_codex'],
      cosmetics: ['prestige_aura_basic', 'ascendant_cloak', 'ethereal_weapons', 'luminary_crown', 'celestial_mount', 'transcendent_form', 'reality_warper_effects', 'eternal_manifestation', 'universe_creator_tools'],
      titles: ['The Awakened', 'Ascendant Scholar', 'Realm Walker', 'Luminary Master', 'Star Touched', 'Transcendent One', 'Reality Shaper', 'Eternal Guardian', 'Universe Architect'],
      mentorSlots: 25,
      specialFeatures: ['custom_world_templates', 'advanced_ai_personalities', 'beta_feature_access', 'developer_collaboration', 'community_events_hosting', 'lore_contribution', 'eternal_legacy_creation']
    }
  };

  return benefits[this.tier] || benefits.initiate;
};

module.exports = PrestigeSystem;