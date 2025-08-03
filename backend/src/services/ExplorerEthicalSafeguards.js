/**
 * Explorer Ethical Safeguards System
 * Protects Explorer archetype players from unhealthy completionism and addiction patterns
 * Promotes healthy exploration habits while maintaining engagement
 */

const logger = require('../utils/logger');
const { redis } = require('../config/redis');

class ExplorerEthicalSafeguards {
  constructor() {
    // Addiction pattern detection thresholds
    this.ADDICTION_PATTERNS = {
      completionism_obsession: {
        detection_threshold: 0.85,     // 85% obsession with completing everything
        warning_threshold: 0.70,       // 70% warning level
        intervention_threshold: 0.90,  // 90% immediate intervention
        monitoring_indicators: [
          'completion_anxiety',
          'fear_of_missing_out',
          'excessive_checking_behavior',
          'inability_to_enjoy_partial_completion',
          'distress_when_content_unavailable'
        ]
      },
      exploration_compulsion: {
        detection_threshold: 0.80,
        warning_threshold: 0.65,
        intervention_threshold: 0.85,
        monitoring_indicators: [
          'inability_to_stop_exploring',
          'neglecting_other_game_aspects',
          'repetitive_checking_for_secrets',
          'anxiety_when_not_exploring',
          'social_isolation_for_exploration'
        ]
      },
      time_consumption_abuse: {
        daily_limit: 4 * 60 * 60 * 1000,    // 4 hours daily maximum
        weekly_limit: 20 * 60 * 60 * 1000,   // 20 hours weekly maximum
        session_warning: 2 * 60 * 60 * 1000,  // 2 hours session warning
        session_limit: 3 * 60 * 60 * 1000,    // 3 hours session maximum
        mandatory_break: 30 * 60 * 1000       // 30 minutes mandatory break
      },
      discovery_frustration_escalation: {
        detection_threshold: 0.75,
        consecutive_failure_limit: 5,
        frustration_escalation_rate: 0.15,
        intervention_triggers: [
          'anger_responses_to_difficulty',
          'blame_shifting_to_game_design',
          'aggressive_help_seeking',
          'destructive_gameplay_behavior'
        ]
      }
    };

    // Healthy exploration promotion
    this.HEALTHY_PATTERNS = {
      balanced_progression: {
        exploration_to_progression_ratio: { min: 0.3, max: 0.8 },
        discovery_celebration_time: 30000, // 30 seconds to appreciate discoveries
        variety_in_exploration_methods: 0.6, // 60% variety in exploration approaches
        social_vs_solo_balance: { min: 0.2, max: 0.8 }
      },
      sustainable_pacing: {
        discovery_per_session_target: { min: 2, max: 8 },
        break_frequency_recommendation: 45 * 60 * 1000, // 45 minutes between breaks
        session_variety_encouragement: true,
        natural_stopping_point_recognition: true
      },
      emotional_wellness: {
        positive_discovery_emotion_ratio: 0.7, // 70% positive emotions
        frustration_recovery_time: 5 * 60 * 1000, // 5 minutes recovery
        celebration_ritual_encouragement: true,
        achievement_appreciation_time: true
      }
    };

    // Intervention strategies
    this.INTERVENTION_STRATEGIES = {
      gentle_reminders: {
        time_awareness: "You've been exploring for a while - remember to appreciate what you've discovered!",
        completion_pressure: "Every discovery is valuable, even if you don't find everything.",
        pacing_suggestion: "Great discoveries often come to those who explore at a comfortable pace.",
        social_encouragement: "Consider sharing your discoveries with fellow explorers!"
      },
      progressive_interventions: {
        level_1: 'awareness_notifications',
        level_2: 'pacing_suggestions',
        level_3: 'mandatory_reflection_breaks',
        level_4: 'content_accessibility_adjustments',
        level_5: 'professional_resource_recommendations'
      },
      positive_reinforcement: {
        healthy_behavior_recognition: true,
        balanced_play_rewards: true,
        mindful_exploration_achievements: true,
        well_being_milestones: true
      }
    };

    // Well-being check-in system
    this.WELLBEING_CHECKINS = {
      frequency: {
        regular_checkins: 7 * 24 * 60 * 60 * 1000, // Weekly
        post_intensive_session: 3 * 60 * 60 * 1000, // After 3+ hour sessions
        after_frustration_events: 24 * 60 * 60 * 1000, // 24 hours after frustration
        milestone_celebrations: 'immediate'
      },
      assessment_questions: [
        {
          category: 'enjoyment',
          question: "How much are you enjoying your exploration adventures?",
          scale: 1-5,
          healthy_range: [3, 5]
        },
        {
          category: 'pressure',
          question: "Do you feel pressure to find everything in the game?",
          scale: 1-5,
          healthy_range: [1, 2]
        },
        {
          category: 'balance',
          question: "Are you maintaining a good balance between gaming and other activities?",
          scale: 1-5,
          healthy_range: [3, 5]
        },
        {
          category: 'social_impact',
          question: "Is your exploration time affecting your relationships or responsibilities?",
          scale: 1-5,
          healthy_range: [1, 2]
        },
        {
          category: 'emotional_state',
          question: "How do you feel after your exploration sessions?",
          options: ['energized', 'satisfied', 'neutral', 'tired', 'frustrated'],
          healthy_responses: ['energized', 'satisfied']
        }
      ]
    };
  }

