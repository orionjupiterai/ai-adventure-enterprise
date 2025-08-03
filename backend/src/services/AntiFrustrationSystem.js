/**
 * Anti-Frustration System
 * Implements safety nets and player support features
 * Activates automatically when frustration is detected
 */

const logger = require('../utils/logger');
const { redis } = require('../config/redis');

class AntiFrustrationSystem {
  constructor() {
    // Frustration intervention thresholds
    this.INTERVENTION_LEVELS = {
      mild: 0.4,      // Subtle hints and minor adjustments
      moderate: 0.6,  // More obvious help and difficulty reduction
      severe: 0.8,    // Aggressive intervention and safety nets
      critical: 0.9   // Emergency measures
    };
    
    // Available anti-frustration features
    this.FEATURES = {
      grace_period: {
        duration: 5000,
        invulnerability: true,
        description: 'Brief invulnerability after taking damage'
      },
      health_boost: {
        multiplier: 1.3,
        duration: 30000,
        description: 'Temporary health increase'
      },
      damage_reduction: {
        multiplier: 0.7,
        duration: 60000,
        description: 'Reduced incoming damage'
      },
      hint_system: {
        types: ['combat_tips', 'strategy_hints', 'weakness_reveals'],
        frequency: 'on_demand',
        description: 'Contextual gameplay hints'
      },
      checkpoint_creation: {
        frequency: 'after_death',
        description: 'Automatic progress saving'
      },
      ability_cooldown_reduction: {
        multiplier: 0.7,
        duration: 45000,
        description: 'Faster ability recovery'
      },
      enemy_weakening: {
        health_reduction: 0.2,
        ai_simplification: true,
        description: 'Temporary enemy weakness'
      }
    };
    
    // Hint templates
    this.HINT_TEMPLATES = {
      combat_tips: [
        'Try using your dodge ability just before the enemy attacks',
        'Blocking can reduce damage significantly',
        'Look for enemy attack patterns to predict their moves',
        'Use your special abilities when enemies are vulnerable',
        'Environmental objects can be used as weapons or shields'
      ],
      strategy_hints: [
        'Focus on one enemy at a time to avoid being overwhelmed',
        'Keep moving to avoid getting surrounded',
        'Use the terrain to your advantage',
        'Save your powerful abilities for tough enemies',
        'Watch your stamina - don\'t exhaust yourself'
      ],
      weakness_reveals: [
        'This enemy is weak to fire attacks',
        'Attack after the enemy finishes their combo',
        'This enemy has slower reactions to side attacks',
        'Use ranged attacks when the enemy is charging',
        'This enemy becomes vulnerable after using special abilities'
      ]
    };
  }

  /**
   * Main intervention method - called when frustration is detected
   */
  async activateIntervention(sessionId, frustrationLevel, playerState, combatContext) {
    try {
      const interventionLevel = this.determineInterventionLevel(frustrationLevel);
      const activeFeatures = await this.getActiveFeatures(sessionId);
      
      const interventions = await this.selectInterventions(
        interventionLevel,
        playerState,
        combatContext,
        activeFeatures
      );
      
      const results = await this.applyInterventions(sessionId, interventions);
      
      // Log intervention for transparency and analysis
      await this.logIntervention(sessionId, {
        frustrationLevel,
        interventionLevel,
        interventions: interventions.map(i => i.type),
        playerState,
        timestamp: Date.now()
      });
      
      return {
        activated: true,
        interventions: results.visible, // Only return visible interventions
        level: interventionLevel
      };
      
    } catch (error) {
      logger.error('Anti-frustration intervention error:', error);
      return { activated: false, error: error.message };
    }
  }

  /**
   * Determine intervention level based on frustration score
   */
  determineInterventionLevel(frustrationLevel) {
    if (frustrationLevel >= this.INTERVENTION_LEVELS.critical) {
      return 'critical';
    } else if (frustrationLevel >= this.INTERVENTION_LEVELS.severe) {
      return 'severe';
    } else if (frustrationLevel >= this.INTERVENTION_LEVELS.moderate) {
      return 'moderate';
    } else if (frustrationLevel >= this.INTERVENTION_LEVELS.mild) {
      return 'mild';
    }
    return 'none';
  }

