/**
 * Combat Difficulty Controller
 * Applies DDA adjustments to actual combat mechanics
 * Manages enemy AI, stats, and combat parameters
 */

const logger = require('../utils/logger');
const { redis } = require('../config/redis');

class CombatDifficultyController {
  constructor() {
    // Enemy AI complexity levels
    this.AI_BEHAVIORS = {
      0.5: 'passive',     // Basic attacks, predictable patterns
      0.7: 'defensive',   // Some blocking, basic combos
      1.0: 'balanced',    // Standard AI behavior
      1.3: 'aggressive', // More frequent attacks, combos
      1.6: 'tactical',   // Uses environment, advanced combos
      2.0: 'expert'      // Perfect timing, all abilities
    };
    
    // Combat modifier templates
    this.COMBAT_TEMPLATES = {
      frustration_relief: {
        enemy_health_multiplier: 0.8,
        enemy_damage_multiplier: 0.7,
        player_damage_resistance: 1.2,
        critical_hit_chance: 0.15,
        spawn_rate_multiplier: 0.8,
        grace_period_ms: 3000
      },
      boredom_challenge: {
        enemy_health_multiplier: 1.3,
        enemy_damage_multiplier: 1.2,
        spawn_rate_multiplier: 1.4,
        enemy_ai_complexity: 1.5,
        environmental_hazards: true,
        boss_encounter_chance: 0.3
      },
      flow_optimal: {
        enemy_health_multiplier: 1.0,
        enemy_damage_multiplier: 1.0,
        player_damage_resistance: 1.0,
        spawn_rate_multiplier: 1.0,
        enemy_ai_complexity: 1.0,
        critical_hit_chance: 0.1
      }
    };
  }

  /**
   * Apply difficulty adjustments to combat encounter
   */
  async applyCombatDifficulty(sessionId, encounterData, difficultySettings) {
    try {
      const modifiedEncounter = { ...encounterData };
      
      // Apply enemy modifications
      modifiedEncounter.enemies = await this.modifyEnemies(
        encounterData.enemies, 
        difficultySettings
      );
      
      // Apply environmental modifications
      modifiedEncounter.environment = await this.modifyEnvironment(
        encounterData.environment, 
        difficultySettings
      );
      
      // Apply player modifications
      modifiedEncounter.playerModifiers = await this.calculatePlayerModifiers(
        difficultySettings
      );
      
      // Apply spawn rate modifications
      modifiedEncounter.spawnParameters = await this.modifySpawnParameters(
        encounterData.spawnParameters, 
        difficultySettings
      );
      
      // Store encounter modifications for tracking
      await this.storeCombatModifications(sessionId, {
        original: encounterData,
        modified: modifiedEncounter,
        difficulty: difficultySettings,
        timestamp: Date.now()
      });
      
      return modifiedEncounter;
      
    } catch (error) {
      logger.error('Combat difficulty application error:', error);
      return encounterData; // Return original on error
    }
  }

  /**
   * Modify enemy properties based on difficulty settings
   */
  async modifyEnemies(enemies, difficulty) {
    return enemies.map(enemy => {
      const modifiedEnemy = { ...enemy };
      
      // Health modification
      if (difficulty.enemy_health_multiplier !== undefined) {
        modifiedEnemy.maxHealth = Math.round(
          enemy.maxHealth * difficulty.enemy_health_multiplier
        );
        modifiedEnemy.currentHealth = modifiedEnemy.maxHealth;
      }
      
      // Damage modification
      if (difficulty.enemy_damage_multiplier !== undefined) {
        modifiedEnemy.damage = Math.round(
          enemy.damage * difficulty.enemy_damage_multiplier
        );
      }
      
      // AI complexity modification
      if (difficulty.enemy_ai_complexity !== undefined) {
        modifiedEnemy.aiLevel = this.getAIBehavior(difficulty.enemy_ai_complexity);
        modifiedEnemy.aiParameters = this.calculateAIParameters(
          difficulty.enemy_ai_complexity,
          enemy.type
        );
      }
      
      // Special abilities based on difficulty
      modifiedEnemy.abilities = this.modifyEnemyAbilities(
        enemy.abilities || [],
        difficulty
      );
      
      return modifiedEnemy;
    });
  }

