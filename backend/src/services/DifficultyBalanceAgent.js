/**
 * Dynamic Difficulty Adjustment (DDA) System
 * Based on Csikszentmihalyi's Flow Theory
 * 
 * Maintains optimal challenge-skill balance for combat mechanics
 * Monitors player behavior and adjusts difficulty in real-time
 */

const logger = require('../utils/logger');
const { redis } = require('../config/redis');

class DifficultyBalanceAgent {
  constructor() {
    // Flow Theory constants
    this.FLOW_TARGET_SUCCESS_RATE = 0.7; // 70% success rate for optimal flow
    this.FLOW_RANGE = { min: 0.6, max: 0.8 }; // 60-80% success rate range
    
    // Detection thresholds
    this.FRUSTRATION_THRESHOLDS = {
      rapid_retries: 3, // 3+ retries in 30 seconds
      rage_quit_time: 10000, // quit within 10 seconds of death
      erratic_input_variance: 2.5, // 2.5x normal input variation
      death_streak: 3, // 3+ consecutive deaths
      negative_emotion_score: -0.6 // emotional analysis threshold
    };
    
    this.BOREDOM_THRESHOLDS = {
      perfect_execution_streak: 5, // 5+ perfect encounters
      speed_run_multiplier: 0.7, // completing 30% faster than average
      low_engagement_score: 0.3, // engagement below 30%
      repetitive_actions: 10, // same action 10+ times
      inactivity_time: 30000 // 30 seconds of minimal input
    };
    
    // Difficulty adjustment parameters
    this.DIFFICULTY_DIMENSIONS = {
      enemy_ai_complexity: { min: 0.5, max: 2.0, step: 0.1 },
      enemy_health_multiplier: { min: 0.6, max: 2.5, step: 0.1 },
      enemy_damage_multiplier: { min: 0.7, max: 2.0, step: 0.1 },
      spawn_rate_multiplier: { min: 0.5, max: 1.8, step: 0.1 },
      player_damage_resistance: { min: 0.8, max: 1.3, step: 0.05 },
      critical_hit_chance: { min: 0.05, max: 0.25, step: 0.02 }
    };
    
    // Anti-frustration features
    this.ANTI_FRUSTRATION = {
      grace_period_ms: 5000, // 5 second invulnerability after death
      health_boost_threshold: 3, // boost after 3 deaths
      damage_reduction_factor: 0.8, // 20% damage reduction when frustrated
      hint_system_activation: true,
      emergency_checkpoint: true
    };
  }

  /**
   * Main DDA update method - called after each combat encounter
   */
  async updateDifficulty(sessionId, combatData) {
    try {
      const playerMetrics = await this.getPlayerMetrics(sessionId);
      const currentDifficulty = await this.getCurrentDifficulty(sessionId);
      
      // Calculate Flow Theory metrics
      const flowMetrics = await this.calculateFlowMetrics(sessionId, combatData, playerMetrics);
      
      // Detect player state
      const playerState = await this.detectPlayerState(sessionId, combatData, playerMetrics);
      
      // Calculate difficulty adjustments
      const adjustments = this.calculateDifficultyAdjustments(flowMetrics, playerState, currentDifficulty);
      
      // Apply adjustments with transparency rules
      const newDifficulty = await this.applyDifficultyAdjustments(sessionId, adjustments, playerState);
      
      // Log and store metrics
      await this.logDifficultyChange(sessionId, {
        oldDifficulty: currentDifficulty,
        newDifficulty,
        flowMetrics,
        playerState,
        adjustments,
        combatData
      });
      
      return {
        difficulty: newDifficulty,
        playerState,
        flowMetrics,
        adjustments: adjustments.visible // Only return visible adjustments to client
      };
      
    } catch (error) {
      logger.error('DDA update error:', error);
      throw error;
    }
  }

  /**
   * Calculate Flow Theory metrics
   */
  async calculateFlowMetrics(sessionId, combatData, playerMetrics) {
    const recent_encounters = playerMetrics.recentEncounters || [];
    
    // Success rate calculation
    const successRate = recent_encounters.length > 0 
      ? recent_encounters.filter(e => e.success).length / recent_encounters.length 
      : 0.5;
    
    // Challenge-skill balance
    const skillLevel = this.calculateSkillLevel(playerMetrics);
    const challengeLevel = this.calculateChallengeLevel(combatData);
    const balanceRatio = challengeLevel / Math.max(skillLevel, 0.1);
    
    // Flow state indicators
    const timeInFlow = this.calculateTimeInFlow(recent_encounters);
    const engagementScore = this.calculateEngagementScore(playerMetrics);
    const concentrationLevel = this.calculateConcentrationLevel(playerMetrics);
    
    return {
      successRate,
      skillLevel,
      challengeLevel,
      balanceRatio,
      timeInFlow,
      engagementScore,
      concentrationLevel,
      flowScore: this.calculateOverallFlowScore({
        successRate,
        balanceRatio,
        engagementScore,
        concentrationLevel
      })
    };
  }

