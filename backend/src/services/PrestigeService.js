/**
 * Prestige System Service
 * Manages high-level player progression following GMEP principles
 */

const EventEmitter = require('events');
const { PrestigeSystem, SeasonalTrack, PrestigeReward, User, Achievement } = require('../models');
const { v4: uuidv4 } = require('uuid');

class PrestigeService extends EventEmitter {
  constructor() {
    super();
    
    // GMEP compliance settings
    this.gmepSettings = {
      maxDailyPrestigeProgress: 200,
      maxSeasonalTracksActive: 3,
      cooldownBetweenPrestige: 30 * 24 * 60 * 60 * 1000, // 30 days
      intrinsicRewardMinimum: 0.7, // 70% of rewards must be intrinsic
      maxPrestigeLevel: 20,
      seasonDurationDays: 90
    };
    
    // Current season configuration
    this.currentSeason = {
      id: 'season_2025_winter',
      name: 'Winter of Ascension',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-04-01'),
      theme: 'exploration_mastery'
    };
    
    // Prestige tier configuration
    this.tierConfig = {
      initiate: {
        levelRange: [0, 1],
        pointsRequired: 0,
        benefits: {
          storyArcsUnlocked: 1,
          cosmeticsUnlocked: 2,
          titlesUnlocked: 1,
          mentorSlots: 0,
          specialFeatures: []
        }
      },
      ascendant: {
        levelRange: [2, 4],
        pointsRequired: 2500,
        benefits: {
          storyArcsUnlocked: 3,
          cosmeticsUnlocked: 8,
          titlesUnlocked: 5,
          mentorSlots: 2,
          specialFeatures: ['custom_world_templates', 'advanced_character_creation']
        }
      },
      luminary: {
        levelRange: [5, 9],
        pointsRequired: 10000,
        benefits: {
          storyArcsUnlocked: 7,
          cosmeticsUnlocked: 20,
          titlesUnlocked: 12,
          mentorSlots: 5,
          specialFeatures: ['custom_world_templates', 'advanced_character_creation', 'beta_feature_access', 'ai_personality_creation']
        }
      },
      transcendent: {
        levelRange: [10, 14],
        pointsRequired: 25000,
        benefits: {
          storyArcsUnlocked: 15,
          cosmeticsUnlocked: 40,
          titlesUnlocked: 25,
          mentorSlots: 10,
          specialFeatures: ['custom_world_templates', 'advanced_character_creation', 'beta_feature_access', 'ai_personality_creation', 'developer_collaboration', 'community_event_hosting']
        }
      },
      eternal: {
        levelRange: [15, 20],
        pointsRequired: 50000,
        benefits: {
          storyArcsUnlocked: 30,
          cosmeticsUnlocked: 80,
          titlesUnlocked: 50,
          mentorSlots: 25,
          specialFeatures: ['custom_world_templates', 'advanced_character_creation', 'beta_feature_access', 'ai_personality_creation', 'developer_collaboration', 'community_event_hosting', 'lore_contribution', 'eternal_legacy_creation']
        }
      }
    };
  }

  /**
   * Initialize prestige system for a player
   */
  async initializePlayerPrestige(userId, playerLevel = 100) {
    // Only initialize if player is level 100+
    if (playerLevel < 100) {
      throw new Error('Player must be level 100 or higher to access prestige system');
    }

    const existingPrestige = await PrestigeSystem.findOne({ where: { user_id: userId } });
    if (existingPrestige) {
      return existingPrestige;
    }

    // Create prestige system entry
    const prestigeSystem = await PrestigeSystem.create({
      user_id: userId,
      season_id: this.currentSeason.id,
      season_start_date: this.currentSeason.startDate,
      tier: 'initiate'
    });

    // Initialize seasonal tracks
    await this.initializeSeasonalTracks(userId);

    this.emit('prestige:initialized', { userId, prestigeSystem });
    return prestigeSystem;
  }