  /**
   * Initialize ethical safeguards for an Explorer player
   */
  async initializeEthicalSafeguards(sessionId, userId, explorerProfile) {
    const safeguards = {
      monitoring_active: true,
      addiction_risk_assessment: await this.assessInitialAddictionRisk(explorerProfile),
      healthy_behavior_baseline: await this.establishHealthyBaseline(explorerProfile),
      intervention_history: [],
      wellbeing_checkin_schedule: await this.createWellbeingSchedule(),
      personalized_settings: await this.createPersonalizedSettings(explorerProfile),
      support_resources: await this.identifyRelevantResources(explorerProfile),
      emergency_contacts: [],
      opt_out_options: await this.configureOptOutOptions()
    };

    await this.storeSafeguards(userId, safeguards);

    logger.info(`Ethical safeguards initialized for Explorer ${userId}`, {
      riskLevel: safeguards.addiction_risk_assessment.overall_risk,
      monitoringActive: safeguards.monitoring_active
    });

    return safeguards;
  }

  /**
   * Monitor player behavior for addiction patterns
   */
  async monitorAddictionPatterns(sessionId, userId, behaviorData) {
    const safeguards = await this.getSafeguards(userId);
    const patterns = {
      completionism_obsession: await this.detectCompletionismObsession(behaviorData, safeguards),
      exploration_compulsion: await this.detectExplorationCompulsion(behaviorData, safeguards),
      time_consumption_abuse: await this.detectTimeAbuse(behaviorData, safeguards),
      discovery_frustration_escalation: await this.detectFrustrationEscalation(behaviorData, safeguards)
    };

    // Calculate overall addiction risk
    const overallRisk = await this.calculateOverallAddictionRisk(patterns);
    
    // Determine if intervention is needed
    const interventionNeeded = await this.assessInterventionNeeds(patterns, overallRisk);
    
    // Execute interventions if necessary
    if (interventionNeeded.immediate) {
      await this.executeImmediateIntervention(userId, interventionNeeded, patterns);
    }
    
    if (interventionNeeded.scheduled) {
      await this.scheduleIntervention(userId, interventionNeeded, patterns);
    }

    // Update safeguards with new data
    safeguards.addiction_risk_assessment = {
      ...safeguards.addiction_risk_assessment,
      current_patterns: patterns,
      overall_risk: overallRisk,
      last_assessment: Date.now()
    };

    await this.storeSafeguards(userId, safeguards);

    return {
      patterns,
      overall_risk: overallRisk,
      interventions_triggered: interventionNeeded,
      safeguards_status: 'active'
    };
  }

