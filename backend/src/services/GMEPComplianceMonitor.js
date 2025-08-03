/**
 * GMEP Compliance Monitor
 * Ensures the prestige system follows Game Monetization Ethics Principles
 */

const EventEmitter = require('events');
const { PrestigeSystem, SeasonalTrack, User } = require('../models');

class GMEPComplianceMonitor extends EventEmitter {
  constructor() {
    super();
    
    // GMEP compliance thresholds
    this.thresholds = {
      maxDailyPrestigeTime: 4 * 60 * 60 * 1000, // 4 hours max recommended daily
      maxSessionTime: 2 * 60 * 60 * 1000, // 2 hours max session recommendation
      minIntrinsicRewardRatio: 0.7, // 70% of rewards must be intrinsic
      maxDailyProgressPoints: 200, // Daily point cap
      maxConsecutiveDaysAlert: 14, // Alert after 14 consecutive days
      cooldownBetweenMajorRewards: 24 * 60 * 60 * 1000, // 24 hours between major rewards
      minimumBreakSuggestion: 30 * 60 * 1000, // Suggest 30-minute breaks
      maxSeasonalTracksActive: 3 // Maximum simultaneous tracks
    };

    // Player session tracking
    this.activeSessions = new Map();
    this.dailyActivity = new Map();
    this.rewardHistory = new Map();
    
    // Compliance metrics
    this.complianceMetrics = {
      healthyPlaySessions: 0,
      excessivePlaySessions: 0,
      intrinsicRewardRatio: 0,
      playerWellnessInterventions: 0,
      forcedBreaksSuggested: 0
    };
  }

  /**
   * Start monitoring a player session
   */
  startSession(userId, sessionData = {}) {
    const session = {
      userId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      prestigePointsEarned: 0,
      intrinsicRewardsReceived: 0,
      extrinsicRewardsReceived: 0,
      activitiesCompleted: 0,
      breaksSuggested: 0,
      complianceWarnings: []
    };

    this.activeSessions.set(userId, session);
    
    // Initialize daily tracking if needed
    if (!this.dailyActivity.has(userId)) {
      this.initializeDailyTracking(userId);
    }

    this.emit('session:started', { userId, session });
    return session;
  }

  /**
   * Update session activity
   */
  updateSessionActivity(userId, activity) {
    const session = this.activeSessions.get(userId);
    if (!session) {
      console.warn(`No active session found for user ${userId}`);
      return;
    }

    session.lastActivity = Date.now();
    session.activitiesCompleted++;

    // Check session duration
    const sessionDuration = session.lastActivity - session.startTime;
    if (sessionDuration > this.thresholds.maxSessionTime) {
      this.handleExcessiveSessionTime(userId, session);
    }

    // Suggest breaks periodically
    if (sessionDuration > this.thresholds.minimumBreakSuggestion && 
        session.breaksSuggested === 0) {
      this.suggestBreak(userId, session, 'extended_session');
    }

    this.emit('session:activity', { userId, activity, session });
  }

  /**
   * Track reward distribution for GMEP compliance
   */
  trackRewardDistribution(userId, rewards) {
    const session = this.activeSessions.get(userId);
    const daily = this.dailyActivity.get(userId);
    
    if (!session || !daily) {
      console.warn(`No session or daily tracking found for user ${userId}`);
      return;
    }

    let intrinsicValue = 0;
    let extrinsicValue = 0;

    rewards.forEach(reward => {
      if (this.isIntrinsicReward(reward)) {
        intrinsicValue += reward.value || 1;
        session.intrinsicRewardsReceived++;
        daily.intrinsicRewardsToday++;
      } else {
        extrinsicValue += reward.value || 1;
        session.extrinsicRewardsReceived++;
        daily.extrinsicRewardsToday++;
      }
    });

    // Check intrinsic reward ratio
    const totalValue = intrinsicValue + extrinsicValue;
    const intrinsicRatio = totalValue > 0 ? intrinsicValue / totalValue : 0;

    if (intrinsicRatio < this.thresholds.minIntrinsicRewardRatio) {
      this.handleIntrinsicRatioViolation(userId, session, intrinsicRatio);
    }

    // Update metrics
    this.complianceMetrics.intrinsicRewardRatio = 
      (this.complianceMetrics.intrinsicRewardRatio + intrinsicRatio) / 2;

    this.emit('rewards:tracked', {
      userId,
      intrinsicValue,
      extrinsicValue,
      intrinsicRatio,
      compliant: intrinsicRatio >= this.thresholds.minIntrinsicRewardRatio
    });
  }