  /**
   * Initialize seasonal tracks for a player
   */
  async initializeSeasonalTracks(userId) {
    const trackTypes = ['exploration', 'mastery', 'social', 'creative', 'narrative'];
    
    for (const trackType of trackTypes) {
      await SeasonalTrack.create({
        user_id: userId,
        season_id: this.currentSeason.id,
        track_type: trackType,
        season_start_date: this.currentSeason.startDate,
        season_end_date: this.currentSeason.endDate
      });
    }
  }

  /**
   * Award prestige points for various activities
   */
  async awardPrestigePoints(userId, activity, points, context = {}) {
    const prestigeSystem = await PrestigeSystem.findOne({ where: { user_id: userId } });
    if (!prestigeSystem) {
      throw new Error('Player not enrolled in prestige system');
    }

    // GMEP: Check daily progress limits
    const dailyProgress = await this.getDailyPrestigeProgress(userId);
    if (dailyProgress >= this.gmepSettings.maxDailyPrestigeProgress) {
      return {
        success: false,
        reason: 'daily_limit_reached',
        limit: this.gmepSettings.maxDailyPrestigeProgress
      };
    }

    const adjustedPoints = Math.min(points, this.gmepSettings.maxDailyPrestigeProgress - dailyProgress);
    
    // Update prestige system
    prestigeSystem.total_prestige_points += adjustedPoints;
    prestigeSystem.current_season_points += adjustedPoints;
    
    // Check for tier advancement
    const oldTier = prestigeSystem.tier;
    const newTier = this.calculateTier(prestigeSystem.total_prestige_points);
    
    if (newTier !== oldTier) {
      prestigeSystem.tier = newTier;
      await this.handleTierAdvancement(prestigeSystem, oldTier, newTier);
    }

    await prestigeSystem.save();

    // Update relevant seasonal tracks
    await this.updateSeasonalTracks(userId, activity, adjustedPoints, context);

    this.emit('prestige:points_awarded', {
      userId,
      activity,
      points: adjustedPoints,
      totalPoints: prestigeSystem.total_prestige_points,
      tier: prestigeSystem.tier,
      tierChanged: newTier !== oldTier
    });

    return {
      success: true,
      pointsAwarded: adjustedPoints,
      totalPoints: prestigeSystem.total_prestige_points,
      tier: prestigeSystem.tier,
      tierAdvanced: newTier !== oldTier
    };
  }

  /**
   * Handle prestige advancement (reset to level 1 with prestige level increase)
   */
  async handlePrestigeAdvancement(userId) {
    const prestigeSystem = await PrestigeSystem.findOne({ where: { user_id: userId } });
    if (!prestigeSystem) {
      throw new Error('Player not enrolled in prestige system');
    }

    // Check if player can prestige
    if (!prestigeSystem.canPrestige()) {
      const cooldownRemaining = this.gmepSettings.cooldownBetweenPrestige - 
        (Date.now() - new Date(prestigeSystem.last_prestige_date).getTime());
      return {
        success: false,
        reason: 'cooldown_active',
        cooldownDays: Math.ceil(cooldownRemaining / (24 * 60 * 60 * 1000))
      };
    }

    // Increase prestige level
    if (prestigeSystem.prestige_level >= this.gmepSettings.maxPrestigeLevel) {
      return {
        success: false,
        reason: 'max_prestige_reached'
      };
    }

    const oldPrestigeLevel = prestigeSystem.prestige_level;
    prestigeSystem.prestige_level += 1;
    prestigeSystem.last_prestige_date = new Date();
    
    // Award prestige-specific rewards
    const prestigeRewards = await this.grantPrestigeRewards(prestigeSystem);
    
    await prestigeSystem.save();

    this.emit('prestige:advancement', {
      userId,
      oldLevel: oldPrestigeLevel,
      newLevel: prestigeSystem.prestige_level,
      rewards: prestigeRewards
    });

    return {
      success: true,
      newPrestigeLevel: prestigeSystem.prestige_level,
      rewards: prestigeRewards
    };
  }

  /**
   * Calculate tier based on total prestige points
   */
  calculateTier(totalPoints) {
    for (const [tier, config] of Object.entries(this.tierConfig)) {
      if (totalPoints >= config.pointsRequired) {
        continue;
      }
      return tier;
    }
    return 'eternal';
  }

