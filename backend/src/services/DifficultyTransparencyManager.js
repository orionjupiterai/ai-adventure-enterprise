/**
 * Difficulty Transparency Manager
 * Manages what difficulty adjustments are visible to players
 * Balances transparency with immersion
 */

const logger = require('../utils/logger');
const { redis } = require('../config/redis');

class DifficultyTransparencyManager {
  constructor() {
    // Transparency rules for different adjustment types
    this.TRANSPARENCY_RULES = {
      // Always visible adjustments (player empowerment)
      visible: [
        'critical_hit_chance',
        'player_damage_resistance',
        'ability_cooldown_reduction',
        'health_boost',
        'grace_period'
      ],
      
      // Contextually visible (shown when appropriate)
      contextual: [
        'enemy_health_multiplier',
        'spawn_rate_multiplier',
        'checkpoint_creation',
        'hint_system'
      ],
      
      // Hidden adjustments (seamless experience)
      hidden: [
        'enemy_damage_multiplier',
        'enemy_ai_complexity',
        'enemy_weakening',
        'environmental_hazards'
      ]
    };
    
    // Player preference types
    this.TRANSPARENCY_PREFERENCES = {
      full: 'Show all difficulty adjustments',
      balanced: 'Show helpful adjustments only',
      minimal: 'Show only major changes',
      immersive: 'Hide most adjustments for immersion'
    };
    
    // Message templates for transparent adjustments
    this.TRANSPARENCY_MESSAGES = {
      difficulty_increase: {
        title: 'Challenge Increased',
        messages: [
          'You\'re doing great! The challenge has been increased to match your skill.',
          'Your mastery is evident. Enemies will now fight harder.',
          'Time for a greater challenge! Your abilities have impressed the arena.'
        ]
      },
      difficulty_decrease: {
        title: 'Assistance Activated',
        messages: [
          'Don\'t worry! You\'ve received some temporary assistance.',
          'Help is on the way! Your defenses have been bolstered.',
          'The odds have shifted in your favor for now.'
        ]
      },
      flow_optimization: {
        title: 'Balance Adjusted',
        messages: [
          'Conditions have been optimized for peak performance.',
          'The challenge has been fine-tuned to your current skill level.',
          'Arena conditions adjusted for optimal engagement.'
        ]
      },
      anti_frustration: {
        title: 'Support Activated',
        messages: [
          'Additional support systems are now active.',
          'Emergency assistance protocols engaged.',
          'You\'ve been granted special combat advantages.'
        ]
      }
    };
  }

  /**
   * Process difficulty adjustments for transparency display
   */
  async processAdjustmentTransparency(sessionId, adjustments, playerState, context) {
    try {
      const playerPreference = await this.getPlayerTransparencyPreference(sessionId);
      const visibleAdjustments = await this.filterAdjustments(
        adjustments,
        playerPreference,
        playerState,
        context
      );
      
      const notifications = await this.generateNotifications(
        visibleAdjustments,
        playerState,
        context
      );
      
      const analyticsData = await this.prepareAnalyticsData(
        adjustments,
        visibleAdjustments,
        context
      );
      
      // Store transparency log
      await this.logTransparencyDecision(sessionId, {
        allAdjustments: adjustments,
        visibleAdjustments,
        playerPreference,
        playerState: playerState.primary,
        notifications,
        timestamp: Date.now()
      });
      
      return {
        notifications,
        visibleAdjustments,
        analyticsData,
        playerCanViewDetails: playerPreference !== 'immersive'
      };
      
    } catch (error) {
      logger.error('Transparency processing error:', error);
      return {
        notifications: [],
        visibleAdjustments: {},
        analyticsData: null,
        playerCanViewDetails: true
      };
    }
  }

  /**
   * Filter adjustments based on transparency rules and player preferences
   */
  async filterAdjustments(adjustments, playerPreference, playerState, context) {
    const filtered = {
      visible: {},
      hidden: {},
      contextual: {}
    };
    
    // Separate adjustments by category
    Object.entries(adjustments.visible || {}).forEach(([key, value]) => {
      if (this.TRANSPARENCY_RULES.visible.includes(key)) {
        filtered.visible[key] = value;
      } else if (this.TRANSPARENCY_RULES.contextual.includes(key)) {
        filtered.contextual[key] = value;
      } else {
        filtered.hidden[key] = value;
      }
    });
    
    Object.entries(adjustments.hidden || {}).forEach(([key, value]) => {
      filtered.hidden[key] = value;
    });
    
    // Apply player preference filtering
    return this.applyPreferenceFiltering(filtered, playerPreference, playerState, context);
  }