  /**
   * Check if a reward is intrinsic (story, mastery, creativity, social)
   */
  isIntrinsicReward(reward) {
    const intrinsicTypes = [
      'story_arc', 'story_unlock', 'lore_discovery',
      'skill_mastery', 'ability_unlock', 'mastery_achievement',
      'creative_expression', 'customization_unlock', 'art_creation',
      'social_connection', 'mentoring_achievement', 'community_recognition',
      'exploration_discovery', 'world_discovery', 'secret_location'
    ];

    return intrinsicTypes.includes(reward.type) || 
           intrinsicTypes.includes(reward.subtype) ||
           reward.intrinsic_value > 0;
  }

  /**
   * Track prestige points earned for daily caps
   */
  trackPrestigePoints(userId, points, source) {
    const session = this.activeSessions.get(userId);
    const daily = this.dailyActivity.get(userId);

    if (session) {
      session.prestigePointsEarned += points;
    }

    if (daily) {
      daily.prestigePointsToday += points;
      
      // Check daily cap
      if (daily.prestigePointsToday >= this.thresholds.maxDailyProgressPoints) {
        this.handleDailyCap(userId, daily);
      }
    }

    this.emit('prestige:points_tracked', { userId, points, source });
  }

  /**
   * End a player session
   */
  endSession(userId) {
    const session = this.activeSessions.get(userId);
    if (!session) return null;

    const sessionDuration = Date.now() - session.startTime;
    session.endTime = Date.now();
    session.duration = sessionDuration;

    // Evaluate session health
    const isHealthySession = this.evaluateSessionHealth(session);
    
    if (isHealthySession) {
      this.complianceMetrics.healthyPlaySessions++;
    } else {
      this.complianceMetrics.excessivePlaySessions++;
    }

    // Store session data
    this.storeSessionData(userId, session);
    
    // Remove from active sessions
    this.activeSessions.delete(userId);

    this.emit('session:ended', { userId, session, isHealthy: isHealthySession });
    return session;
  }

  /**
   * Monitor consecutive play days
   */
  async checkConsecutivePlayDays(userId) {
    const daily = this.dailyActivity.get(userId);
    if (!daily) return;

    // This would typically check a database for consecutive days
    // For now, simplified implementation
    const consecutiveDays = daily.consecutiveDays || 0;

    if (consecutiveDays >= this.thresholds.maxConsecutiveDaysAlert) {
      await this.handleExcessiveConsecutiveDays(userId, consecutiveDays);
    }
  }

  /**
   * Handle excessive session time
   */
  handleExcessiveSessionTime(userId, session) {
    session.complianceWarnings.push({
      type: 'excessive_session_time',
      timestamp: Date.now(),
      duration: Date.now() - session.startTime
    });

    this.suggestBreak(userId, session, 'excessive_session');
    
    this.emit('compliance:excessive_session', {
      userId,
      duration: Date.now() - session.startTime,
      recommended: this.thresholds.maxSessionTime
    });
  }

  /**
   * Handle intrinsic reward ratio violations
   */
  handleIntrinsicRatioViolation(userId, session, ratio) {
    session.complianceWarnings.push({
      type: 'intrinsic_ratio_violation',
      timestamp: Date.now(),
      ratio,
      required: this.thresholds.minIntrinsicRewardRatio
    });

    this.emit('compliance:intrinsic_ratio_violation', {
      userId,
      currentRatio: ratio,
      requiredRatio: this.thresholds.minIntrinsicRewardRatio
    });
  }

  /**
   * Handle daily progress cap reached
   */
  handleDailyCap(userId, daily) {
    this.emit('compliance:daily_cap_reached', {
      userId,
      pointsEarned: daily.prestigePointsToday,
      cap: this.thresholds.maxDailyProgressPoints
    });

    // Send wellness message
    this.sendWellnessMessage(userId, 'daily_cap', {
      message: 'You\'ve reached today\'s recommended prestige progress. Consider taking a break and enjoying other activities!',
      suggestion: 'Try exploring the story content you\'ve unlocked or engaging with the community.'
    });
  }