  /**
   * Handle tier advancement rewards and unlocks
   */
  async handleTierAdvancement(prestigeSystem, oldTier, newTier) {
    const tierRewards = await this.getTierRewards(newTier);
    
    // Unlock story arcs
    const newStoryArcs = tierRewards.filter(r => r.reward_type === 'story_arc');
    prestigeSystem.unlocked_story_arcs = [
      ...prestigeSystem.unlocked_story_arcs,
      ...newStoryArcs.map(r => r.reward_data.story_arc_id)
    ];

    // Unlock cosmetics
    const newCosmetics = tierRewards.filter(r => r.reward_type === 'cosmetic');
    prestigeSystem.unlocked_cosmetics = [
      ...prestigeSystem.unlocked_cosmetics,
      ...newCosmetics.map(r => r.reward_data.cosmetic_id)
    ];

    // Unlock titles
    const newTitles = tierRewards.filter(r => r.reward_type === 'title');
    prestigeSystem.unlocked_titles = [
      ...prestigeSystem.unlocked_titles,
      ...newTitles.map(r => r.reward_data.title_text)
    ];

    this.emit('prestige:tier_advanced', {
      userId: prestigeSystem.user_id,
      oldTier,
      newTier,
      rewards: tierRewards
    });
  }

  /**
   * Update seasonal tracks based on activity
   */
  async updateSeasonalTracks(userId, activity, points, context) {
    const activityToTrackMapping = {
      'world_exploration': 'exploration',
      'location_discovery': 'exploration',
      'skill_advancement': 'mastery',
      'challenge_completion': 'mastery',
      'mentoring_session': 'social',
      'community_event': 'social',
      'world_creation': 'creative',
      'customization_unlock': 'creative',
      'story_completion': 'narrative',
      'lore_discovery': 'narrative'
    };

    const trackType = activityToTrackMapping[activity];
    if (!trackType) return;

    const seasonalTrack = await SeasonalTrack.findOne({
      where: {
        user_id: userId,
        season_id: this.currentSeason.id,
        track_type: trackType
      }
    });

    if (seasonalTrack && seasonalTrack.isSeasonActive()) {
      const result = seasonalTrack.addProgress(points, activity);
      if (result.success) {
        await seasonalTrack.save();
        
        if (result.advancement.advanced) {
          this.emit('seasonal_track:tier_advanced', {
            userId,
            trackType,
            advancement: result.advancement
          });
        }
      }
    }
  }

  /**
   * Get tier-specific rewards
   */
  async getTierRewards(tier) {
    return await PrestigeReward.findAll({
      where: {
        'unlock_requirements.tier': tier
      }
    });
  }

  /**
   * Grant prestige-level specific rewards
   */
  async grantPrestigeRewards(prestigeSystem) {
    const prestigeLevel = prestigeSystem.prestige_level;
    
    // Get rewards for this specific prestige level
    const prestigeRewards = await PrestigeReward.findAll({
      where: {
        'unlock_requirements.prestige_level': prestigeLevel
      }
    });

    const grantedRewards = [];

    for (const reward of prestigeRewards) {
      const eligibility = reward.checkEligibility(prestigeSystem);
      if (eligibility.eligible) {
        grantedRewards.push(reward);
        
        // Apply the reward based on type
        switch (reward.reward_type) {
          case 'cosmetic':
            prestigeSystem.unlocked_cosmetics.push(reward.reward_data.cosmetic_id);
            break;
          case 'story_arc':
            prestigeSystem.unlocked_story_arcs.push(reward.reward_data.story_arc_id);
            break;
          case 'title':
            prestigeSystem.unlocked_titles.push(reward.reward_data.title_text);
            break;
        }
      }
    }

    return grantedRewards;
  }