  /**
   * Select appropriate interventions based on context
   */
  async selectInterventions(level, playerState, combatContext, activeFeatures) {
    const interventions = [];
    
    switch (level) {
      case 'critical':
        // Emergency interventions
        if (!activeFeatures.includes('grace_period')) {
          interventions.push({
            type: 'grace_period',
            config: { ...this.FEATURES.grace_period, duration: 8000 },
            visible: false
          });
        }
        
        if (!activeFeatures.includes('enemy_weakening')) {
          interventions.push({
            type: 'enemy_weakening',
            config: { ...this.FEATURES.enemy_weakening, health_reduction: 0.4 },
            visible: false
          });
        }
        
        interventions.push({
          type: 'checkpoint_creation',
          config: this.FEATURES.checkpoint_creation,
          visible: true
        });
        
        // Fall through to include severe interventions
        
      case 'severe':
        if (!activeFeatures.includes('health_boost')) {
          interventions.push({
            type: 'health_boost',
            config: { ...this.FEATURES.health_boost, multiplier: 1.4 },
            visible: true
          });
        }
        
        if (!activeFeatures.includes('damage_reduction')) {
          interventions.push({
            type: 'damage_reduction',
            config: { ...this.FEATURES.damage_reduction, multiplier: 0.6 },
            visible: false
          });
        }
        
        interventions.push({
          type: 'hint_system',
          config: {
            ...this.FEATURES.hint_system,
            immediate: true,
            types: ['weakness_reveals', 'strategy_hints']
          },
          visible: true
        });
        
        // Fall through to include moderate interventions
        
      case 'moderate':
        if (!activeFeatures.includes('ability_cooldown_reduction')) {
          interventions.push({
            type: 'ability_cooldown_reduction',
            config: this.FEATURES.ability_cooldown_reduction,
            visible: true
          });
        }
        
        if (playerState.indicators.frustration.deathStreak >= 2) {
          interventions.push({
            type: 'grace_period',
            config: { ...this.FEATURES.grace_period, duration: 3000 },
            visible: false
          });
        }
        
        // Fall through to include mild interventions
        
      case 'mild':
        interventions.push({
          type: 'hint_system',
          config: {
            ...this.FEATURES.hint_system,
            types: ['combat_tips']
          },
          visible: true
        });
        
        break;
    }
    
    return interventions;
  }