  /**
   * Handle excessive consecutive play days
   */
  async handleExcessiveConsecutiveDays(userId, consecutiveDays) {
    this.complianceMetrics.playerWellnessInterventions++;

    await this.sendWellnessMessage(userId, 'consecutive_days', {
      days: consecutiveDays,
      message: `You've been playing for ${consecutiveDays} consecutive days. Consider taking a day off to recharge!`,
      suggestion: 'Taking breaks helps maintain enjoyment and prevents burnout.',
      resources: [
        'Digital wellness tips',
        'Healthy gaming habits guide'
      ]
    });

    this.emit('compliance:consecutive_days_alert', {
      userId,
      consecutiveDays,
      threshold: this.thresholds.maxConsecutiveDaysAlert
    });
  }

  /**
   * Suggest break to player
   */
  suggestBreak(userId, session, reason) {
    session.breaksSuggested++;
    this.complianceMetrics.forcedBreaksSuggested++;

    const breakSuggestion = {
      reason,
      timestamp: Date.now(),
      sessionDuration: Date.now() - session.startTime,
      message: this.getBreakMessage(reason),
      suggestion: this.getBreakSuggestion(reason)
    };

    this.emit('wellness:break_suggested', {
      userId,
      breakSuggestion
    });
  }

  /**
   * Send wellness message to player
   */
  async sendWellnessMessage(userId, type, data) {
    const message = {
      type: 'wellness',
      subtype: type,
      userId,
      timestamp: Date.now(),
      ...data
    };

    // This would typically be sent through the notification system
    this.emit('wellness:message_sent', message);
  }

  /**
   * Get break message based on reason
   */
  getBreakMessage(reason) {
    const messages = {
      extended_session: 'You\'ve been playing for a while! Consider taking a short break to rest your eyes and stretch.',
      excessive_session: 'Long gaming sessions can be tiring. Taking breaks helps maintain focus and enjoyment.',
      daily_cap: 'You\'ve made great progress today! Consider exploring other aspects of the game or taking a break.',
      wellness_check: 'Remember to stay hydrated, take breaks, and maintain a healthy balance!'
    };

    return messages[reason] || messages.wellness_check;
  }

  /**
   * Get break suggestion based on reason
   */
  getBreakSuggestion(reason) {
    const suggestions = {
      extended_session: 'Try the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.',
      excessive_session: 'Stand up, stretch, get some water, or step outside for fresh air.',
      daily_cap: 'Explore your unlocked story content, chat with the community, or plan your next adventure.',
      wellness_check: 'Take care of yourself - you\'re important!'
    };

    return suggestions[reason] || suggestions.wellness_check;
  }

  /**
   * Evaluate if a session was healthy
   */
  evaluateSessionHealth(session) {
    const healthyCriteria = {
      duration: session.duration < this.thresholds.maxSessionTime,
      intrinsicRatio: session.intrinsicRewardsReceived / 
        Math.max(1, session.intrinsicRewardsReceived + session.extrinsicRewardsReceived) >= 
        this.thresholds.minIntrinsicRewardRatio,
      noExcessiveWarnings: session.complianceWarnings.length === 0,
      breaksTaken: session.breaksSuggested <= 1
    };

    return Object.values(healthyCriteria).every(criterion => criterion);
  }

  /**
   * Initialize daily tracking for a user
   */
  initializeDailyTracking(userId) {
    const today = new Date().toDateString();
    
    this.dailyActivity.set(userId, {
      date: today,
      prestigePointsToday: 0,
      intrinsicRewardsToday: 0,
      extrinsicRewardsToday: 0,
      sessionsToday: 0,
      totalPlayTimeToday: 0,
      consecutiveDays: 0,
      lastActiveDate: today
    });
  }

  /**
   * Store session data for analytics
   */
  storeSessionData(userId, session) {
    if (!this.rewardHistory.has(userId)) {
      this.rewardHistory.set(userId, []);
    }

    const history = this.rewardHistory.get(userId);
    history.push({
      ...session,
      compliance: this.evaluateSessionHealth(session)
    });

    // Keep only last 30 sessions
    if (history.length > 30) {
      history.shift();
    }
  }

