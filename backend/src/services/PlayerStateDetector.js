/**
 * Player State Detection System
 * Implements detailed frustration and boredom detection
 * Based on behavioral pattern analysis
 */

const logger = require('../utils/logger');
const { redis } = require('../config/redis');

class PlayerStateDetector {
  constructor() {
    // Time windows for analysis
    this.TIME_WINDOWS = {
      short: 30000,   // 30 seconds
      medium: 120000, // 2 minutes
      long: 300000    // 5 minutes
    };
    
    // Input pattern analysis
    this.INPUT_PATTERNS = {
      normal_variance: 1.0,
      click_spam_threshold: 10, // clicks per second
      movement_jitter_threshold: 100, // pixels per second variance
      pause_duration_threshold: 5000 // ms
    };
  }

  /**
   * Get comprehensive frustration indicators
   */
  async getFrustrationIndicators(sessionId, combatData, playerMetrics) {
    const indicators = {};
    
    // Rapid retries detection
    indicators.rapidRetries = await this.detectRapidRetries(sessionId);
    
    // Death streak analysis
    indicators.deathStreak = await this.calculateDeathStreak(sessionId);
    
    // Input variance analysis
    indicators.inputVariance = await this.calculateInputVariance(sessionId);
    
    // Quick quit behavior
    indicators.quickQuitAfterDeath = await this.detectQuickQuit(sessionId);
    
    // Emotional analysis (if available)
    indicators.emotionalScore = await this.analyzeEmotionalState(sessionId);
    
    // Action regression (using simpler strategies when frustrated)
    indicators.actionRegression = await this.detectActionRegression(sessionId);
    
    // Help-seeking behavior
    indicators.helpSeeking = await this.detectHelpSeeking(sessionId);
    
    // Performance degradation
    indicators.performanceDrop = await this.calculatePerformanceDrop(sessionId);
    
    return indicators;
  }

  /**
   * Get comprehensive boredom indicators
   */
  async getBoredomIndicators(sessionId, combatData, playerMetrics) {
    const indicators = {};
    
    // Perfect execution streak
    indicators.perfectStreak = await this.calculatePerfectStreak(sessionId);
    
    // Speed completion analysis
    indicators.completionSpeed = await this.calculateCompletionSpeed(sessionId);
    
    // Engagement score
    indicators.engagementScore = await this.calculateEngagementScore(sessionId);
    
    // Repetitive action detection
    indicators.repetitiveActions = await this.detectRepetitiveActions(sessionId);
    
    // Inactivity periods
    indicators.inactivityTime = await this.calculateInactivityTime(sessionId);
    
    // Exploration behavior decline
    indicators.explorationDecline = await this.detectExplorationDecline(sessionId);
    
    // Risk-taking behavior increase
    indicators.riskTaking = await this.analyzeRiskTaking(sessionId);
    
    // Attention drift indicators
    indicators.attentionDrift = await this.detectAttentionDrift(sessionId);
    
    return indicators;
  }

  /**
   * Detect rapid retry patterns
   */
  async detectRapidRetries(sessionId) {
    const actionKey = `dda:actions:${sessionId}`;
    const actions = JSON.parse(await redis.get(actionKey) || '[]');
    
    const now = Date.now();
    const shortWindow = actions.filter(action => 
      now - action.timestamp < this.TIME_WINDOWS.short &&
      action.type === 'retry'
    );
    
    return shortWindow.length;
  }