  /**
   * Get AI behavior type based on complexity level
   */
  getAIBehavior(complexity) {
    const levels = Object.keys(this.AI_BEHAVIORS).map(Number).sort((a, b) => a - b);
    
    for (let i = levels.length - 1; i >= 0; i--) {
      if (complexity >= levels[i]) {
        return this.AI_BEHAVIORS[levels[i]];
      }
    }
    
    return this.AI_BEHAVIORS[levels[0]];
  }

  /**
   * Calculate AI parameters based on complexity
   */
  calculateAIParameters(complexity, enemyType) {
    const baseParams = {
      attackFrequency: 1.0,
      dodgeChance: 0.1,
      blockChance: 0.1,
      comboChance: 0.2,
      specialAbilityChance: 0.1,
      reactionTime: 500,
      predictionAccuracy: 0.3
    };
    
    // Scale parameters based on complexity
    const scaledParams = {
      attackFrequency: baseParams.attackFrequency * Math.min(complexity, 2.0),
      dodgeChance: Math.min(baseParams.dodgeChance * complexity, 0.8),
      blockChance: Math.min(baseParams.blockChance * complexity, 0.7),
      comboChance: Math.min(baseParams.comboChance * complexity, 0.9),
      specialAbilityChance: Math.min(baseParams.specialAbilityChance * complexity, 0.6),
      reactionTime: Math.max(baseParams.reactionTime / complexity, 100),
      predictionAccuracy: Math.min(baseParams.predictionAccuracy * complexity, 0.9)
    };
    
    // Enemy type specific adjustments
    if (enemyType === 'boss') {
      scaledParams.specialAbilityChance *= 1.5;
      scaledParams.comboChance *= 1.3;
    } else if (enemyType === 'minion') {
      scaledParams.attackFrequency *= 0.8;
      scaledParams.specialAbilityChance *= 0.5;
    }
    
    return scaledParams;
  }

  /**
   * Modify enemy abilities based on difficulty
   */
  modifyEnemyAbilities(abilities, difficulty) {
    const modifiedAbilities = [...abilities];
    
    // Add abilities based on AI complexity
    if (difficulty.enemy_ai_complexity > 1.5) {
      // Add advanced abilities for high complexity
      if (!abilities.find(a => a.type === 'combo_attack')) {
        modifiedAbilities.push({
          type: 'combo_attack',
          damage: 1.5,
          cooldown: 8000,
          chance: 0.3
        });
      }
      
      if (!abilities.find(a => a.type === 'defensive_stance')) {
        modifiedAbilities.push({
          type: 'defensive_stance',
          damageReduction: 0.5,
          duration: 3000,
          cooldown: 15000,
          chance: 0.2
        });
      }
    }
    
    // Modify existing abilities
    return modifiedAbilities.map(ability => {
      const modified = { ...ability };
      
      if (difficulty.enemy_damage_multiplier !== undefined) {
        modified.damage = (modified.damage || 1) * difficulty.enemy_damage_multiplier;
      }
      
      // Adjust cooldowns based on complexity
      if (difficulty.enemy_ai_complexity !== undefined) {
        modified.cooldown = Math.round(
          (modified.cooldown || 5000) / Math.min(difficulty.enemy_ai_complexity, 1.5)
        );
      }
      
      return modified;
    });
  }

  /**
   * Modify environment based on difficulty
   */
  async modifyEnvironment(environment, difficulty) {
    const modifiedEnvironment = { ...environment };
    
    // Environmental hazards
    if (difficulty.environmental_hazards) {
      modifiedEnvironment.hazards = [
        ...(environment.hazards || []),
        {
          type: 'dynamic_obstacle',
          frequency: 0.3,
          damage: 15
        }
      ];
    }
    
    // Terrain advantages/disadvantages
    if (difficulty.enemy_ai_complexity > 1.3) {
      modifiedEnvironment.aiAdvantages = {
        useHighGround: true,
        useChokePints: true,
        coordinateAttacks: true
      };
    }
    
    // Cover and obstacles
    if (difficulty.spawn_rate_multiplier > 1.2) {
      modifiedEnvironment.cover = {
        density: 0.3,
        destructible: true
      };
    }
    
    return modifiedEnvironment;
  }