  /**
   * Get compliance report for a user
   */
  getPlayerComplianceReport(userId) {
    const session = this.activeSessions.get(userId);
    const daily = this.dailyActivity.get(userId);
    const history = this.rewardHistory.get(userId) || [];

    const recentSessions = history.slice(-7); // Last 7 sessions
    const healthySessions = recentSessions.filter(s => s.compliance).length;
    const avgSessionTime = recentSessions.reduce((sum, s) => sum + s.duration, 0) / 
      Math.max(1, recentSessions.length);

    return {
      userId,
      currentSession: session ? {
        duration: Date.now() - session.startTime,
        pointsEarned: session.prestigePointsEarned,
        warnings: session.complianceWarnings
      } : null,
      dailyActivity: daily,
      recentPerformance: {
        healthySessionPercentage: (healthySessions / Math.max(1, recentSessions.length)) * 100,
        averageSessionTime: avgSessionTime,
        totalSessions: recentSessions.length
      },
      recommendations: this.generateRecommendations(userId, session, daily, recentSessions)
    };
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(userId, session, daily, recentSessions) {
    const recommendations = [];

    // Session duration recommendations
    if (session && (Date.now() - session.startTime) > this.thresholds.maxSessionTime) {
      recommendations.push({
        type: 'break',
        priority: 'high',
        message: 'Consider taking a break - you\'ve been playing for a while!'
      });
    }

    // Daily progress recommendations
    if (daily && daily.prestigePointsToday >= this.thresholds.maxDailyProgressPoints * 0.8) {
      recommendations.push({
        type: 'daily_progress',
        priority: 'medium',
        message: 'You\'re close to today\'s recommended progress limit. Great job!'
      });
    }

    // Intrinsic content recommendations
    const recentIntrinsicRatio = this.calculateRecentIntrinsicRatio(recentSessions);
    if (recentIntrinsicRatio < this.thresholds.minIntrinsicRewardRatio) {
      recommendations.push({
        type: 'intrinsic_content',
        priority: 'medium',
        message: 'Try exploring story content or working on skill mastery for more fulfilling rewards!'
      });
    }

    return recommendations;
  }

  /**
   * Calculate recent intrinsic reward ratio
   */
  calculateRecentIntrinsicRatio(sessions) {
    if (sessions.length === 0) return 1;

    const totalIntrinsic = sessions.reduce((sum, s) => sum + s.intrinsicRewardsReceived, 0);
    const totalExtrinsic = sessions.reduce((sum, s) => sum + s.extrinsicRewardsReceived, 0);
    const total = totalIntrinsic + totalExtrinsic;

    return total > 0 ? totalIntrinsic / total : 1;
  }

  /**
   * Get system-wide compliance metrics
   */
  getSystemComplianceMetrics() {
    return {
      ...this.complianceMetrics,
      activeSessions: this.activeSessions.size,
      dailyActiveUsers: this.dailyActivity.size,
      averageSessionHealth: this.complianceMetrics.healthyPlaySessions / 
        Math.max(1, this.complianceMetrics.healthyPlaySessions + this.complianceMetrics.excessivePlaySessions),
      thresholds: this.thresholds
    };
  }

  /**
   * Reset daily tracking (called daily)
   */
  resetDailyTracking() {
    const today = new Date().toDateString();
    
    for (const [userId, daily] of this.dailyActivity.entries()) {
      if (daily.date !== today) {
        // Check if user was active yesterday for consecutive days tracking
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        if (daily.lastActiveDate === yesterday) {
          daily.consecutiveDays++;
        } else {
          daily.consecutiveDays = 0;
        }

        // Reset daily counters
        daily.date = today;
        daily.prestigePointsToday = 0;
        daily.intrinsicRewardsToday = 0;
        daily.extrinsicRewardsToday = 0;
        daily.sessionsToday = 0;
        daily.totalPlayTimeToday = 0;
      }
    }

    this.emit('daily:reset', { date: today });
  }
}

module.exports = GMEPComplianceMonitor;