  /**
   * Apply player preference filtering to adjustments
   */
  applyPreferenceFiltering(filtered, preference, playerState, context) {
    const result = {};
    
    switch (preference) {
      case 'full':
        // Show everything except AI complexity
        result.visible = { ...filtered.visible, ...filtered.contextual };
        if (filtered.hidden.enemy_health_multiplier) {
          result.visible.enemy_health_multiplier = filtered.hidden.enemy_health_multiplier;
        }
        break;
        
      case 'balanced':
        // Show visible and contextual based on situation
        result.visible = { ...filtered.visible };
        
        // Show contextual adjustments in specific situations
        if (playerState.primary === 'frustrated' && filtered.contextual.enemy_health_multiplier) {
          result.visible.enemy_health_multiplier = filtered.contextual.enemy_health_multiplier;
        }
        
        if (context.majorChange && filtered.contextual.spawn_rate_multiplier) {
          result.visible.spawn_rate_multiplier = filtered.contextual.spawn_rate_multiplier;
        }
        break;
        
      case 'minimal':
        // Only show major player benefits
        result.visible = {};
        if (filtered.visible.health_boost) {
          result.visible.health_boost = filtered.visible.health_boost;
        }
        if (filtered.visible.grace_period) {
          result.visible.grace_period = filtered.visible.grace_period;
        }
        if (filtered.visible.critical_hit_chance && 
            Math.abs(filtered.visible.critical_hit_chance - 0.1) > 0.05) {
          result.visible.critical_hit_chance = filtered.visible.critical_hit_chance;
        }
        break;
        
      case 'immersive':
        // Hide almost everything except critical interventions
        result.visible = {};
        if (playerState.primary === 'frustrated' && 
            (filtered.visible.health_boost || filtered.visible.grace_period)) {
          if (filtered.visible.health_boost) {
            result.visible.health_boost = filtered.visible.health_boost;
          }
          if (filtered.visible.grace_period) {
            result.visible.grace_period = filtered.visible.grace_period;
          }
        }
        break;
        
      default:
        result.visible = filtered.visible;
    }
    
    return result;
  }

  /**
   * Generate user-friendly notifications for visible adjustments
   */
  async generateNotifications(visibleAdjustments, playerState, context) {
    const notifications = [];
    
    if (Object.keys(visibleAdjustments.visible || {}).length === 0) {
      return notifications;
    }
    
    // Determine primary adjustment type
    const adjustmentType = this.determineAdjustmentType(visibleAdjustments, playerState);
    
    // Generate main notification
    const mainNotification = await this.createMainNotification(
      adjustmentType,
      visibleAdjustments,
      playerState
    );
    
    if (mainNotification) {
      notifications.push(mainNotification);
    }
    
    // Generate specific feature notifications
    const featureNotifications = await this.createFeatureNotifications(
      visibleAdjustments,
      playerState
    );
    
    notifications.push(...featureNotifications);
    
    return notifications;
  }

  /**
   * Determine the primary type of adjustment being made
   */
  determineAdjustmentType(adjustments, playerState) {
    const adj = adjustments.visible || {};
    
    // Check for anti-frustration adjustments
    if (playerState.primary === 'frustrated' && 
        (adj.health_boost || adj.grace_period || adj.player_damage_resistance > 1.0)) {
      return 'anti_frustration';
    }
    
    // Check for difficulty increase (boredom)
    if (playerState.primary === 'bored' && 
        (adj.critical_hit_chance > 0.12 || adj.enemy_health_multiplier > 1.1)) {
      return 'difficulty_increase';
    }
    
    // Check for difficulty decrease
    if (adj.player_damage_resistance > 1.0 || adj.enemy_health_multiplier < 1.0) {
      return 'difficulty_decrease';
    }
    
    return 'flow_optimization';
  }

  /**
   * Create main notification message
   */
  async createMainNotification(adjustmentType, adjustments, playerState) {
    const templates = this.TRANSPARENCY_MESSAGES[adjustmentType];
    if (!templates) return null;
    
    const message = templates.messages[Math.floor(Math.random() * templates.messages.length)];
    
    return {
      type: 'system',
      category: adjustmentType,
      title: templates.title,
      message,
      priority: adjustmentType === 'anti_frustration' ? 'high' : 'medium',
      duration: 5000,
      style: this.getNotificationStyle(adjustmentType)
    };
  }