  /**
   * Calculate player modifier effects
   */
  async calculatePlayerModifiers(difficulty) {
    const modifiers = {
      damageResistance: difficulty.player_damage_resistance || 1.0,
      criticalHitChance: difficulty.critical_hit_chance || 0.1,
      movementSpeed: 1.0,
      attackSpeed: 1.0,
      manaRegeneration: 1.0
    };
    
    // Apply anti-frustration modifiers
    if (difficulty.grace_period_ms) {
      modifiers.gracePeriod = difficulty.grace_period_ms;
    }
    
    if (difficulty.health_boost_active) {
      modifiers.healthBoost = difficulty.health_boost_multiplier || 1.2;
    }
    
    // Apply flow-enhancing modifiers
    if (difficulty.flow_enhancers) {
      modifiers.abilityCooldowReduction = 0.9;
      modifiers.accuracyBonus = 1.1;
    }
    
    return modifiers;
  }

  /**
   * Modify spawn parameters
   */
  async modifySpawnParameters(spawnParams, difficulty) {
    const modified = { ...spawnParams };
    
    if (difficulty.spawn_rate_multiplier !== undefined) {
      modified.spawnRate = (spawnParams.spawnRate || 1.0) * difficulty.spawn_rate_multiplier;
      modified.maxConcurrentEnemies = Math.round(
        (spawnParams.maxConcurrentEnemies || 3) * Math.min(difficulty.spawn_rate_multiplier, 1.5)
      );
    }
    
    // Boss encounter chance modification
    if (difficulty.boss_encounter_chance !== undefined) {
      modified.bossChance = difficulty.boss_encounter_chance;
    }
    
    // Wave intensity scaling
    if (difficulty.enemy_ai_complexity > 1.4) {
      modified.waveIntensityScale = 1.2;
    }
    
    return modified;
  }

  /**
   * Apply real-time combat adjustments during encounter
   */
  async applyRealTimeCombatAdjustments(sessionId, combatState, playerPerformance) {
    const currentDifficulty = await this.getCurrentCombatDifficulty(sessionId);
    const adjustments = {};
    
    // Emergency difficulty reduction
    if (playerPerformance.consecutiveDeaths >= 3) {
      adjustments.emergencyReduction = {
        enemy_damage_multiplier: 0.7,
        player_damage_resistance: 1.3,
        grace_period_ms: 5000
      };
    }
    
    // Dynamic spawn rate adjustment
    if (playerPerformance.avgTimePerKill > playerPerformance.expectedTimePerKill * 1.5) {
      adjustments.spawnRateReduction = {
        spawn_rate_multiplier: Math.max(currentDifficulty.spawn_rate_multiplier * 0.8, 0.5)
      };
    }
    
    // Performance-based AI scaling
    if (playerPerformance.accuracy < 0.3) {
      adjustments.aiReduction = {
        enemy_ai_complexity: Math.max(currentDifficulty.enemy_ai_complexity * 0.9, 0.5)
      };
    }
    
    return adjustments;
  }

  /**
   * Calculate adaptive combat difficulty template
   */
  async calculateAdaptiveCombatTemplate(sessionId, playerState, flowMetrics) {
    let template = { ...this.COMBAT_TEMPLATES.flow_optimal };
    
    if (playerState.primary === 'frustrated') {
      template = {
        ...template,
        ...this.COMBAT_TEMPLATES.frustration_relief
      };
      
      // Additional frustration relief based on severity
      if (playerState.frustrationScore > 0.8) {
        template.enemy_health_multiplier *= 0.8;
        template.grace_period_ms = 5000;
        template.hint_system_active = true;
      }
      
    } else if (playerState.primary === 'bored') {
      template = {
        ...template,
        ...this.COMBAT_TEMPLATES.boredom_challenge
      };
      
      // Additional challenge based on boredom severity
      if (playerState.boredomScore > 0.8) {
        template.enemy_ai_complexity = 1.8;
        template.environmental_hazards = true;
        template.dynamic_objectives = true;
      }
    }
    
    // Fine-tune based on flow metrics
    if (flowMetrics.successRate < 0.6) {
      // Too difficult
      template.enemy_health_multiplier = Math.min(template.enemy_health_multiplier * 0.9, 0.6);
      template.player_damage_resistance = Math.min(template.player_damage_resistance * 1.1, 1.3);
    } else if (flowMetrics.successRate > 0.8) {
      // Too easy
      template.enemy_health_multiplier = Math.min(template.enemy_health_multiplier * 1.1, 2.0);
      template.enemy_ai_complexity = Math.min(template.enemy_ai_complexity * 1.1, 2.0);
    }
    
    return template;
  }