  /**
   * Detect completionism obsession patterns
   */
  async detectCompletionismObsession(behaviorData, safeguards) {
    const indicators = {};
    
    // Completion anxiety detection
    indicators.completion_anxiety = await this.analyzeCompletionAnxiety(behaviorData);
    
    // Fear of missing out (FOMO)
    indicators.fear_of_missing_out = await this.analyzeFOMO(behaviorData);
    
    // Excessive checking behavior
    indicators.excessive_checking = await this.analyzeExcessiveChecking(behaviorData);
    
    // Inability to enjoy partial completion
    indicators.partial_completion_distress = await this.analyzePartialCompletionDistress(behaviorData);
    
    // Distress when content is unavailable
    indicators.unavailable_content_distress = await this.analyzeUnavailableContentDistress(behaviorData);

    // Calculate overall completionism obsession score
    const obsessionScore = await this.calculateCompletionismScore(indicators);
    
    return {
      score: obsessionScore,
      indicators,
      risk_level: this.assessRiskLevel(obsessionScore, this.ADDICTION_PATTERNS.completionism_obsession),
      intervention_recommended: obsessionScore >= this.ADDICTION_PATTERNS.completionism_obsession.warning_threshold
    };
  }

  /**
   * Detect exploration compulsion patterns
   */
  async detectExplorationCompulsion(behaviorData, safeguards) {
    const indicators = {};
    
    // Inability to stop exploring
    indicators.inability_to_stop = await this.analyzeStoppingDifficulty(behaviorData);
    
    // Neglecting other game aspects
    indicators.aspect_neglect = await this.analyzeAspectNeglect(behaviorData);
    
    // Repetitive checking for secrets
    indicators.repetitive_checking = await this.analyzeRepetitiveChecking(behaviorData);
    
    // Anxiety when not exploring
    indicators.exploration_anxiety = await this.analyzeExplorationAnxiety(behaviorData);
    
    // Social isolation for exploration
    indicators.social_isolation = await this.analyzeSocialIsolation(behaviorData);

    const compulsionScore = await this.calculateCompulsionScore(indicators);
    
    return {
      score: compulsionScore,
      indicators,
      risk_level: this.assessRiskLevel(compulsionScore, this.ADDICTION_PATTERNS.exploration_compulsion),
      intervention_recommended: compulsionScore >= this.ADDICTION_PATTERNS.exploration_compulsion.warning_threshold
    };
  }

  /**
   * Detect time consumption abuse
   */
  async detectTimeAbuse(behaviorData, safeguards) {
    const timeMetrics = {
      daily_time: await this.calculateDailyTime(behaviorData),
      weekly_time: await this.calculateWeeklyTime(behaviorData),
      session_lengths: await this.analyzeSessionLengths(behaviorData),
      break_frequency: await this.analyzeBreakFrequency(behaviorData)
    };

    const timeAbuse = {
      daily_exceeded: timeMetrics.daily_time > this.ADDICTION_PATTERNS.time_consumption_abuse.daily_limit,
      weekly_exceeded: timeMetrics.weekly_time > this.ADDICTION_PATTERNS.time_consumption_abuse.weekly_limit,
      session_exceeded: Math.max(...timeMetrics.session_lengths) > this.ADDICTION_PATTERNS.time_consumption_abuse.session_limit,
      insufficient_breaks: timeMetrics.break_frequency < 0.5 // Less than 50% recommended break frequency
    };

    const abuseScore = await this.calculateTimeAbuseScore(timeAbuse, timeMetrics);
    
    return {
      score: abuseScore,
      metrics: timeMetrics,
      abuse_indicators: timeAbuse,
      immediate_action_needed: timeAbuse.session_exceeded || timeAbuse.daily_exceeded
    };
  }