  /**
   * Get comprehensive prestige status for a player
   */
  async getPrestigeStatus(userId) {
    const prestigeSystem = await PrestigeSystem.findOne({ where: { user_id: userId } });
    if (!prestigeSystem) {
      return { enrolled: false };
    }

    const seasonalTracks = await SeasonalTrack.findAll({
      where: {
        user_id: userId,
        season_id: this.currentSeason.id
      }
    });

    const tierBenefits = prestigeSystem.getTierBenefits();
    const seasonProgress = prestigeSystem.getSeasonProgress();
    
    return {
      enrolled: true,
      prestigeLevel: prestigeSystem.prestige_level,
      tier: prestigeSystem.tier,
      totalPoints: prestigeSystem.total_prestige_points,
      seasonPoints: prestigeSystem.current_season_points,
      seasonProgress,
      tierBenefits,
      seasonalTracks: seasonalTracks.map(track => ({
        type: track.track_type,
        tier: track.current_tier,
        progress: track.current_progress,
        threshold: track.tier_threshold,
        timeRemaining: track.getSeasonTimeRemaining()
      })),
      unlockedContent: {
        storyArcs: prestigeSystem.unlocked_story_arcs,
        cosmetics: prestigeSystem.unlocked_cosmetics,
        titles: prestigeSystem.unlocked_titles
      },
      mentorStatus: prestigeSystem.mentor_status,
      canPrestige: prestigeSystem.canPrestige(),
      currentSeason: this.currentSeason
    };
  }

  /**
   * Get daily prestige progress for GMEP compliance
   */
  async getDailyPrestigeProgress(userId) {
    // This would typically be stored in Redis or a separate daily tracking table
    // For now, simplified implementation
    return 0;
  }

  /**
   * Start new season and reset seasonal progress
   */
  async startNewSeason(seasonConfig) {
    this.currentSeason = seasonConfig;
    
    // Reset seasonal points for all players
    await PrestigeSystem.update(
      { 
        current_season_points: 0,
        season_id: seasonConfig.id,
        season_start_date: seasonConfig.startDate
      },
      { where: {} }
    );

    // Archive old seasonal tracks and create new ones
    await SeasonalTrack.update(
      { is_completed: true },
      { where: { season_id: { $ne: seasonConfig.id } } }
    );

    // Initialize new seasonal tracks for active prestige players
    const activePrestigePlayers = await PrestigeSystem.findAll({
      where: { is_active: true }
    });

    for (const player of activePrestigePlayers) {
      await this.initializeSeasonalTracks(player.user_id);
    }

    this.emit('season:started', { seasonConfig });
  }

  /**
   * Get leaderboards for prestige players
   */
  async getPrestigeLeaderboards(limit = 50) {
    const seasonLeaderboard = await PrestigeSystem.findAll({
      include: [{ model: User, attributes: ['username', 'display_name'] }],
      order: [['current_season_points', 'DESC']],
      limit,
      where: { is_active: true }
    });

    const allTimeLeaderboard = await PrestigeSystem.findAll({
      include: [{ model: User, attributes: ['username', 'display_name'] }],
      order: [['total_prestige_points', 'DESC']],
      limit,
      where: { is_active: true }
    });

    return {
      currentSeason: seasonLeaderboard.map(p => ({
        userId: p.user_id,
        username: p.User.username,
        displayName: p.User.display_name,
        points: p.current_season_points,
        tier: p.tier,
        prestigeLevel: p.prestige_level
      })),
      allTime: allTimeLeaderboard.map(p => ({
        userId: p.user_id,
        username: p.User.username,
        displayName: p.User.display_name,
        points: p.total_prestige_points,
        tier: p.tier,
        prestigeLevel: p.prestige_level
      }))
    };
  }

  /**
   * GMEP compliance validation
   */
  validateGMEPCompliance(activity, points, userId) {
    // Prevent excessive point awards
    if (points > 100) {
      return { compliant: false, reason: 'excessive_points_single_activity' };
    }

    // Ensure intrinsic rewards are prioritized
    const intrinsicActivities = [
      'story_completion', 'lore_discovery', 'world_exploration',
      'mentoring_session', 'creative_achievement'
    ];
    
    if (!intrinsicActivities.includes(activity)) {
      // Reduce points for extrinsic activities
      points = Math.floor(points * 0.7);
    }

    return { compliant: true, adjustedPoints: points };
  }
}

module.exports = PrestigeService;