  /**
   * Get current combat difficulty for session
   */
  async getCurrentCombatDifficulty(sessionId) {
    const difficultyKey = `dda:combat_difficulty:${sessionId}`;
    const cached = await redis.get(difficultyKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return this.COMBAT_TEMPLATES.flow_optimal;
  }

  /**
   * Store combat modifications for tracking
   */
  async storeCombatModifications(sessionId, modificationData) {
    const modKey = `dda:combat_modifications:${sessionId}`;
    const modifications = JSON.parse(await redis.get(modKey) || '[]');
    
    modifications.push(modificationData);
    
    // Keep only last 50 modifications
    if (modifications.length > 50) {
      modifications.splice(0, modifications.length - 50);
    }
    
    await redis.setex(modKey, 3600, JSON.stringify(modifications));
  }

  /**
   * Generate combat analytics for transparency
   */
  async generateCombatAnalytics(sessionId) {
    const modKey = `dda:combat_modifications:${sessionId}`;
    const modifications = JSON.parse(await redis.get(modKey) || '[]');
    
    if (modifications.length === 0) {
      return {
        totalEncounters: 0,
        averageDifficulty: 1.0,
        adjustmentHistory: [],
        performanceTrends: {}
      };
    }
    
    const analytics = {
      totalEncounters: modifications.length,
      averageDifficulty: this.calculateAverageDifficulty(modifications),
      adjustmentHistory: this.summarizeAdjustmentHistory(modifications),
      performanceTrends: this.calculatePerformanceTrends(modifications),
      flowStateTime: this.calculateFlowStateTime(modifications)
    };
    
    return analytics;
  }

  /**
   * Helper methods for analytics
   */
  calculateAverageDifficulty(modifications) {
    const difficulties = modifications.map(mod => {
      const diff = mod.difficulty;
      return (
        (diff.enemy_health_multiplier || 1) +
        (diff.enemy_damage_multiplier || 1) +
        (diff.enemy_ai_complexity || 1)
      ) / 3;
    });
    
    return difficulties.reduce((sum, diff) => sum + diff, 0) / difficulties.length;
  }

  summarizeAdjustmentHistory(modifications) {
    return modifications.slice(-10).map(mod => ({
      timestamp: mod.timestamp,
      reason: this.determineAdjustmentReason(mod.difficulty),
      magnitude: this.calculateAdjustmentMagnitude(mod.difficulty)
    }));
  }

  determineAdjustmentReason(difficulty) {
    if (difficulty.enemy_health_multiplier < 1.0 || difficulty.player_damage_resistance > 1.0) {
      return 'frustration_relief';
    } else if (difficulty.enemy_ai_complexity > 1.3 || difficulty.spawn_rate_multiplier > 1.2) {
      return 'boredom_challenge';
    } else {
      return 'flow_optimization';
    }
  }

  calculateAdjustmentMagnitude(difficulty) {
    const deviations = [
      Math.abs((difficulty.enemy_health_multiplier || 1) - 1),
      Math.abs((difficulty.enemy_damage_multiplier || 1) - 1),
      Math.abs((difficulty.enemy_ai_complexity || 1) - 1),
      Math.abs((difficulty.spawn_rate_multiplier || 1) - 1)
    ];
    
    return deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
  }
}

module.exports = CombatDifficultyController;