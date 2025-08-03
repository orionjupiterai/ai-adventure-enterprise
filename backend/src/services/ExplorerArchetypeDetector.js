/**
 * Explorer Archetype Detector
 * Specialized system for identifying and analyzing Explorer player patterns
 * Integrates with PlayerStateDetector for comprehensive behavioral analysis
 */

const logger = require('../utils/logger');
const { redis } = require('../config/redis');

class ExplorerArchetypeDetector {
  constructor() {
    // Explorer behavioral patterns and thresholds
    this.EXPLORER_DETECTION_THRESHOLDS = {
      exploration_action_ratio: 0.35,     // 35% of actions are exploration-based
      secret_discovery_rate: 0.25,        // 25% success rate in finding secrets
      area_completion_preference: 0.7,    // Prefers 70%+ area completion before moving
      non_linear_progression: 0.5,        // 50% deviation from optimal progression paths
      environmental_interaction: 0.4,     // 40% interaction with environmental elements
      curiosity_driven_behavior: 0.6,     // 60% of actions driven by curiosity vs goals
      discovery_session_length: 0.8,      // 80% longer sessions when discovering new content
      backtracking_frequency: 0.3,        // 30% of movement involves backtracking to explore
      hidden_content_seeking: 0.4,        // 40% actively seeks hidden or optional content
      lore_engagement_depth: 0.5          // 50% deep engagement with lore and story elements
    };

    // Explorer subtypes and their characteristics
    this.EXPLORER_SUBTYPES = {
      systematic_cartographer: {
        traits: ['methodical_exploration', 'complete_area_mapping', 'organized_discovery'],
        detection_patterns: {
          grid_like_movement: 0.7,
          area_completion_rate: 0.9,
          systematic_coverage: 0.8
        }
      },
      treasure_hunter: {
        traits: ['secret_seeking', 'hidden_content_focus', 'reward_motivated'],
        detection_patterns: {
          secret_interaction_ratio: 0.6,
          hidden_area_preference: 0.7,
          treasure_find_rate: 0.5
        }
      },
      lore_archaeologist: {
        traits: ['story_focused', 'environmental_reading', 'narrative_driven'],
        detection_patterns: {
          lore_interaction_time: 0.8,
          story_element_engagement: 0.7,
          narrative_path_following: 0.6
        }
      },
      wandering_nomad: {
        traits: ['aimless_exploration', 'scenic_appreciation', 'journey_over_destination'],
        detection_patterns: {
          non_goal_movement: 0.8,
          scenic_area_preference: 0.7,
          random_direction_changes: 0.6
        }
      },
      puzzle_solver: {
        traits: ['environmental_puzzles', 'mystery_focus', 'logical_deduction'],
        detection_patterns: {
          puzzle_engagement_time: 0.8,
          logical_progression: 0.7,
          mystery_solving_success: 0.6
        }
      }
    };

    // Behavioral tracking keys
    this.TRACKING_WINDOWS = {
      short_term: 30 * 60 * 1000,    // 30 minutes
      medium_term: 2 * 60 * 60 * 1000, // 2 hours
      long_term: 24 * 60 * 60 * 1000,  // 24 hours
      session_based: 'current_session'
    };
  }

  /**
   * Comprehensive Explorer archetype detection
   */
  async detectExplorerArchetype(sessionId, userId) {
    const behaviorData = await this.gatherBehaviorData(sessionId, userId);
    const explorerScore = await this.calculateExplorerScore(behaviorData);
    const subtype = await this.identifyExplorerSubtype(behaviorData);
    const confidence = await this.calculateConfidence(behaviorData, explorerScore);
    
    const result = {
      isExplorer: explorerScore >= 0.6,
      explorerScore: explorerScore,
      confidence: confidence,
      primarySubtype: subtype.primary,
      secondarySubtype: subtype.secondary,
      detectedTraits: await this.extractDetectedTraits(behaviorData),
      behaviorProfile: await this.createBehaviorProfile(behaviorData),
      recommendations: await this.generateRecommendations(explorerScore, subtype, behaviorData)
    };

    // Store detection results for historical tracking
    await this.storeDetectionResults(sessionId, userId, result);

    logger.info(`Explorer archetype detection completed for ${userId}:`, {
      score: explorerScore,
      subtype: subtype.primary,
      confidence: confidence
    });

    return result;
  }