  /**
   * Calculate consecutive death streak
   */
  async calculateDeathStreak(sessionId) {
    const combatKey = `dda:combat:${sessionId}`;
    const combatHistory = JSON.parse(await redis.get(combatKey) || '[]');
    
    let streak = 0;
    for (let i = combatHistory.length - 1; i >= 0; i--) {
      if (combatHistory[i].result === 'death') {
        streak++;
      } else if (combatHistory[i].result === 'victory') {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Calculate input variance for erratic behavior detection
   */
  async calculateInputVariance(sessionId) {
    const inputKey = `dda:inputs:${sessionId}`;
    const inputs = JSON.parse(await redis.get(inputKey) || '[]');
    
    if (inputs.length < 10) return 1.0; // Not enough data
    
    const now = Date.now();
    const recentInputs = inputs.filter(input => 
      now - input.timestamp < this.TIME_WINDOWS.short
    );
    
    if (recentInputs.length < 5) return 1.0;
    
    // Calculate timing variance
    const intervals = [];
    for (let i = 1; i < recentInputs.length; i++) {
      intervals.push(recentInputs[i].timestamp - recentInputs[i-1].timestamp);
    }
    
    const meanInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - meanInterval, 2), 0) / intervals.length;
    
    // Calculate click frequency variance
    const clickFrequency = recentInputs.filter(input => input.type === 'click').length / (this.TIME_WINDOWS.short / 1000);
    const spamScore = Math.max(0, (clickFrequency - this.INPUT_PATTERNS.click_spam_threshold) / this.INPUT_PATTERNS.click_spam_threshold);
    
    // Calculate movement variance
    const movements = recentInputs.filter(input => input.type === 'movement' && input.data);
    let movementVariance = 1.0;
    if (movements.length > 3) {
      const distances = movements.map(m => Math.sqrt(Math.pow(m.data.deltaX || 0, 2) + Math.pow(m.data.deltaY || 0, 2)));
      const meanDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
      movementVariance = distances.reduce((sum, d) => sum + Math.pow(d - meanDistance, 2), 0) / distances.length;
    }
    
    return Math.sqrt(variance) / meanInterval + spamScore + (movementVariance / 100);
  }

  /**
   * Detect quick quit after death behavior
   */
  async detectQuickQuit(sessionId) {
    const actionKey = `dda:actions:${sessionId}`;
    const actions = JSON.parse(await redis.get(actionKey) || '[]');
    
    // Look for quit/leave actions within 10 seconds of death
    for (let i = actions.length - 1; i >= 0; i--) {
      if (actions[i].type === 'quit' || actions[i].type === 'leave') {
        // Find most recent death before this quit
        for (let j = i - 1; j >= 0; j--) {
          if (actions[j].type === 'death') {
            const timeDiff = actions[i].timestamp - actions[j].timestamp;
            if (timeDiff < 10000) { // 10 seconds
              return true;
            }
            break;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Analyze emotional state using various behavioral cues
   */
  async analyzeEmotionalState(sessionId) {
    // This would integrate with emotion detection systems
    // For now, we'll use behavioral proxies
    
    const frustrationIndicators = [
      await this.detectRapidRetries(sessionId),
      await this.calculateDeathStreak(sessionId),
      await this.calculateInputVariance(sessionId)
    ];
    
    // Simple emotional score based on frustration indicators
    let emotionalScore = 0;
    
    if (frustrationIndicators[0] > 3) emotionalScore -= 0.3; // rapid retries
    if (frustrationIndicators[1] > 2) emotionalScore -= 0.4; // death streak
    if (frustrationIndicators[2] > 2) emotionalScore -= 0.3; // erratic inputs
    
    return Math.max(-1, emotionalScore);
  }

  /**
   * Detect action regression (reverting to simpler strategies)
   */
  async detectActionRegression(sessionId) {
    const actionKey = `dda:actions:${sessionId}`;
    const actions = JSON.parse(await redis.get(actionKey) || '[]');
    
    const now = Date.now();
    const recentActions = actions.filter(action => 
      now - action.timestamp < this.TIME_WINDOWS.medium
    );
    
    const earlierActions = actions.filter(action => 
      now - action.timestamp >= this.TIME_WINDOWS.medium &&
      now - action.timestamp < this.TIME_WINDOWS.long
    );
    
    if (recentActions.length < 10 || earlierActions.length < 10) return 0;
    
    // Calculate complexity scores
    const recentComplexity = this.calculateActionComplexity(recentActions);
    const earlierComplexity = this.calculateActionComplexity(earlierActions);
    
    return Math.max(0, earlierComplexity - recentComplexity);
  }

  /**
   * Calculate perfect execution streak
   */
  async calculatePerfectStreak(sessionId) {
    const combatKey = `dda:combat:${sessionId}`;
    const combatHistory = JSON.parse(await redis.get(combatKey) || '[]');
    
    let streak = 0;
    for (let i = combatHistory.length - 1; i >= 0; i--) {
      const combat = combatHistory[i];
      if (combat.result === 'victory' && 
          combat.healthLost === 0 && 
          combat.timeToComplete < combat.averageTime * 0.8) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Calculate completion speed relative to average
   */
  async calculateCompletionSpeed(sessionId) {
    const combatKey = `dda:combat:${sessionId}`;
    const combatHistory = JSON.parse(await redis.get(combatKey) || '[]');
    
    if (combatHistory.length < 5) return 1.0;
    
    const recentCombats = combatHistory.slice(-5);
    const allCombats = combatHistory.slice(0, -5);
    
    if (allCombats.length === 0) return 1.0;
    
    const recentAverage = recentCombats.reduce((sum, combat) => sum + combat.timeToComplete, 0) / recentCombats.length;
    const historicalAverage = allCombats.reduce((sum, combat) => sum + combat.timeToComplete, 0) / allCombats.length;
    
    return recentAverage / historicalAverage;
  }

  /**
   * Calculate engagement score based on interaction patterns
   */
  async calculateEngagementScore(sessionId) {
    const inputKey = `dda:inputs:${sessionId}`;
    const inputs = JSON.parse(await redis.get(inputKey) || '[]');
    
    const now = Date.now();
    const recentInputs = inputs.filter(input => 
      now - input.timestamp < this.TIME_WINDOWS.medium
    );
    
    if (recentInputs.length === 0) return 0;
    
    // Input frequency
    const inputFrequency = recentInputs.length / (this.TIME_WINDOWS.medium / 1000);
    const normalizedFrequency = Math.min(1, inputFrequency / 5); // 5 inputs per second as max
    
    // Input variety
    const inputTypes = new Set(recentInputs.map(input => input.type));
    const varietyScore = Math.min(1, inputTypes.size / 6); // Assuming 6 different input types
    
    // Response time consistency
    const responseTimes = recentInputs
      .filter(input => input.responseTime)
      .map(input => input.responseTime);
    
    let consistencyScore = 1.0;
    if (responseTimes.length > 3) {
      const variance = this.calculateVariance(responseTimes);
      const mean = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      consistencyScore = Math.max(0, 1 - (variance / (mean * mean)));
    }
    
    return (normalizedFrequency * 0.4 + varietyScore * 0.3 + consistencyScore * 0.3);
  }

  /**
   * Detect repetitive action patterns
   */
  async detectRepetitiveActions(sessionId) {
    const actionKey = `dda:actions:${sessionId}`;
    const actions = JSON.parse(await redis.get(actionKey) || '[]');
    
    const now = Date.now();
    const recentActions = actions.filter(action => 
      now - action.timestamp < this.TIME_WINDOWS.short
    );
    
    if (recentActions.length < 5) return 0;
    
    // Count consecutive identical actions
    let maxRepetition = 0;
    let currentRepetition = 1;
    
    for (let i = 1; i < recentActions.length; i++) {
      if (recentActions[i].type === recentActions[i-1].type &&
          recentActions[i].target === recentActions[i-1].target) {
        currentRepetition++;
      } else {
        maxRepetition = Math.max(maxRepetition, currentRepetition);
        currentRepetition = 1;
      }
    }
    
    return Math.max(maxRepetition, currentRepetition);
  }

  /**
   * Calculate total inactivity time
   */
  async calculateInactivityTime(sessionId) {
    const inputKey = `dda:inputs:${sessionId}`;
    const inputs = JSON.parse(await redis.get(inputKey) || '[]');
    
    if (inputs.length < 2) return 0;
    
    const now = Date.now();
    const recentInputs = inputs.filter(input => 
      now - input.timestamp < this.TIME_WINDOWS.medium
    );
    
    let totalInactiveTime = 0;
    for (let i = 1; i < recentInputs.length; i++) {
      const gap = recentInputs[i].timestamp - recentInputs[i-1].timestamp;
      if (gap > 5000) { // 5 second gap considered inactive
        totalInactiveTime += gap;
      }
    }
    
    return totalInactiveTime;
  }

  /**
   * Detect decline in exploration behavior
   */
  async detectExplorationDecline(sessionId) {
    const actionKey = `dda:actions:${sessionId}`;
    const actions = JSON.parse(await redis.get(actionKey) || '[]');
    
    const now = Date.now();
    const recentActions = actions.filter(action => 
      now - action.timestamp < this.TIME_WINDOWS.medium &&
      action.type === 'explore'
    );
    
    const earlierActions = actions.filter(action => 
      now - action.timestamp >= this.TIME_WINDOWS.medium &&
      now - action.timestamp < this.TIME_WINDOWS.long &&
      action.type === 'explore'
    );
    
    if (earlierActions.length === 0) return 0;
    
    const recentRate = recentActions.length / (this.TIME_WINDOWS.medium / 1000);
    const earlierRate = earlierActions.length / (this.TIME_WINDOWS.medium / 1000);
    
    return Math.max(0, (earlierRate - recentRate) / earlierRate);
  }

  /**
   * Analyze risk-taking behavior
   */
  async analyzeRiskTaking(sessionId) {
    const actionKey = `dda:actions:${sessionId}`;
    const actions = JSON.parse(await redis.get(actionKey) || '[]');
    
    const now = Date.now();
    const recentActions = actions.filter(action => 
      now - action.timestamp < this.TIME_WINDOWS.medium
    );
    
    if (recentActions.length < 10) return 0;
    
    const riskySactions = recentActions.filter(action => 
      action.type === 'aggressive_attack' || 
      action.type === 'risky_maneuver' ||
      action.type === 'ignore_defense' ||
      (action.risk_level && action.risk_level > 0.7)
    );
    
    return riskySactions.length / recentActions.length;
  }

  /**
   * Detect attention drift indicators
   */
  async detectAttentionDrift(sessionId) {
    const inputKey = `dda:inputs:${sessionId}`;
    const inputs = JSON.parse(await redis.get(inputKey) || '[]');
    
    const now = Date.now();
    const recentInputs = inputs.filter(input => 
      now - input.timestamp < this.TIME_WINDOWS.medium
    );
    
    if (recentInputs.length < 10) return 0;
    
    // Calculate response time degradation
    const firstHalf = recentInputs.slice(0, Math.floor(recentInputs.length / 2));
    const secondHalf = recentInputs.slice(Math.floor(recentInputs.length / 2));
    
    const firstHalfAvgResponse = firstHalf
      .filter(input => input.responseTime)
      .reduce((sum, input) => sum + input.responseTime, 0) / 
      Math.max(firstHalf.filter(input => input.responseTime).length, 1);
    
    const secondHalfAvgResponse = secondHalf
      .filter(input => input.responseTime)
      .reduce((sum, input) => sum + input.responseTime, 0) / 
      Math.max(secondHalf.filter(input => input.responseTime).length, 1);
    
    const degradation = (secondHalfAvgResponse - firstHalfAvgResponse) / firstHalfAvgResponse;
    
    // Calculate input frequency decline
    const firstHalfFreq = firstHalf.length / (this.TIME_WINDOWS.medium / 2 / 1000);
    const secondHalfFreq = secondHalf.length / (this.TIME_WINDOWS.medium / 2 / 1000);
    const frequencyDecline = Math.max(0, (firstHalfFreq - secondHalfFreq) / firstHalfFreq);
    
    return Math.min(1.0, (degradation * 0.6 + frequencyDecline * 0.4));
  }

  /**
   * Detect help-seeking behavior
   */
  async detectHelpSeeking(sessionId) {
    const actionKey = `dda:actions:${sessionId}`;
    const actions = JSON.parse(await redis.get(actionKey) || '[]');
    
    const now = Date.now();
    const recentActions = actions.filter(action => 
      now - action.timestamp < this.TIME_WINDOWS.short
    );
    
    const helpSeekingActions = recentActions.filter(action => 
      action.type === 'check_hints' ||
      action.type === 'pause_game' ||
      action.type === 'open_menu' ||
      action.type === 'view_tutorial' ||
      action.type === 'request_help'
    );
    
    return helpSeekingActions.length;
  }

  /**
   * Calculate performance drop
   */
  async calculatePerformanceDrop(sessionId) {
    const combatKey = `dda:combat:${sessionId}`;
    const combatHistory = JSON.parse(await redis.get(combatKey) || '[]');
    
    if (combatHistory.length < 10) return 0;
    
    const recentCombats = combatHistory.slice(-5);
    const earlierCombats = combatHistory.slice(-15, -5);
    
    if (earlierCombats.length === 0) return 0;
    
    // Calculate success rate change
    const recentSuccessRate = recentCombats.filter(c => c.result === 'victory').length / recentCombats.length;
    const earlierSuccessRate = earlierCombats.filter(c => c.result === 'victory').length / earlierCombats.length;
    
    // Calculate average time change
    const recentAvgTime = recentCombats.reduce((sum, c) => sum + (c.timeToComplete || 0), 0) / recentCombats.length;
    const earlierAvgTime = earlierCombats.reduce((sum, c) => sum + (c.timeToComplete || 0), 0) / earlierCombats.length;
    
    const successRateDrop = Math.max(0, earlierSuccessRate - recentSuccessRate);
    const timeIncrease = earlierAvgTime > 0 ? Math.max(0, (recentAvgTime - earlierAvgTime) / earlierAvgTime) : 0;
    
    return Math.min(1.0, (successRateDrop * 0.7 + timeIncrease * 0.3));
  }

  /**
   * Helper methods
   */
  calculateActionComplexity(actions) {
    const complexityScores = {
      'basic_attack': 1,
      'combo_attack': 3,
      'special_ability': 4,
      'dodge': 2,
      'block': 2,
      'strategic_move': 5
    };
    
    if (actions.length === 0) return 0;
    
    const totalComplexity = actions.reduce((sum, action) => {
      return sum + (complexityScores[action.type] || 1);
    }, 0);
    
    return totalComplexity / actions.length;
  }

  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  }

  /**
   * Store player action for analysis
   */
  async recordPlayerAction(sessionId, actionData) {
    const actionKey = `dda:actions:${sessionId}`;
    const actions = JSON.parse(await redis.get(actionKey) || '[]');
    
    actions.push({
      ...actionData,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 actions
    if (actions.length > 1000) {
      actions.splice(0, actions.length - 1000);
    }
    
    await redis.setex(actionKey, 3600, JSON.stringify(actions));
  }

  /**
   * Store input event for analysis
   */
  async recordInputEvent(sessionId, inputData) {
    const inputKey = `dda:inputs:${sessionId}`;
    const inputs = JSON.parse(await redis.get(inputKey) || '[]');
    
    inputs.push({
      ...inputData,
      timestamp: Date.now()
    });
    
    // Keep only last 2000 inputs
    if (inputs.length > 2000) {
      inputs.splice(0, inputs.length - 2000);
    }
    
    await redis.setex(inputKey, 3600, JSON.stringify(inputs));
  }

  /**
   * Store combat result for analysis
   */
  async recordCombatResult(sessionId, combatData) {
    const combatKey = `dda:combat:${sessionId}`;
    const combats = JSON.parse(await redis.get(combatKey) || '[]');
    
    combats.push({
      ...combatData,
      timestamp: Date.now()
    });
    
    // Keep only last 100 combat results
    if (combats.length > 100) {
      combats.splice(0, combats.length - 100);
    }
    
    await redis.setex(combatKey, 3600, JSON.stringify(combats));
  }
}

module.exports = PlayerStateDetector;