  /**
   * Create specific feature notifications
   */
  async createFeatureNotifications(adjustments, playerState) {
    const notifications = [];
    const adj = adjustments.visible || {};
    
    // Health boost notification
    if (adj.health_boost && adj.health_boost > 1.0) {
      notifications.push({
        type: 'feature',
        category: 'health_boost',
        title: 'Health Enhanced',
        message: `Your maximum health has been increased by ${Math.round((adj.health_boost - 1) * 100)}%`,
        icon: '❤️',
        duration: 3000,
        style: 'positive'
      });
    }
    
    // Critical hit chance notification
    if (adj.critical_hit_chance && Math.abs(adj.critical_hit_chance - 0.1) > 0.02) {
      const percentage = Math.round(adj.critical_hit_chance * 100);
      notifications.push({
        type: 'feature',
        category: 'critical_hits',
        title: 'Critical Strike Enhanced',
        message: `Critical hit chance: ${percentage}%`,
        icon: '⚡',
        duration: 3000,
        style: 'positive'
      });
    }
    
    // Damage resistance notification
    if (adj.player_damage_resistance && adj.player_damage_resistance > 1.05) {
      const percentage = Math.round((adj.player_damage_resistance - 1) * 100);
      notifications.push({
        type: 'feature',
        category: 'defense',
        title: 'Defense Boosted',
        message: `Incoming damage reduced by ${percentage}%`,
        icon: '🛡️',
        duration: 3000,
        style: 'positive'
      });
    }
    
    // Grace period notification
    if (adj.grace_period) {
      notifications.push({
        type: 'feature',
        category: 'grace_period',
        title: 'Protection Active',
        message: 'Brief invulnerability after taking damage',
        icon: '✨',
        duration: 3000,
        style: 'protective'
      });
    }
    
    return notifications;
  }

  /**
   * Get notification style based on adjustment type
   */
  getNotificationStyle(adjustmentType) {
    switch (adjustmentType) {
      case 'anti_frustration':
        return 'supportive';
      case 'difficulty_increase':
        return 'challenge';
      case 'difficulty_decrease':
        return 'helpful';
      case 'flow_optimization':
        return 'neutral';
      default:
        return 'neutral';
    }
  }

  /**
   * Prepare analytics data for player dashboard
   */
  async prepareAnalyticsData(allAdjustments, visibleAdjustments, context) {
    return {
      session: {
        totalAdjustments: Object.keys(allAdjustments.visible || {}).length + 
                         Object.keys(allAdjustments.hidden || {}).length,
        visibleAdjustments: Object.keys(visibleAdjustments.visible || {}).length,
        adjustmentTypes: this.categorizeAdjustments(allAdjustments),
        transparencyRatio: this.calculateTransparencyRatio(allAdjustments, visibleAdjustments)
      },
      trends: await this.calculateAdjustmentTrends(context.sessionId),
      flowMetrics: context.flowMetrics || {}
    };
  }

  /**
   * Categorize adjustments for analytics
   */
  categorizeAdjustments(adjustments) {
    const categories = {
      player_buffs: 0,
      enemy_nerfs: 0,
      environmental: 0,
      ai_modifications: 0
    };
    
    const allAdj = { ...(adjustments.visible || {}), ...(adjustments.hidden || {}) };
    
    Object.keys(allAdj).forEach(key => {
      if (key.includes('player_') || key.includes('critical_hit') || key.includes('health_boost')) {
        categories.player_buffs++;
      } else if (key.includes('enemy_')) {
        categories.enemy_nerfs++;
      } else if (key.includes('spawn_') || key.includes('environmental')) {
        categories.environmental++;
      } else if (key.includes('ai_')) {
        categories.ai_modifications++;
      }
    });
    
    return categories;
  }

  /**
   * Calculate transparency ratio
   */
  calculateTransparencyRatio(allAdjustments, visibleAdjustments) {
    const totalCount = Object.keys(allAdjustments.visible || {}).length + 
                      Object.keys(allAdjustments.hidden || {}).length;
    const visibleCount = Object.keys(visibleAdjustments.visible || {}).length;
    
    return totalCount > 0 ? visibleCount / totalCount : 0;
  }

  /**
   * Get player transparency preference
   */
  async getPlayerTransparencyPreference(sessionId) {
    const prefKey = `transparency:preference:${sessionId}`;
    const preference = await redis.get(prefKey);
    
    return preference || 'balanced'; // Default to balanced
  }