  /**
   * Gather comprehensive behavioral data for analysis
   */
  async gatherBehaviorData(sessionId, userId) {
    const actionKey = `dda:actions:${sessionId}`;
    const inputKey = `dda:inputs:${sessionId}`;
    const explorationKey = `explorer:data:${sessionId}`;

    const actions = JSON.parse(await redis.get(actionKey) || '[]');
    const inputs = JSON.parse(await redis.get(inputKey) || '[]');
    const explorationData = JSON.parse(await redis.get(explorationKey) || '{}');

    return {
      totalActions: actions.length,
      explorationActions: actions.filter(a => this.isExplorationAction(a)),
      secretDiscoveries: actions.filter(a => a.type === 'secret_found'),
      loreInteractions: actions.filter(a => a.type === 'lore_interaction'),
      environmentalInteractions: actions.filter(a => a.type === 'environmental_interaction'),
      movementPatterns: await this.analyzeMovementPatterns(inputs),
      sessionDuration: await this.calculateSessionDuration(sessionId),
      areaCompletionData: explorationData.areaCompletion || {},
      discoveryTimestamps: explorationData.discoveries || [],
      pathDeviations: explorationData.pathDeviations || [],
      backtrackingInstances: explorationData.backtracking || [],
      hiddenContentEngagement: explorationData.hiddenContent || {},
      puzzleSolvingData: explorationData.puzzles || {}
    };
  }

  /**
   * Calculate overall Explorer archetype score
   */
  async calculateExplorerScore(behaviorData) {
    let totalScore = 0;
    let weightedFactors = 0;

    // Exploration action ratio
    const explorationRatio = behaviorData.explorationActions.length / Math.max(behaviorData.totalActions, 1);
    if (explorationRatio >= this.EXPLORER_DETECTION_THRESHOLDS.exploration_action_ratio) {
      totalScore += explorationRatio * 0.2;
    }
    weightedFactors += 0.2;

    // Secret discovery success rate
    const secretRate = await this.calculateSecretDiscoveryRate(behaviorData);
    if (secretRate >= this.EXPLORER_DETECTION_THRESHOLDS.secret_discovery_rate) {
      totalScore += secretRate * 0.15;
    }
    weightedFactors += 0.15;

    // Area completion preference
    const areaCompletionScore = await this.calculateAreaCompletionScore(behaviorData);
    if (areaCompletionScore >= this.EXPLORER_DETECTION_THRESHOLDS.area_completion_preference) {
      totalScore += areaCompletionScore * 0.15;
    }
    weightedFactors += 0.15;

    // Non-linear progression patterns
    const nonLinearScore = await this.calculateNonLinearScore(behaviorData);
    if (nonLinearScore >= this.EXPLORER_DETECTION_THRESHOLDS.non_linear_progression) {
      totalScore += nonLinearScore * 0.1;
    }
    weightedFactors += 0.1;

    // Environmental interaction engagement
    const environmentalScore = behaviorData.environmentalInteractions.length / Math.max(behaviorData.totalActions, 1);
    if (environmentalScore >= this.EXPLORER_DETECTION_THRESHOLDS.environmental_interaction) {
      totalScore += environmentalScore * 0.1;
    }
    weightedFactors += 0.1;

    // Curiosity-driven behavior
    const curiosityScore = await this.calculateCuriosityScore(behaviorData);
    if (curiosityScore >= this.EXPLORER_DETECTION_THRESHOLDS.curiosity_driven_behavior) {
      totalScore += curiosityScore * 0.15;
    }
    weightedFactors += 0.15;

    // Discovery session length enhancement
    const sessionEnhancementScore = await this.calculateDiscoverySessionEnhancement(behaviorData);
    if (sessionEnhancementScore >= this.EXPLORER_DETECTION_THRESHOLDS.discovery_session_length) {
      totalScore += sessionEnhancementScore * 0.1;
    }
    weightedFactors += 0.1;

    // Lore engagement depth
    const loreScore = await this.calculateLoreEngagementScore(behaviorData);
    if (loreScore >= this.EXPLORER_DETECTION_THRESHOLDS.lore_engagement_depth) {
      totalScore += loreScore * 0.05;
    }
    weightedFactors += 0.05;

    return weightedFactors > 0 ? totalScore / weightedFactors : 0;
  }