  /**
   * Execute immediate intervention for addiction patterns
   */
  async executeImmediateIntervention(userId, interventionNeeded, patterns) {
    const interventions = [];

    // Time-based interventions
    if (patterns.time_consumption_abuse.immediate_action_needed) {
      interventions.push(await this.executeTimeIntervention(userId, patterns.time_consumption_abuse));
    }

    // Completionism interventions
    if (patterns.completionism_obsession.risk_level === 'critical') {
      interventions.push(await this.executeCompletionismIntervention(userId, patterns.completionism_obsession));
    }

    // Compulsion interventions
    if (patterns.exploration_compulsion.risk_level === 'critical') {
      interventions.push(await this.executeCompulsionIntervention(userId, patterns.exploration_compulsion));
    }

    // Frustration interventions
    if (patterns.discovery_frustration_escalation.score > 0.8) {
      interventions.push(await this.executeFrustrationIntervention(userId, patterns.discovery_frustration_escalation));
    }

    // Log interventions
    await this.logInterventions(userId, interventions);

    logger.warn(`Immediate ethical safeguard interventions executed for ${userId}`, {
      interventionCount: interventions.length,
      riskPatterns: Object.keys(patterns).filter(p => patterns[p].risk_level === 'critical')
    });

    return interventions;
  }

  /**
   * Execute time-based intervention
   */
  async executeTimeIntervention(userId, timeAbuse) {
    const intervention = {
      type: 'time_management',
      severity: 'immediate',
      actions: [],
      timestamp: Date.now()
    };

    if (timeAbuse.abuse_indicators.session_exceeded) {
      intervention.actions.push({
        action: 'mandatory_break',
        duration: this.ADDICTION_PATTERNS.time_consumption_abuse.mandatory_break,
        message: "You've been exploring for an extended period. Time for a well-deserved break! Your discoveries will be here when you return."
      });
    }

    if (timeAbuse.abuse_indicators.daily_exceeded) {
      intervention.actions.push({
        action: 'daily_limit_notification',
        message: "You've reached your daily exploration goal! Consider taking time to appreciate today's discoveries.",
        suggestion: "Try revisiting your favorite discoveries from today."
      });
    }

    // Provide healthy alternatives
    intervention.actions.push({
      action: 'healthy_alternatives',
      suggestions: [
        "Share your discoveries with friends",
        "Reflect on your favorite moments from today",
        "Plan your next exploration adventure",
        "Take a walk and notice real-world details"
      ]
    });

    return intervention;
  }

  /**
   * Promote healthy exploration habits
   */
  async promoteHealthyHabits(userId, explorerProfile) {
    const healthyPromotions = {
      pacing_encouragement: await this.createPacingEncouragement(explorerProfile),
      discovery_celebration: await this.createDiscoveryCelebration(),
      social_exploration: await this.createSocialExplorationPrompts(),
      mindful_exploration: await this.createMindfulnessPrompts(),
      balance_suggestions: await this.createBalanceSuggestions(explorerProfile)
    };

    // Schedule regular healthy habit reminders
    await this.scheduleHealthyHabitReminders(userId, healthyPromotions);

    return healthyPromotions;
  }