  /**
   * Set player transparency preference
   */
  async setPlayerTransparencyPreference(sessionId, preference) {
    if (!Object.keys(this.TRANSPARENCY_PREFERENCES).includes(preference)) {
      throw new Error(`Invalid transparency preference: ${preference}`);
    }
    
    const prefKey = `transparency:preference:${sessionId}`;
    await redis.setex(prefKey, 86400, preference); // 24 hour cache
    
    return {
      set: true,
      preference,
      description: this.TRANSPARENCY_PREFERENCES[preference]
    };
  }

  /**
   * Generate transparency report for player
   */
  async generateTransparencyReport(sessionId, timeRange = 3600000) { // 1 hour default
    const logKey = `transparency:log:${sessionId}`;
    const log = JSON.parse(await redis.get(logKey) || '[]');
    
    const now = Date.now();
    const recentLog = log.filter(entry => now - entry.timestamp < timeRange);
    
    if (recentLog.length === 0) {
      return {
        totalSessions: 0,
        adjustmentSummary: {},
        transparencyMetrics: {},
        recommendations: []
      };
    }
    
    const report = {
      totalSessions: recentLog.length,
      adjustmentSummary: this.summarizeAdjustments(recentLog),
      transparencyMetrics: this.calculateTransparencyMetrics(recentLog),
      playerStates: this.analyzePlayerStates(recentLog),
      recommendations: this.generateTransparencyRecommendations(recentLog)
    };
    
    return report;
  }

  /**
   * Log transparency decision for analysis
   */
  async logTransparencyDecision(sessionId, logData) {
    const logKey = `transparency:log:${sessionId}`;
    const log = JSON.parse(await redis.get(logKey) || '[]');
    
    log.push(logData);
    
    // Keep only last 100 entries
    if (log.length > 100) {
      log.splice(0, log.length - 100);
    }
    
    await redis.setex(logKey, 3600, JSON.stringify(log));
  }

  /**
   * Helper methods for analytics
   */
  summarizeAdjustments(log) {
    const summary = {
      total: 0,
      visible: 0,
      byType: {},
      mostCommon: null
    };
    
    const typeCounts = {};
    
    log.forEach(entry => {
      const allAdjustments = {
        ...(entry.allAdjustments.visible || {}),
        ...(entry.allAdjustments.hidden || {})
      };
      
      summary.total += Object.keys(allAdjustments).length;
      summary.visible += Object.keys(entry.visibleAdjustments.visible || {}).length;
      
      Object.keys(allAdjustments).forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
    });
    
    summary.byType = typeCounts;
    summary.mostCommon = Object.entries(typeCounts).reduce((max, [type, count]) => 
      count > max.count ? { type, count } : max, 
      { type: null, count: 0 }
    ).type;
    
    return summary;
  }

  calculateTransparencyMetrics(log) {
    const ratios = log.map(entry => {
      const totalAdj = Object.keys(entry.allAdjustments.visible || {}).length + 
                      Object.keys(entry.allAdjustments.hidden || {}).length;
      const visibleAdj = Object.keys(entry.visibleAdjustments.visible || {}).length;
      return totalAdj > 0 ? visibleAdj / totalAdj : 0;
    });
    
    return {
      averageTransparencyRatio: ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length,
      minTransparency: Math.min(...ratios),
      maxTransparency: Math.max(...ratios),
      consistencyScore: 1 - (Math.max(...ratios) - Math.min(...ratios))
    };
  }

  analyzePlayerStates(log) {
    const states = {};
    log.forEach(entry => {
      states[entry.playerState] = (states[entry.playerState] || 0) + 1;
    });
    return states;
  }

  generateTransparencyRecommendations(log) {
    const recommendations = [];
    const metrics = this.calculateTransparencyMetrics(log);
    const states = this.analyzePlayerStates(log);
    
    if (metrics.averageTransparencyRatio < 0.3) {
      recommendations.push({
        type: 'increase_transparency',
        message: 'Consider showing more adjustments to better understand the system',
        priority: 'medium'
      });
    }
    
    if (states.frustrated > states.flow) {
      recommendations.push({
        type: 'show_support',
        message: 'Showing support features may help reduce frustration',
        priority: 'high'
      });
    }
    
    return recommendations;
  }
}

module.exports = DifficultyTransparencyManager;