  /**
   * Identify Explorer subtype based on behavioral patterns
   */
  async identifyExplorerSubtype(behaviorData) {
    const subtypeScores = {};

    // Calculate scores for each subtype
    for (const [subtypeName, subtypeConfig] of Object.entries(this.EXPLORER_SUBTYPES)) {
      subtypeScores[subtypeName] = await this.calculateSubtypeScore(behaviorData, subtypeConfig);
    }

    // Sort by score to find primary and secondary subtypes
    const sortedSubtypes = Object.entries(subtypeScores)
      .sort(([,a], [,b]) => b - a);

    return {
      primary: sortedSubtypes[0] ? sortedSubtypes[0][0] : 'general_explorer',
      secondary: sortedSubtypes[1] ? sortedSubtypes[1][0] : null,
      scores: subtypeScores
    };
  }

  /**
   * Calculate subtype-specific score
   */
  async calculateSubtypeScore(behaviorData, subtypeConfig) {
    let score = 0;
    let factors = 0;

    for (const [pattern, threshold] of Object.entries(subtypeConfig.detection_patterns)) {
      const patternScore = await this.calculatePatternScore(behaviorData, pattern);
      if (patternScore >= threshold) {
        score += patternScore;
      }
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate pattern-specific scores
   */
  async calculatePatternScore(behaviorData, pattern) {
    switch (pattern) {
      case 'grid_like_movement':
        return await this.calculateGridMovementScore(behaviorData.movementPatterns);
      
      case 'area_completion_rate':
        return await this.calculateAreaCompletionRate(behaviorData.areaCompletionData);
      
      case 'systematic_coverage':
        return await this.calculateSystematicCoverageScore(behaviorData);
      
      case 'secret_interaction_ratio':
        return behaviorData.secretDiscoveries.length / Math.max(behaviorData.totalActions, 1);
      
      case 'hidden_area_preference':
        return await this.calculateHiddenAreaPreference(behaviorData);
      
      case 'treasure_find_rate':
        return await this.calculateTreasureFindRate(behaviorData);
      
      case 'lore_interaction_time':
        return await this.calculateLoreInteractionTime(behaviorData);
      
      case 'story_element_engagement':
        return behaviorData.loreInteractions.length / Math.max(behaviorData.totalActions, 1);
      
      case 'narrative_path_following':
        return await this.calculateNarrativePathFollowing(behaviorData);
      
      case 'non_goal_movement':
        return await this.calculateNonGoalMovement(behaviorData);
      
      case 'scenic_area_preference':
        return await this.calculateScenicAreaPreference(behaviorData);
      
      case 'random_direction_changes':
        return await this.calculateRandomDirectionChanges(behaviorData.movementPatterns);
      
      case 'puzzle_engagement_time':
        return await this.calculatePuzzleEngagementTime(behaviorData);
      
      case 'logical_progression':
        return await this.calculateLogicalProgression(behaviorData);
      
      case 'mystery_solving_success':
        return await this.calculateMysterySolvingSuccess(behaviorData);
      
      default:
        return 0;
    }
  }

  /**
   * Extract detected traits from behavioral analysis
   */
  async extractDetectedTraits(behaviorData) {
    const traits = {
      exploration_style: [],
      discovery_preferences: [],
      engagement_patterns: [],
      social_tendencies: []
    };

    // Exploration style traits
    if (await this.calculateGridMovementScore(behaviorData.movementPatterns) > 0.7) {
      traits.exploration_style.push('systematic');
    }
    if (await this.calculateRandomDirectionChanges(behaviorData.movementPatterns) > 0.6) {
      traits.exploration_style.push('wandering');
    }
    if (behaviorData.backtrackingInstances.length > 10) {
      traits.exploration_style.push('thorough');
    }

    // Discovery preferences
    if (behaviorData.secretDiscoveries.length > 5) {
      traits.discovery_preferences.push('secret_hunter');
    }
    if (behaviorData.loreInteractions.length > 10) {
      traits.discovery_preferences.push('lore_seeker');
    }
    if (await this.calculateTreasureFindRate(behaviorData) > 0.5) {
      traits.discovery_preferences.push('treasure_hunter');
    }

    // Engagement patterns
    if (await this.calculatePuzzleEngagementTime(behaviorData) > 0.7) {
      traits.engagement_patterns.push('puzzle_solver');
    }
    if (await this.calculateDiscoverySessionEnhancement(behaviorData) > 0.8) {
      traits.engagement_patterns.push('discovery_driven');
    }

    return traits;
  }

  /**
   * Create comprehensive behavior profile
   */
  async createBehaviorProfile(behaviorData) {
    return {
      exploration_efficiency: await this.calculateExplorationEfficiency(behaviorData),
      discovery_rate: behaviorData.discoveryTimestamps.length / Math.max(behaviorData.sessionDuration / (60 * 1000), 1),
      area_thoroughness: await this.calculateAreaThoroughness(behaviorData),
      content_engagement_depth: await this.calculateContentEngagementDepth(behaviorData),
      exploration_persistence: await this.calculateExplorationPersistence(behaviorData),
      discovery_satisfaction: await this.calculateDiscoverySatisfaction(behaviorData),
      exploration_independence: await this.calculateExplorationIndependence(behaviorData),
      mystery_solving_aptitude: await this.calculateMysterySolvingAptitude(behaviorData)
    };
  }

  /**
   * Generate personalized recommendations based on Explorer profile
   */
  async generateRecommendations(explorerScore, subtype, behaviorData) {
    const recommendations = {
      content_adjustments: [],
      feature_suggestions: [],
      social_opportunities: [],
      progression_optimizations: []
    };

    // Content adjustments based on Explorer score
    if (explorerScore >= 0.8) {
      recommendations.content_adjustments.push(
        "Increase hidden content density by 40%",
        "Enable advanced environmental storytelling",
        "Activate procedural secret generation",
        "Unlock master-level exploration challenges"
      );
    } else if (explorerScore >= 0.6) {
      recommendations.content_adjustments.push(
        "Increase hidden content density by 20%",
        "Add discovery hints for complex secrets",
        "Enable intermediate exploration challenges",
        "Provide optional lore depth"
      );
    }

    // Subtype-specific recommendations
    switch (subtype.primary) {
      case 'systematic_cartographer':
        recommendations.feature_suggestions.push(
          "Enable advanced mapping tools",
          "Provide area completion tracking",
          "Add systematic exploration challenges",
          "Unlock cartographer achievement tree"
        );
        break;
      
      case 'treasure_hunter':
        recommendations.feature_suggestions.push(
          "Increase treasure spawn rates",
          "Add treasure detection tools",
          "Enable treasure hunting leaderboards",
          "Provide treasure collection showcases"
        );
        break;
      
      case 'lore_archaeologist':
        recommendations.feature_suggestions.push(
          "Expand environmental storytelling",
          "Add lore connection visualizer",
          "Enable deep narrative exploration",
          "Provide story reconstruction tools"
        );
        break;
      
      case 'wandering_nomad':
        recommendations.feature_suggestions.push(
          "Enable scenic route suggestions",
          "Add atmospheric discovery mode",
          "Provide wandering achievement rewards",
          "Enable exploration photography mode"
        );
        break;
      
      case 'puzzle_solver':
        recommendations.feature_suggestions.push(
          "Increase environmental puzzle density",
          "Add puzzle difficulty scaling",
          "Enable puzzle creation tools",
          "Provide logic challenge achievements"
        );
        break;
    }

    return recommendations;
  }

  /**
   * Helper method to determine if an action is exploration-based
   */
  isExplorationAction(action) {
    const explorationTypes = [
      'explore', 'move', 'investigate', 'search', 'discover',
      'find_secret', 'lore_interaction', 'environmental_interaction',
      'area_enter', 'path_deviate', 'backtrack'
    ];
    return explorationTypes.includes(action.type);
  }

  // Placeholder implementations for calculation methods
  async analyzeMovementPatterns(inputs) { return {}; }
  async calculateSessionDuration(sessionId) { return 60 * 60 * 1000; }
  async calculateSecretDiscoveryRate(behaviorData) { return 0.3; }
  async calculateAreaCompletionScore(behaviorData) { return 0.7; }
  async calculateNonLinearScore(behaviorData) { return 0.5; }
  async calculateCuriosityScore(behaviorData) { return 0.6; }
  async calculateDiscoverySessionEnhancement(behaviorData) { return 0.8; }
  async calculateLoreEngagementScore(behaviorData) { return 0.5; }
  async calculateConfidence(behaviorData, explorerScore) { return Math.min(0.95, explorerScore + 0.1); }
  
  // Additional calculation methods would be implemented here...
  async calculateGridMovementScore(movementPatterns) { return 0.6; }
  async calculateAreaCompletionRate(areaCompletionData) { return 0.8; }
  async calculateSystematicCoverageScore(behaviorData) { return 0.7; }
  async calculateHiddenAreaPreference(behaviorData) { return 0.6; }
  async calculateTreasureFindRate(behaviorData) { return 0.5; }
  async calculateLoreInteractionTime(behaviorData) { return 0.7; }
  async calculateNarrativePathFollowing(behaviorData) { return 0.6; }
  async calculateNonGoalMovement(behaviorData) { return 0.8; }
  async calculateScenicAreaPreference(behaviorData) { return 0.7; }
  async calculateRandomDirectionChanges(movementPatterns) { return 0.6; }
  async calculatePuzzleEngagementTime(behaviorData) { return 0.8; }
  async calculateLogicalProgression(behaviorData) { return 0.7; }
  async calculateMysterySolvingSuccess(behaviorData) { return 0.6; }
  
  async calculateExplorationEfficiency(behaviorData) { return 0.7; }
  async calculateAreaThoroughness(behaviorData) { return 0.8; }
  async calculateContentEngagementDepth(behaviorData) { return 0.6; }
  async calculateExplorationPersistence(behaviorData) { return 0.7; }
  async calculateDiscoverySatisfaction(behaviorData) { return 0.8; }
  async calculateExplorationIndependence(behaviorData) { return 0.9; }
  async calculateMysterySolvingAptitude(behaviorData) { return 0.6; }

  /**
   * Store detection results for historical analysis
   */
  async storeDetectionResults(sessionId, userId, results) {
    const key = `explorer:detection:${userId}`;
    const history = JSON.parse(await redis.get(key) || '[]');
    
    history.push({
      sessionId,
      timestamp: Date.now(),
      results
    });

    // Keep last 100 detection results
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(history)); // 7 days
  }
}

module.exports = ExplorerArchetypeDetector;