  /**
   * Conduct well-being check-in
   */
  async conductWellbeingCheckin(userId, checkinType = 'regular') {
    const checkin = {
      id: `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: checkinType,
      timestamp: Date.now(),
      questions: this.WELLBEING_CHECKINS.assessment_questions,
      responses: {},
      recommendations: [],
      follow_up_needed: false
    };

    // Store check-in for user completion
    await this.storeWellbeingCheckin(userId, checkin);

    // Notify user about check-in
    await this.notifyWellbeingCheckin(userId, checkin);

    logger.info(`Well-being check-in initiated for ${userId}`, {
      checkinType,
      checkinId: checkin.id
    });

    return checkin;
  }

  /**
   * Process well-being check-in responses
   */
  async processWellbeingResponses(userId, checkinId, responses) {
    const checkin = await this.getWellbeingCheckin(userId, checkinId);
    checkin.responses = responses;
    checkin.completion_time = Date.now();

    // Analyze responses for concerning patterns
    const analysis = await this.analyzeWellbeingResponses(responses);
    checkin.analysis = analysis;

    // Generate recommendations based on responses
    checkin.recommendations = await this.generateWellbeingRecommendations(analysis);

    // Determine if follow-up is needed
    checkin.follow_up_needed = analysis.concerning_responses.length > 0;

    if (checkin.follow_up_needed) {
      await this.scheduleWellbeingFollowup(userId, checkin);
    }

    // Update safeguards based on check-in results
    await this.updateSafeguardsFromCheckin(userId, checkin);

    await this.storeWellbeingCheckin(userId, checkin);

    logger.info(`Well-being check-in processed for ${userId}`, {
      concerningResponses: analysis.concerning_responses.length,
      followUpNeeded: checkin.follow_up_needed
    });

    return checkin;
  }

  /**
   * Provide resources for healthy gaming
   */
  async provideHealthyGamingResources(userId, specificNeeds = []) {
    const resources = {
      time_management: {
        guides: [
          "Setting Healthy Gaming Boundaries",
          "The Pomodoro Technique for Gamers",
          "Creating Sustainable Play Schedules"
        ],
        tools: [
          "Session timer with gentle reminders",
          "Break activity suggestions",
          "Progress tracking without pressure"
        ]
      },
      completionism_management: {
        guides: [
          "Finding Joy in the Journey, Not Just the Destination",
          "Healthy Completionist Habits",
          "When to Take Breaks from Collection Goals"
        ],
        techniques: [
          "Mindful appreciation of discoveries",
          "Setting realistic completion goals",
          "Celebrating partial achievements"
        ]
      },
      social_connection: {
        features: [
          "Explorer community groups",
          "Discovery sharing platforms",
          "Mentor-mentee matching"
        ],
        activities: [
          "Group exploration events",
          "Discovery celebration parties",
          "Collaborative mystery solving"
        ]
      },
      professional_support: {
        when_to_seek: [
          "Gaming is affecting daily responsibilities",
          "Feeling anxious when not playing",
          "Relationships are being strained",
          "Physical health is being impacted"
        ],
        resources: [
          "Game addiction counseling services",
          "Healthy gaming support groups",
          "Mental health professional directory"
        ]
      }
    };

    // Personalize resources based on specific needs
    const personalizedResources = await this.personalizeResources(resources, specificNeeds);

    return personalizedResources;
  }

  // Storage and retrieval methods
  async getSafeguards(userId) {
    const key = `safeguards:${userId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : await this.initializeEthicalSafeguards(null, userId, {});
  }

  async storeSafeguards(userId, safeguards) {
    const key = `safeguards:${userId}`;
    await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(safeguards)); // 30 days
  }

  async storeWellbeingCheckin(userId, checkin) {
    const key = `wellbeing:checkin:${userId}:${checkin.id}`;
    await redis.setex(key, 90 * 24 * 60 * 60, JSON.stringify(checkin)); // 90 days
  }

  async getWellbeingCheckin(userId, checkinId) {
    const key = `wellbeing:checkin:${userId}:${checkinId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Placeholder implementations for complex analysis methods
  async assessInitialAddictionRisk(explorerProfile) {
    return {
      overall_risk: 'low',
      risk_factors: [],
      protective_factors: ['balanced_explorer_type', 'social_engagement']
    };
  }

  async establishHealthyBaseline(explorerProfile) {
    return {
      recommended_session_length: 90 * 60 * 1000, // 90 minutes
      recommended_daily_time: 2 * 60 * 60 * 1000,  // 2 hours
      healthy_discovery_rate: 3, // 3 discoveries per session
      break_frequency: 45 * 60 * 1000 // 45 minutes between breaks
    };
  }

  async createWellbeingSchedule() {
    return {
      next_regular_checkin: Date.now() + (7 * 24 * 60 * 60 * 1000),
      checkin_frequency: 7 * 24 * 60 * 60 * 1000,
      post_session_checkins: true
    };
  }

  async createPersonalizedSettings(explorerProfile) {
    return {
      gentle_reminders: true,
      progress_celebration: true,
      social_encouragement: true,
      mindfulness_prompts: false
    };
  }

  async identifyRelevantResources(explorerProfile) {
    return ['time_management', 'discovery_appreciation'];
  }

  async configureOptOutOptions() {
    return {
      partial_opt_out: ['reminder_frequency', 'checkin_questions'],
      full_opt_out_available: true,
      opt_out_cooling_period: 24 * 60 * 60 * 1000 // 24 hours
    };
  }

  // Analysis method placeholders
  async analyzeCompletionAnxiety(behaviorData) { return 0.3; }
  async analyzeFOMO(behaviorData) { return 0.2; }
  async analyzeExcessiveChecking(behaviorData) { return 0.1; }
  async analyzePartialCompletionDistress(behaviorData) { return 0.2; }
  async analyzeUnavailableContentDistress(behaviorData) { return 0.1; }
  async calculateCompletionismScore(indicators) { return 0.25; }
  
  async analyzeStoppingDifficulty(behaviorData) { return 0.2; }
  async analyzeAspectNeglect(behaviorData) { return 0.1; }
  async analyzeRepetitiveChecking(behaviorData) { return 0.15; }
  async analyzeExplorationAnxiety(behaviorData) { return 0.1; }
  async analyzeSocialIsolation(behaviorData) { return 0.05; }
  async calculateCompulsionScore(indicators) { return 0.2; }
  
  async calculateDailyTime(behaviorData) { return 2 * 60 * 60 * 1000; }
  async calculateWeeklyTime(behaviorData) { return 10 * 60 * 60 * 1000; }
  async analyzeSessionLengths(behaviorData) { return [90 * 60 * 1000]; }
  async analyzeBreakFrequency(behaviorData) { return 0.8; }
  async calculateTimeAbuseScore(abuse, metrics) { return 0.3; }
  
  assessRiskLevel(score, thresholds) {
    if (score >= thresholds.intervention_threshold) return 'critical';
    if (score >= thresholds.detection_threshold) return 'high';
    if (score >= thresholds.warning_threshold) return 'moderate';
    return 'low';
  }

  async calculateOverallAddictionRisk(patterns) { return 0.3; }
  async assessInterventionNeeds(patterns, risk) { return { immediate: false, scheduled: false }; }
  async scheduleIntervention(userId, needs, patterns) { return; }
  async executeCompletionismIntervention(userId, pattern) { return {}; }
  async executeCompulsionIntervention(userId, pattern) { return {}; }
  async executeFrustrationIntervention(userId, pattern) { return {}; }
  async logInterventions(userId, interventions) { return; }
  
  async createPacingEncouragement(profile) { return {}; }
  async createDiscoveryCelebration() { return {}; }
  async createSocialExplorationPrompts() { return {}; }
  async createMindfulnessPrompts() { return {}; }
  async createBalanceSuggestions(profile) { return {}; }
  async scheduleHealthyHabitReminders(userId, promotions) { return; }
  
  async notifyWellbeingCheckin(userId, checkin) { return; }
  async analyzeWellbeingResponses(responses) { return { concerning_responses: [] }; }
  async generateWellbeingRecommendations(analysis) { return []; }
  async scheduleWellbeingFollowup(userId, checkin) { return; }
  async updateSafeguardsFromCheckin(userId, checkin) { return; }
  
  async personalizeResources(resources, needs) { return resources; }
}

module.exports = ExplorerEthicalSafeguards;