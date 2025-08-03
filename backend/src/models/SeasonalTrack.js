/**
 * Seasonal Track Model
 * Manages time-limited prestige progression with resets
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SeasonalTrack = sequelize.define('SeasonalTrack', {
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
  season_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  track_type: {
    type: DataTypes.ENUM(
      'exploration',    // Discovery and world exploration
      'mastery',        // Skill development and challenges
      'social',         // Community engagement and mentoring
      'creative',       // Content creation and customization
      'narrative'       // Story completion and lore discovery
    ),
    allowNull: false
  },
  current_tier: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 50 // 50 tiers per seasonal track
    }
  },
  current_progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tier_threshold: {
    type: DataTypes.INTEGER,
    defaultValue: 100 // Points needed for next tier
  },
  total_points_earned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completed_challenges: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  unlocked_rewards: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  premium_track: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // GMEP: No paid advantages, this is for visual distinction only
  },
  last_activity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  season_start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  season_end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'seasonal_tracks',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['user_id', 'season_id', 'track_type'],
      unique: true
    },
    {
      fields: ['season_id']
    },
    {
      fields: ['track_type']
    }
  ]
});

// Instance methods
SeasonalTrack.prototype.addProgress = function(points, source = 'activity') {
  // GMEP: Prevent excessive grinding by capping daily progress
  const dailyProgressCap = 500;
  const today = new Date().toDateString();
  const todayProgress = this.getTodayProgress();
  
  if (todayProgress >= dailyProgressCap) {
    return {
      success: false,
      reason: 'daily_progress_cap_reached',
      cap: dailyProgressCap
    };
  }
  
  const adjustedPoints = Math.min(points, dailyProgressCap - todayProgress);
  this.current_progress += adjustedPoints;
  this.total_points_earned += adjustedPoints;
  this.last_activity = new Date();
  
  // Check for tier advancement
  const advancement = this.checkTierAdvancement();
  
  return {
    success: true,
    pointsAdded: adjustedPoints,
    advancement,
    source
  };
};

SeasonalTrack.prototype.checkTierAdvancement = function() {
  if (this.current_progress >= this.tier_threshold && this.current_tier < 50) {
    const oldTier = this.current_tier;
    this.current_tier += 1;
    this.current_progress -= this.tier_threshold;
    
    // Increase threshold for next tier (progressive difficulty)
    this.tier_threshold = Math.floor(this.tier_threshold * 1.15);
    
    const rewards = this.getTierRewards(this.current_tier);
    this.unlocked_rewards.push(...rewards);
    
    return {
      advanced: true,
      oldTier,
      newTier: this.current_tier,
      rewards
    };
  }
  
  return { advanced: false };
};

SeasonalTrack.prototype.getTierRewards = function(tier) {
  const rewardTables = {
    exploration: {
      5: [{ type: 'cosmetic', item: 'explorer_compass' }],
      10: [{ type: 'story', item: 'hidden_paths_chapter' }],
      15: [{ type: 'cosmetic', item: 'cartographer_cloak' }],
      25: [{ type: 'ability', item: 'true_sight' }],
      35: [{ type: 'cosmetic', item: 'realm_walker_boots' }],
      50: [{ type: 'story', item: 'explorer_legacy_arc' }, { type: 'title', item: 'Master Explorer' }]
    },
    mastery: {
      5: [{ type: 'skill_points', amount: 3 }],
      10: [{ type: 'cosmetic', item: 'adept_robes' }],
      15: [{ type: 'ability', item: 'perfect_focus' }],
      25: [{ type: 'cosmetic', item: 'master_insignia' }],
      35: [{ type: 'story', item: 'mastery_trials_arc' }],
      50: [{ type: 'title', item: 'Grandmaster' }, { type: 'cosmetic', item: 'transcendent_aura' }]
    },
    social: {
      5: [{ type: 'emote', item: 'mentor_gesture' }],
      10: [{ type: 'cosmetic', item: 'community_banner' }],
      15: [{ type: 'ability', item: 'inspiring_presence' }],
      25: [{ type: 'cosmetic', item: 'diplomat_regalia' }],
      35: [{ type: 'story', item: 'unity_chronicles' }],
      50: [{ type: 'title', item: 'Community Pillar' }, { type: 'ability', item: 'legendary_mentor' }]
    },
    creative: {
      5: [{ type: 'customization', item: 'color_palette_expanded' }],
      10: [{ type: 'cosmetic', item: 'artist_tools' }],
      15: [{ type: 'ability', item: 'creative_vision' }],
      25: [{ type: 'cosmetic', item: 'creator_studio' }],
      35: [{ type: 'story', item: 'artisan_legacy' }],
      50: [{ type: 'title', item: 'Master Creator' }, { type: 'ability', item: 'reality_sculptor' }]
    },
    narrative: {
      5: [{ type: 'story', item: 'lore_fragment_1' }],
      10: [{ type: 'cosmetic', item: 'chronicler_tome' }],
      15: [{ type: 'story', item: 'ancient_mysteries_chapter' }],
      25: [{ type: 'cosmetic', item: 'lorekeeper_robes' }],
      35: [{ type: 'ability', item: 'story_sense' }],
      50: [{ type: 'title', item: 'Grand Chronicler' }, { type: 'story', item: 'eternal_narrative_access' }]
    }
  };
  
  const trackRewards = rewardTables[this.track_type] || {};
  return trackRewards[tier] || [];
};

SeasonalTrack.prototype.getTodayProgress = function() {
  // This would need to track daily progress in a separate table or redis
  // For now, simplified implementation
  return 0;
};

SeasonalTrack.prototype.isSeasonActive = function() {
  const now = new Date();
  return now >= this.season_start_date && now <= this.season_end_date;
};

SeasonalTrack.prototype.getSeasonTimeRemaining = function() {
  const now = new Date();
  const timeRemaining = this.season_end_date - now;
  
  if (timeRemaining <= 0) {
    return { expired: true, days: 0, hours: 0 };
  }
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return { expired: false, days, hours };
};

module.exports = SeasonalTrack;