  /**
   * Apply selected interventions
   */
  async applyInterventions(sessionId, interventions) {
    const results = {
      visible: [],
      hidden: [],
      errors: []
    };
    
    for (const intervention of interventions) {
      try {
        const result = await this.applySpecificIntervention(sessionId, intervention);
        
        if (intervention.visible) {
          results.visible.push({
            type: intervention.type,
            description: this.FEATURES[intervention.type].description,
            config: intervention.config,
            result
          });
        } else {
          results.hidden.push({
            type: intervention.type,
            result
          });
        }
        
      } catch (error) {
        logger.error(`Failed to apply intervention ${intervention.type}:`, error);
        results.errors.push({
          type: intervention.type,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Apply specific intervention type
   */
  async applySpecificIntervention(sessionId, intervention) {
    const { type, config } = intervention;
    
    switch (type) {
      case 'grace_period':
        return await this.activateGracePeriod(sessionId, config);
        
      case 'health_boost':
        return await this.applyHealthBoost(sessionId, config);
        
      case 'damage_reduction':
        return await this.applyDamageReduction(sessionId, config);
        
      case 'hint_system':
        return await this.activateHintSystem(sessionId, config);
        
      case 'checkpoint_creation':
        return await this.createEmergencyCheckpoint(sessionId, config);
        
      case 'ability_cooldown_reduction':
        return await this.applyAbilityCooldownReduction(sessionId, config);
        
      case 'enemy_weakening':
        return await this.applyEnemyWeakening(sessionId, config);
        
      default:
        throw new Error(`Unknown intervention type: ${type}`);
    }
  }

  /**
   * Activate grace period (temporary invulnerability)
   */
  async activateGracePeriod(sessionId, config) {
    const graceKey = `anti_frustration:grace_period:${sessionId}`;
    
    await redis.setex(graceKey, Math.ceil(config.duration / 1000), JSON.stringify({
      active: true,
      startTime: Date.now(),
      duration: config.duration,
      invulnerability: config.invulnerability
    }));
    
    return {
      activated: true,
      duration: config.duration,
      type: 'grace_period'
    };
  }

  /**
   * Apply temporary health boost
   */
  async applyHealthBoost(sessionId, config) {
    const boostKey = `anti_frustration:health_boost:${sessionId}`;
    
    await redis.setex(boostKey, Math.ceil(config.duration / 1000), JSON.stringify({
      active: true,
      multiplier: config.multiplier,
      startTime: Date.now(),
      duration: config.duration
    }));
    
    return {
      activated: true,
      multiplier: config.multiplier,
      duration: config.duration,
      type: 'health_boost'
    };
  }

  /**
   * Apply damage reduction
   */
  async applyDamageReduction(sessionId, config) {
    const reductionKey = `anti_frustration:damage_reduction:${sessionId}`;
    
    await redis.setex(reductionKey, Math.ceil(config.duration / 1000), JSON.stringify({
      active: true,
      multiplier: config.multiplier,
      startTime: Date.now(),
      duration: config.duration
    }));
    
    return {
      activated: true,
      reduction: 1 - config.multiplier,
      duration: config.duration,
      type: 'damage_reduction'
    };
  }

  /**
   * Activate contextual hint system
   */
  async activateHintSystem(sessionId, config) {
    const hints = await this.generateContextualHints(sessionId, config);
    
    const hintKey = `anti_frustration:hints:${sessionId}`;
    await redis.setex(hintKey, 300, JSON.stringify({
      active: true,
      hints,
      displayedHints: [],
      nextHintTime: Date.now() + (config.immediate ? 0 : 5000)
    }));
    
    return {
      activated: true,
      hintsAvailable: hints.length,
      immediateHint: config.immediate ? hints[0] : null,
      type: 'hint_system'
    };
  }

  /**
   * Create emergency checkpoint
   */
  async createEmergencyCheckpoint(sessionId, config) {
    const checkpointKey = `anti_frustration:checkpoint:${sessionId}`;
    const timestamp = Date.now();
    
    // This would integrate with the actual game state saving system
    await redis.setex(checkpointKey, 3600, JSON.stringify({
      created: true,
      timestamp,
      type: 'emergency',
      reason: 'frustration_intervention'
    }));
    
    return {
      created: true,
      timestamp,
      type: 'emergency_checkpoint'
    };
  }

  /**
   * Apply ability cooldown reduction
   */
  async applyAbilityCooldownReduction(sessionId, config) {
    const cooldownKey = `anti_frustration:cooldown_reduction:${sessionId}`;
    
    await redis.setex(cooldownKey, Math.ceil(config.duration / 1000), JSON.stringify({
      active: true,
      multiplier: config.multiplier,
      startTime: Date.now(),
      duration: config.duration
    }));
    
    return {
      activated: true,
      reduction: 1 - config.multiplier,
      duration: config.duration,
      type: 'cooldown_reduction'
    };
  }

  /**
   * Apply enemy weakening
   */
  async applyEnemyWeakening(sessionId, config) {
    const weakeningKey = `anti_frustration:enemy_weakening:${sessionId}`;
    
    await redis.setex(weakeningKey, 120, JSON.stringify({
      active: true,
      healthReduction: config.health_reduction,
      aiSimplification: config.ai_simplification,
      startTime: Date.now()
    }));
    
    return {
      activated: true,
      healthReduction: config.health_reduction,
      aiSimplified: config.ai_simplification,
      type: 'enemy_weakening'
    };
  }

  /**
   * Generate contextual hints based on player situation
   */
  async generateContextualHints(sessionId, config) {
    const hints = [];
    
    for (const hintType of config.types) {
      if (this.HINT_TEMPLATES[hintType]) {
        // Select relevant hints based on context
        const availableHints = this.HINT_TEMPLATES[hintType];
        const selectedHints = this.selectRelevantHints(sessionId, availableHints, hintType);
        hints.push(...selectedHints);
      }
    }
    
    // Shuffle and limit hints
    return this.shuffleArray(hints).slice(0, 3);
  }

  /**
   * Select hints relevant to current situation
   */
  selectRelevantHints(sessionId, availableHints, hintType) {
    // This would be enhanced to consider current combat context,
    // enemy types, player abilities, etc.
    
    // For now, return a random selection
    const numHints = Math.min(2, availableHints.length);
    return this.shuffleArray(availableHints).slice(0, numHints);
  }

  /**
   * Get currently active anti-frustration features
   */
  async getActiveFeatures(sessionId) {
    const features = [];
    const keys = [
      'grace_period',
      'health_boost',
      'damage_reduction',
      'hint_system',
      'ability_cooldown_reduction',
      'enemy_weakening'
    ];
    
    for (const key of keys) {
      const redisKey = `anti_frustration:${key}:${sessionId}`;
      const active = await redis.get(redisKey);
      if (active) {
        features.push(key);
      }
    }
    
    return features;
  }

  /**
   * Check if intervention is currently active
   */
  async isInterventionActive(sessionId, interventionType) {
    const key = `anti_frustration:${interventionType}:${sessionId}`;
    const data = await redis.get(key);
    
    if (!data) return false;
    
    const intervention = JSON.parse(data);
    
    // Check if intervention has expired
    if (intervention.duration && intervention.startTime) {
      const elapsed = Date.now() - intervention.startTime;
      if (elapsed > intervention.duration) {
        await redis.del(key);
        return false;
      }
    }
    
    return intervention.active;
  }

  /**
   * Get intervention status for UI display
   */
  async getInterventionStatus(sessionId) {
    const status = {};
    const features = await this.getActiveFeatures(sessionId);
    
    for (const feature of features) {
      const key = `anti_frustration:${feature}:${sessionId}`;
      const data = await redis.get(key);
      
      if (data) {
        const intervention = JSON.parse(data);
        status[feature] = {
          active: true,
          timeRemaining: intervention.duration ? 
            Math.max(0, intervention.duration - (Date.now() - intervention.startTime)) : null,
          config: intervention
        };
      }
    }
    
    return status;
  }

  /**
   * Log intervention for analysis and transparency
   */
  async logIntervention(sessionId, interventionData) {
    const logKey = `anti_frustration:log:${sessionId}`;
    const log = JSON.parse(await redis.get(logKey) || '[]');
    
    log.push(interventionData);
    
    // Keep only last 50 interventions
    if (log.length > 50) {
      log.splice(0, log.length - 50);
    }
    
    await redis.setex(logKey, 3600, JSON.stringify(log));
  }

  /**
   * Generate intervention analytics
   */
  async generateInterventionAnalytics(sessionId) {
    const logKey = `anti_frustration:log:${sessionId}`;
    const log = JSON.parse(await redis.get(logKey) || '[]');
    
    if (log.length === 0) {
      return {
        totalInterventions: 0,
        interventionTypes: {},
        averageFrustrationLevel: 0,
        effectivenessScore: 0
      };
    }
    
    const analytics = {
      totalInterventions: log.length,
      interventionTypes: this.countInterventionTypes(log),
      averageFrustrationLevel: this.calculateAverageFrustration(log),
      interventionFrequency: this.calculateInterventionFrequency(log),
      mostCommonLevel: this.getMostCommonLevel(log)
    };
    
    return analytics;
  }

  /**
   * Helper methods
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  countInterventionTypes(log) {
    const counts = {};
    log.forEach(entry => {
      entry.interventions.forEach(intervention => {
        counts[intervention] = (counts[intervention] || 0) + 1;
      });
    });
    return counts;
  }

  calculateAverageFrustration(log) {
    const total = log.reduce((sum, entry) => sum + entry.frustrationLevel, 0);
    return total / log.length;
  }

  calculateInterventionFrequency(log) {
    if (log.length < 2) return 0;
    
    const timeSpan = log[log.length - 1].timestamp - log[0].timestamp;
    return log.length / (timeSpan / (1000 * 60)); // Interventions per minute
  }

  getMostCommonLevel(log) {
    const levels = {};
    log.forEach(entry => {
      levels[entry.interventionLevel] = (levels[entry.interventionLevel] || 0) + 1;
    });
    
    return Object.entries(levels).reduce((max, [level, count]) => 
      count > max.count ? { level, count } : max, 
      { level: 'none', count: 0 }
    ).level;
  }
}

module.exports = AntiFrustrationSystem;