  /**
   * Detect current player emotional/engagement state
   */
  async detectPlayerState(sessionId, combatData, playerMetrics) {
    const frustrationScore = await this.calculateFrustrationScore(sessionId, combatData, playerMetrics);
    const boredomScore = await this.calculateBoredomScore(sessionId, combatData, playerMetrics);
    
    let primaryState = 'flow';
    if (frustrationScore > 0.7) {
      primaryState = 'frustrated';
    } else if (boredomScore > 0.7) {
      primaryState = 'bored';
    } else if (frustrationScore > 0.4 || boredomScore > 0.4) {
      primaryState = 'suboptimal';
    }
    
    return {
      primary: primaryState,
      frustrationScore,
      boredomScore,
      confidence: Math.max(frustrationScore, boredomScore),
      indicators: {
        frustration: await this.getFrustrationIndicators(sessionId, combatData, playerMetrics),
        boredom: await this.getBoredomIndicators(sessionId, combatData, playerMetrics)
      }
    };
  }

  /**
   * Calculate frustration score and indicators
   */
  async calculateFrustrationScore(sessionId, combatData, playerMetrics) {
    const indicators = await this.getFrustrationIndicators(sessionId, combatData, playerMetrics);
    
    let score = 0;
    let maxScore = 0;
    
    // Rapid retries
    if (indicators.rapidRetries >= this.FRUSTRATION_THRESHOLDS.rapid_retries) {
      score += 0.3;
    }
    maxScore += 0.3;
    
    // Death streak
    if (indicators.deathStreak >= this.FRUSTRATION_THRESHOLDS.death_streak) {
      score += 0.25;
    }
    maxScore += 0.25;
    
    // Erratic inputs
    if (indicators.inputVariance > this.FRUSTRATION_THRESHOLDS.erratic_input_variance) {
      score += 0.2;
    }
    maxScore += 0.2;
    
    // Rage quit behavior
    if (indicators.quickQuitAfterDeath) {
      score += 0.15;
    }
    maxScore += 0.15;
    
    // Emotional analysis (if available)
    if (indicators.emotionalScore < this.FRUSTRATION_THRESHOLDS.negative_emotion_score) {
      score += 0.1;
    }
    maxScore += 0.1;
    
    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Calculate boredom score and indicators
   */
  async calculateBoredomScore(sessionId, combatData, playerMetrics) {
    const indicators = await this.getBoredomIndicators(sessionId, combatData, playerMetrics);
    
    let score = 0;
    let maxScore = 0;
    
    // Perfect execution streak
    if (indicators.perfectStreak >= this.BOREDOM_THRESHOLDS.perfect_execution_streak) {
      score += 0.3;
    }
    maxScore += 0.3;
    
    // Speed running
    if (indicators.completionSpeed < this.BOREDOM_THRESHOLDS.speed_run_multiplier) {
      score += 0.25;
    }
    maxScore += 0.25;
    
    // Low engagement
    if (indicators.engagementScore < this.BOREDOM_THRESHOLDS.low_engagement_score) {
      score += 0.2;
    }
    maxScore += 0.2;
    
    // Repetitive actions
    if (indicators.repetitiveActions >= this.BOREDOM_THRESHOLDS.repetitive_actions) {
      score += 0.15;
    }
    maxScore += 0.15;
    
    // Inactivity periods
    if (indicators.inactivityTime > this.BOREDOM_THRESHOLDS.inactivity_time) {
      score += 0.1;
    }
    maxScore += 0.1;
    
    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Calculate multi-dimensional difficulty adjustments
   */
  calculateDifficultyAdjustments(flowMetrics, playerState, currentDifficulty) {
    const adjustments = {
      visible: {}, // Transparent adjustments shown to player
      hidden: {}   // Hidden adjustments for seamless experience
    };
    
    // Base adjustment strength based on how far from optimal flow
    const flowDeviation = Math.abs(flowMetrics.successRate - this.FLOW_TARGET_SUCCESS_RATE);
    const adjustmentStrength = Math.min(flowDeviation * 2, 1.0);
    
    if (playerState.primary === 'frustrated') {
      // Make game easier
      adjustments.visible.player_damage_resistance = Math.min(
        currentDifficulty.player_damage_resistance + (0.1 * adjustmentStrength),
        this.DIFFICULTY_DIMENSIONS.player_damage_resistance.max
      );
      
      adjustments.hidden.enemy_damage_multiplier = Math.max(
        currentDifficulty.enemy_damage_multiplier - (0.15 * adjustmentStrength),
        this.DIFFICULTY_DIMENSIONS.enemy_damage_multiplier.min
      );
      
      adjustments.hidden.enemy_health_multiplier = Math.max(
        currentDifficulty.enemy_health_multiplier - (0.1 * adjustmentStrength),
        this.DIFFICULTY_DIMENSIONS.enemy_health_multiplier.min
      );
      
    } else if (playerState.primary === 'bored') {
      // Make game harder
      adjustments.visible.critical_hit_chance = Math.min(
        currentDifficulty.critical_hit_chance + (0.03 * adjustmentStrength),
        this.DIFFICULTY_DIMENSIONS.critical_hit_chance.max
      );
      
      adjustments.hidden.enemy_ai_complexity = Math.min(
        currentDifficulty.enemy_ai_complexity + (0.2 * adjustmentStrength),
        this.DIFFICULTY_DIMENSIONS.enemy_ai_complexity.max
      );
      
      adjustments.hidden.spawn_rate_multiplier = Math.min(
        currentDifficulty.spawn_rate_multiplier + (0.1 * adjustmentStrength),
        this.DIFFICULTY_DIMENSIONS.spawn_rate_multiplier.max
      );
    }
    
    // Fine-tune based on success rate
    if (flowMetrics.successRate < this.FLOW_RANGE.min) {
      // Too hard - reduce difficulty
      Object.keys(adjustments.hidden).forEach(key => {
        if (key.includes('enemy_')) {
          adjustments.hidden[key] *= 0.95;
        }
      });
    } else if (flowMetrics.successRate > this.FLOW_RANGE.max) {
      // Too easy - increase difficulty
      Object.keys(adjustments.hidden).forEach(key => {
        if (key.includes('enemy_')) {
          adjustments.hidden[key] *= 1.05;
        }
      });
    }
    
    return adjustments;
  }

  /**
   * Apply anti-frustration features when needed
   */
  async applyAntiFrustrationFeatures(sessionId, playerState) {
    if (playerState.frustrationScore > 0.8) {
      const features = [];
      
      // Activate grace period
      await this.activateGracePeriod(sessionId);
      features.push('grace_period');
      
      // Provide subtle health boost
      if (playerState.indicators.frustration.deathStreak >= 3) {
        await this.applyHealthBoost(sessionId);
        features.push('health_boost');
      }
      
      // Activate hint system
      await this.activateHintSystem(sessionId);
      features.push('hint_system');
      
      // Emergency checkpoint
      await this.createEmergencyCheckpoint(sessionId);
      features.push('emergency_checkpoint');
      
      return features;
    }
    
    return [];
  }

  /**
   * Calculate player skill level based on performance metrics
   */
  calculateSkillLevel(playerMetrics) {
    const factors = {
      averageReactionTime: this.normalizeReactionTime(playerMetrics.averageReactionTime || 500),
      accuracyRate: playerMetrics.accuracyRate || 0.5,
      comboChains: this.normalizeComboChains(playerMetrics.averageComboLength || 1),
      decisionSpeed: this.normalizeDecisionSpeed(playerMetrics.averageDecisionTime || 2000),
      adaptability: playerMetrics.adaptabilityScore || 0.5
    };
    
    // Weighted skill calculation
    return (
      factors.averageReactionTime * 0.25 +
      factors.accuracyRate * 0.25 +
      factors.comboChains * 0.2 +
      factors.decisionSpeed * 0.15 +
      factors.adaptability * 0.15
    );
  }

  /**
   * Get current difficulty settings for session
   */
  async getCurrentDifficulty(sessionId) {
    const difficultyKey = `dda:difficulty:${sessionId}`;
    const cached = await redis.get(difficultyKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Default difficulty settings
    const defaultDifficulty = {
      enemy_ai_complexity: 1.0,
      enemy_health_multiplier: 1.0,
      enemy_damage_multiplier: 1.0,
      spawn_rate_multiplier: 1.0,
      player_damage_resistance: 1.0,
      critical_hit_chance: 0.1
    };
    
    await redis.setex(difficultyKey, 3600, JSON.stringify(defaultDifficulty));
    return defaultDifficulty;
  }

  /**
   * Store updated difficulty settings
   */
  async storeDifficulty(sessionId, difficulty) {
    const difficultyKey = `dda:difficulty:${sessionId}`;
    await redis.setex(difficultyKey, 3600, JSON.stringify(difficulty));
  }

  /**
   * Get comprehensive player metrics
   */
  async getPlayerMetrics(sessionId) {
    const metricsKey = `dda:metrics:${sessionId}`;
    const cached = await redis.get(metricsKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return {
      recentEncounters: [],
      averageReactionTime: 500,
      accuracyRate: 0.5,
      averageComboLength: 1,
      averageDecisionTime: 2000,
      adaptabilityScore: 0.5,
      sessionDuration: 0,
      totalCombats: 0
    };
  }

  /**
   * Helper methods for normalization and calculation
   */
  normalizeReactionTime(reactionTime) {
    // Normalize reaction time (lower is better)
    return Math.max(0, Math.min(1, (1000 - reactionTime) / 800));
  }

  normalizeComboChains(avgComboLength) {
    // Normalize combo chains (higher is better)
    return Math.min(1, avgComboLength / 10);
  }

  normalizeDecisionSpeed(decisionTime) {
    // Normalize decision speed (lower is better)
    return Math.max(0, Math.min(1, (3000 - decisionTime) / 2500));
  }

  calculateOverallFlowScore(metrics) {
    const successRateScore = 1 - Math.abs(metrics.successRate - this.FLOW_TARGET_SUCCESS_RATE) * 2;
    const balanceScore = 1 - Math.abs(metrics.balanceRatio - 1) * 0.5;
    
    return (
      successRateScore * 0.4 +
      balanceScore * 0.3 +
      metrics.engagementScore * 0.2 +
      metrics.concentrationLevel * 0.1
    );
  }

  /**
   * Get frustration indicators using PlayerStateDetector
   */
  async getFrustrationIndicators(sessionId, combatData, playerMetrics) {
    const PlayerStateDetector = require('./PlayerStateDetector');
    const detector = new PlayerStateDetector();
    return await detector.getFrustrationIndicators(sessionId, combatData, playerMetrics);
  }

  /**
   * Get boredom indicators using PlayerStateDetector
   */
  async getBoredomIndicators(sessionId, combatData, playerMetrics) {
    const PlayerStateDetector = require('./PlayerStateDetector');
    const detector = new PlayerStateDetector();
    return await detector.getBoredomIndicators(sessionId, combatData, playerMetrics);
  }

  /**
   * Calculate challenge level based on combat data
   */
  calculateChallengeLevel(combatData) {
    if (!combatData || Object.keys(combatData).length === 0) {
      return 1.0; // Default challenge level
    }

    let challengeScore = 1.0;

    // Factor in enemy count and strength
    if (combatData.enemyCount) {
      challengeScore *= Math.min(combatData.enemyCount / 3, 2.0);
    }

    // Factor in damage taken vs dealt
    if (combatData.damageTaken && combatData.damageDealt) {
      const damageRatio = combatData.damageTaken / Math.max(combatData.damageDealt, 1);
      challengeScore *= (1 + damageRatio * 0.5);
    }

    // Factor in encounter duration
    if (combatData.duration && combatData.expectedDuration) {
      const durationRatio = combatData.duration / combatData.expectedDuration;
      if (durationRatio > 1.5) {
        challengeScore *= 1.3; // Took longer than expected
      } else if (durationRatio < 0.7) {
        challengeScore *= 0.8; // Finished quickly
      }
    }

    return Math.max(0.1, Math.min(challengeScore, 3.0));
  }

  /**
   * Calculate time spent in flow state
   */
  calculateTimeInFlow(recentEncounters) {
    if (!recentEncounters || recentEncounters.length === 0) {
      return 0;
    }

    let flowTime = 0;
    recentEncounters.forEach(encounter => {
      if (encounter.successRate >= 0.6 && encounter.successRate <= 0.8 &&
          encounter.engagementScore > 0.7) {
        flowTime += encounter.duration || 0;
      }
    });

    const totalTime = recentEncounters.reduce((sum, encounter) => 
      sum + (encounter.duration || 0), 0);

    return totalTime > 0 ? flowTime / totalTime : 0;
  }

  /**
   * Calculate engagement score
   */
  calculateEngagementScore(playerMetrics) {
    // Use PlayerStateDetector for detailed engagement calculation
    const inputFrequency = (playerMetrics.inputsPerSecond || 1) / 5; // Normalize to 5 inputs/sec max
    const varietyScore = (playerMetrics.actionVariety || 3) / 6; // Normalize to 6 action types max
    const consistencyScore = 1 - (playerMetrics.performanceVariance || 0.5);

    return Math.min(1.0, (inputFrequency * 0.4 + varietyScore * 0.3 + consistencyScore * 0.3));
  }

  /**
   * Calculate concentration level
   */
  calculateConcentrationLevel(playerMetrics) {
    const reactionTimeScore = this.normalizeReactionTime(playerMetrics.averageReactionTime || 500);
    const accuracyScore = playerMetrics.accuracyRate || 0.5;
    const consistencyScore = 1 - (playerMetrics.timingVariance || 0.3);

    return (reactionTimeScore * 0.4 + accuracyScore * 0.4 + consistencyScore * 0.2);
  }

  /**
   * Apply difficulty adjustments and store them
   */
  async applyDifficultyAdjustments(sessionId, adjustments, playerState) {
    const currentDifficulty = await this.getCurrentDifficulty(sessionId);
    const newDifficulty = { ...currentDifficulty };

    // Apply visible adjustments
    Object.entries(adjustments.visible).forEach(([key, value]) => {
      if (value !== undefined) {
        newDifficulty[key] = value;
      }
    });

    // Apply hidden adjustments
    Object.entries(adjustments.hidden).forEach(([key, value]) => {
      if (value !== undefined) {
        newDifficulty[key] = value;
      }
    });

    // Apply anti-frustration features if needed
    if (playerState.frustrationScore > 0.8) {
      const AntiFrustrationSystem = require('./AntiFrustrationSystem');
      const antiFrustration = new AntiFrustrationSystem();
      await antiFrustration.applyAntiFrustrationFeatures(sessionId, playerState);
    }

    // Store updated difficulty
    await this.storeDifficulty(sessionId, newDifficulty);

    return newDifficulty;
  }

  /**
   * Activate grace period
   */
  async activateGracePeriod(sessionId) {
    const graceKey = `dda:grace_period:${sessionId}`;
    await redis.setex(graceKey, this.ANTI_FRUSTRATION.grace_period_ms / 1000, JSON.stringify({
      active: true,
      startTime: Date.now(),
      duration: this.ANTI_FRUSTRATION.grace_period_ms
    }));
  }

  /**
   * Apply health boost
   */
  async applyHealthBoost(sessionId) {
    const boostKey = `dda:health_boost:${sessionId}`;
    await redis.setex(boostKey, 60, JSON.stringify({
      active: true,
      multiplier: this.ANTI_FRUSTRATION.health_boost_threshold,
      startTime: Date.now()
    }));
  }

  /**
   * Activate hint system
   */
  async activateHintSystem(sessionId) {
    const hintKey = `dda:hints:${sessionId}`;
    await redis.setex(hintKey, 300, JSON.stringify({
      active: true,
      hintsShown: 0,
      lastHintTime: Date.now()
    }));
  }

  /**
   * Create emergency checkpoint
   */
  async createEmergencyCheckpoint(sessionId) {
    const checkpointKey = `dda:emergency_checkpoint:${sessionId}`;
    await redis.setex(checkpointKey, 3600, JSON.stringify({
      created: true,
      timestamp: Date.now(),
      reason: 'frustration_relief'
    }));
  }

  /**
   * Log difficulty change for analysis
   */
  async logDifficultyChange(sessionId, changeData) {
    const logKey = `dda:changes:${sessionId}`;
    const changes = JSON.parse(await redis.get(logKey) || '[]');
    
    changes.push({
      ...changeData,
      timestamp: Date.now()
    });

    // Keep only last 100 changes
    if (changes.length > 100) {
      changes.splice(0, changes.length - 100);
    }

    await redis.setex(logKey, 3600, JSON.stringify(changes));
  }

  /**
   * Update player metrics
   */
  async updatePlayerMetrics(sessionId, newMetrics) {
    const metricsKey = `dda:metrics:${sessionId}`;
    const currentMetrics = await this.getPlayerMetrics(sessionId);
    
    const updatedMetrics = {
      ...currentMetrics,
      ...newMetrics,
      lastUpdated: Date.now()
    };

    await redis.setex(metricsKey, 3600, JSON.stringify(updatedMetrics));
    return updatedMetrics;
  }
}

module.exports = DifficultyBalanceAgent;