/**
 * Curiosity Progression System
 * Rewards exploration, discovery, and knowledge-seeking behavior over traditional completion metrics
 * Designed specifically for Explorer archetype players
 */

const logger = require('../utils/logger');
const { redis } = require('../config/redis');

class CuriosityProgressionSystem {
  constructor() {
    // Curiosity-based progression metrics
    this.CURIOSITY_METRICS = {
      discovery_points: {
        new_area_discovered: 100,
        secret_found: 150,
        lore_piece_uncovered: 75,
        easter_egg_found: 200,
        mystery_solved: 300,
        environmental_story_read: 50,
        hidden_passage_discovered: 175,
        treasure_cache_found: 125,
        puzzle_solved: 100,
        narrative_connection_made: 225
      },
      exploration_depth: {
        area_thoroughness_bonus: 0.5,    // 50% bonus for thorough exploration
        backtracking_insight_bonus: 0.25, // 25% bonus for returning with new knowledge
        off_path_discovery_bonus: 0.75,   // 75% bonus for off-path discoveries
        methodology_consistency_bonus: 0.3 // 30% bonus for consistent exploration style
      },
      knowledge_synthesis: {
        connection_discovery: 500,        // Connecting separate lore pieces
        pattern_recognition: 300,         // Recognizing environmental patterns
        theory_confirmation: 400,         // Confirming player theories about the world
        mystery_chain_completion: 1000,   // Completing complex mystery chains
        world_understanding_milestone: 750 // Major world understanding achievements
      }
    };

    // Knowledge tree structure
    this.KNOWLEDGE_TREE = {
      branches: {
        world_lore: {
          name: "World Chronicler",
          description: "Deep understanding of world history and mythology",
          nodes: ['ancient_history', 'cultural_traditions', 'mythological_beings', 'historical_events'],
          progression_type: 'breadth_and_depth'
        },
        environmental_mastery: {
          name: "Environmental Scholar",
          description: "Expertise in reading and understanding environments",
          nodes: ['biome_expertise', 'architectural_analysis', 'ecosystem_understanding', 'geological_knowledge'],
          progression_type: 'specialization'
        },
        mystery_solving: {
          name: "Master Detective",
          description: "Exceptional ability to solve complex mysteries",
          nodes: ['pattern_recognition', 'logical_deduction', 'evidence_synthesis', 'theory_construction'],
          progression_type: 'skill_development'
        },
        discovery_techniques: {
          name: "Discovery Pioneer",
          description: "Advanced techniques for finding hidden content",
          nodes: ['secret_detection', 'hidden_passage_recognition', 'treasure_sense', 'easter_egg_intuition'],
          progression_type: 'ability_unlock'
        },
        social_exploration: {
          name: "Exploration Guide",
          description: "Leadership in collaborative discovery",
          nodes: ['group_coordination', 'discovery_sharing', 'mentorship_skills', 'community_building'],
          progression_type: 'social_development'
        }
      }
    };

    // Discovery badges and achievements
    this.DISCOVERY_BADGES = {
      exploration_style: {
        systematic_mapper: "Methodically explore and map entire areas",
        secret_hunter: "Find high numbers of hidden secrets",
        lore_master: "Discover and understand extensive lore",
        wandering_scholar: "Find discoveries through non-linear exploration",
        puzzle_virtuoso: "Excel at solving environmental puzzles"
      },
      discovery_milestones: {
        first_discovery: "Make your first significant discovery",
        hundred_secrets: "Find 100 hidden secrets",
        lore_completionist: "Discover all lore in a major area",
        mystery_maven: "Solve 10 complex mysteries",
        easter_egg_collector: "Find 25 easter eggs",
        exploration_legend: "Achieve mastery in all discovery categories"
      },
      collaborative_discovery: {
        discovery_sharing: "Share discoveries that help others",
        group_expedition_leader: "Lead successful group explorations",
        mystery_team_solver: "Solve mysteries as part of a team",
        discovery_mentor: "Help new explorers find their first secrets",
        community_cartographer: "Contribute to community mapping projects"
      }
    };

    // Mystery chain system
    this.MYSTERY_CHAINS = {
      complexity_levels: {
        simple: {
          steps: 2,
          reward_multiplier: 1.0,
          difficulty: 'accessible'
        },
        moderate: {
          steps: 4,
          reward_multiplier: 1.5,
          difficulty: 'engaging'
        },
        complex: {
          steps: 7,
          reward_multiplier: 2.5,
          difficulty: 'challenging'
        },
        legendary: {
          steps: 12,
          reward_multiplier: 4.0,
          difficulty: 'masterful'
        }
      },
      chain_types: {
        narrative_mystery: "Uncover stories through environmental clues",
        logical_puzzle: "Solve interconnected logical puzzles",
        exploration_quest: "Discover locations through exploration",
        social_mystery: "Solve mysteries through community collaboration",
        meta_mystery: "Mysteries that span multiple areas or time periods"
      }
    };

    // Area mastery system
    this.AREA_MASTERY = {
      mastery_criteria: {
        discovery_completion: 0.9,       // 90% of discoverable content found
        lore_understanding: 0.8,         // 80% of area lore understood
        secret_finding: 0.95,            // 95% of secrets discovered
        environmental_knowledge: 0.85,   // 85% of environmental stories read
        mystery_resolution: 1.0          // 100% of area mysteries solved
      },
      mastery_benefits: {
        enhanced_discovery_sense: "Improved ability to find secrets in similar areas",
        lore_insight_bonus: "Bonus understanding when discovering related lore",
        environmental_expertise: "Enhanced environmental storytelling in similar biomes",
        mentor_capabilities: "Ability to guide others in similar areas",
        mystery_solving_bonus: "Improved mystery-solving in related contexts"
      }
    };
  }

  /**
   * Initialize curiosity progression for an Explorer player
   */
  async initializeCuriosityProgression(sessionId, userId, explorerProfile) {
    const progression = {
      curiosity_points: 0,
      knowledge_tree: await this.initializeKnowledgeTree(),
      discovery_badges: [],
      mystery_chains: {
        active: [],
        completed: []
      },
      area_mastery: {},
      exploration_journal: {
        discoveries: [],
        theories: [],
        connections: []
      },
      progression_milestones: []
    };

    // Set initial progression based on Explorer subtype
    await this.customizeInitialProgression(progression, explorerProfile);

    // Store progression system
    await this.storeProgression(sessionId, userId, progression);

    logger.info(`Curiosity progression system initialized for Explorer ${userId}`, {
      subtype: explorerProfile.primarySubtype,
      initialPoints: progression.curiosity_points
    });

    return progression;
  }

  /**
   * Award curiosity points for discovery actions
   */
  async awardCuriosityPoints(sessionId, userId, discoveryAction) {
    const progression = await this.getProgression(sessionId, userId);
    const basePoints = this.CURIOSITY_METRICS.discovery_points[discoveryAction.type] || 0;
    
    // Calculate bonus multipliers
    const depthBonus = await this.calculateDepthBonus(discoveryAction, progression);
    const explorationBonus = await this.calculateExplorationBonus(discoveryAction, progression);
    const synthesisBonus = await this.calculateSynthesisBonus(discoveryAction, progression);
    
    const totalPoints = Math.floor(basePoints * (1 + depthBonus + explorationBonus + synthesisBonus));
    
    // Award points
    progression.curiosity_points += totalPoints;
    
    // Record discovery in journal
    progression.exploration_journal.discoveries.push({
      type: discoveryAction.type,
      timestamp: Date.now(),
      location: discoveryAction.location,
      points_awarded: totalPoints,
      context: discoveryAction.context
    });

    // Check for knowledge tree progression
    await this.checkKnowledgeTreeProgression(progression, discoveryAction);
    
    // Check for badge awards
    await this.checkBadgeEligibility(progression, discoveryAction);
    
    // Update mystery chain progress
    await this.updateMysteryChainProgress(progression, discoveryAction);
    
    // Check for area mastery progression
    await this.checkAreaMasteryProgression(progression, discoveryAction);

    // Store updated progression
    await this.storeProgression(sessionId, userId, progression);

    logger.info(`Curiosity points awarded to ${userId}`, {
      action: discoveryAction.type,
      basePoints,
      totalPoints,
      newTotal: progression.curiosity_points
    });

    return {
      points_awarded: totalPoints,
      total_points: progression.curiosity_points,
      bonuses_applied: { depthBonus, explorationBonus, synthesisBonus },
      new_achievements: await this.getNewAchievements(progression)
    };
  }

  /**
   * Initialize knowledge tree structure
   */
  async initializeKnowledgeTree() {
    const tree = {
      unlocked_branches: [],
      active_nodes: {},
      completed_nodes: [],
      available_paths: []
    };

    // Start with basic discovery branch available
    tree.unlocked_branches.push('discovery_techniques');
    tree.available_paths = await this.calculateAvailablePaths(tree);

    return tree;
  }

  /**
   * Check and update knowledge tree progression
   */
  async checkKnowledgeTreeProgression(progression, discoveryAction) {
    const knowledgeTree = progression.knowledge_tree;
    
    // Determine which branches this discovery contributes to
    const relevantBranches = await this.identifyRelevantBranches(discoveryAction);
    
    for (const branch of relevantBranches) {
      if (!knowledgeTree.unlocked_branches.includes(branch)) {
        // Check if branch should be unlocked
        if (await this.shouldUnlockBranch(progression, branch)) {
          knowledgeTree.unlocked_branches.push(branch);
          await this.recordMilestone(progression, `branch_unlocked_${branch}`);
        }
      }
      
      // Progress nodes within the branch
      await this.progressBranchNodes(knowledgeTree, branch, discoveryAction);
    }
    
    // Recalculate available paths
    knowledgeTree.available_paths = await this.calculateAvailablePaths(knowledgeTree);
  }

  /**
   * Check badge eligibility and award new badges
   */
  async checkBadgeEligibility(progression, discoveryAction) {
    const newBadges = [];
    
    // Check exploration style badges
    for (const [badgeId, criteria] of Object.entries(this.DISCOVERY_BADGES.exploration_style)) {
      if (!progression.discovery_badges.includes(badgeId)) {
        if (await this.meetsBadgeCriteria(progression, badgeId, criteria)) {
          progression.discovery_badges.push(badgeId);
          newBadges.push(badgeId);
          await this.recordMilestone(progression, `badge_earned_${badgeId}`);
        }
      }
    }
    
    // Check discovery milestone badges
    for (const [badgeId, criteria] of Object.entries(this.DISCOVERY_BADGES.discovery_milestones)) {
      if (!progression.discovery_badges.includes(badgeId)) {
        if (await this.meetsBadgeCriteria(progression, badgeId, criteria)) {
          progression.discovery_badges.push(badgeId);
          newBadges.push(badgeId);
          await this.recordMilestone(progression, `milestone_${badgeId}`);
        }
      }
    }
    
    // Check collaborative discovery badges
    for (const [badgeId, criteria] of Object.entries(this.DISCOVERY_BADGES.collaborative_discovery)) {
      if (!progression.discovery_badges.includes(badgeId)) {
        if (await this.meetsBadgeCriteria(progression, badgeId, criteria)) {
          progression.discovery_badges.push(badgeId);
          newBadges.push(badgeId);
          await this.recordMilestone(progression, `collaboration_${badgeId}`);
        }
      }
    }
    
    return newBadges;
  }

  /**
   * Update mystery chain progress
   */
  async updateMysteryChainProgress(progression, discoveryAction) {
    const activeChains = progression.mystery_chains.active;
    
    for (const chain of activeChains) {
      if (await this.contributesToMysteryChain(discoveryAction, chain)) {
        chain.progress.push({
          step: discoveryAction,
          timestamp: Date.now(),
          location: discoveryAction.location
        });
        
        // Check if chain is completed
        if (chain.progress.length >= chain.required_steps) {
          await this.completeMysteryChain(progression, chain);
        }
      }
    }
  }

  /**
   * Complete a mystery chain and award rewards
   */
  async completeMysteryChain(progression, chain) {
    // Remove from active chains
    const chainIndex = progression.mystery_chains.active.indexOf(chain);
    if (chainIndex > -1) {
      progression.mystery_chains.active.splice(chainIndex, 1);
    }
    
    // Add to completed chains
    progression.mystery_chains.completed.push({
      ...chain,
      completion_timestamp: Date.now()
    });
    
    // Award completion rewards
    const rewardPoints = this.CURIOSITY_METRICS.knowledge_synthesis.mystery_chain_completion;
    const complexityMultiplier = this.MYSTERY_CHAINS.complexity_levels[chain.complexity].reward_multiplier;
    const totalReward = Math.floor(rewardPoints * complexityMultiplier);
    
    progression.curiosity_points += totalReward;
    
    // Record milestone
    await this.recordMilestone(progression, `mystery_chain_completed_${chain.id}`);
    
    logger.info(`Mystery chain completed`, {
      chainId: chain.id,
      complexity: chain.complexity,
      rewardPoints: totalReward
    });
  }

  /**
   * Check area mastery progression
   */
  async checkAreaMasteryProgression(progression, discoveryAction) {
    const areaId = discoveryAction.location?.area;
    if (!areaId) return;
    
    if (!progression.area_mastery[areaId]) {
      progression.area_mastery[areaId] = {
        discovery_progress: 0,
        lore_progress: 0,
        secret_progress: 0,
        environmental_progress: 0,
        mystery_progress: 0,
        mastery_level: 0
      };
    }
    
    const areaMastery = progression.area_mastery[areaId];
    
    // Update relevant progress based on discovery type
    switch (discoveryAction.type) {
      case 'secret_found':
        areaMastery.secret_progress += 0.1;
        break;
      case 'lore_piece_uncovered':
        areaMastery.lore_progress += 0.1;
        break;
      case 'environmental_story_read':
        areaMastery.environmental_progress += 0.1;
        break;
      case 'mystery_solved':
        areaMastery.mystery_progress += 0.2;
        break;
      default:
        areaMastery.discovery_progress += 0.05;
    }
    
    // Check for mastery level increases
    const newMasteryLevel = await this.calculateAreaMasteryLevel(areaMastery);
    if (newMasteryLevel > areaMastery.mastery_level) {
      areaMastery.mastery_level = newMasteryLevel;
      await this.recordMilestone(progression, `area_mastery_${areaId}_level_${newMasteryLevel}`);
      
      // Award mastery benefits
      await this.awardMasteryBenefits(progression, areaId, newMasteryLevel);
    }
  }

  /**
   * Calculate depth bonus for discovery
   */
  async calculateDepthBonus(discoveryAction, progression) {
    let bonus = 0;
    
    // Area thoroughness bonus
    const areaId = discoveryAction.location?.area;
    if (areaId && progression.area_mastery[areaId]) {
      const thoroughness = await this.calculateAreaThoroughness(progression.area_mastery[areaId]);
      bonus += thoroughness * this.CURIOSITY_METRICS.exploration_depth.area_thoroughness_bonus;
    }
    
    // Methodology consistency bonus
    const consistencyScore = await this.calculateMethodologyConsistency(progression);
    bonus += consistencyScore * this.CURIOSITY_METRICS.exploration_depth.methodology_consistency_bonus;
    
    return Math.min(bonus, 1.0); // Cap at 100% bonus
  }

  /**
   * Calculate exploration bonus
   */
  async calculateExplorationBonus(discoveryAction, progression) {
    let bonus = 0;
    
    // Off-path discovery bonus
    if (discoveryAction.metadata?.off_main_path) {
      bonus += this.CURIOSITY_METRICS.exploration_depth.off_path_discovery_bonus;
    }
    
    // Backtracking insight bonus
    if (discoveryAction.metadata?.discovered_through_backtracking) {
      bonus += this.CURIOSITY_METRICS.exploration_depth.backtracking_insight_bonus;
    }
    
    return Math.min(bonus, 1.0); // Cap at 100% bonus
  }

  /**
   * Calculate synthesis bonus for connecting knowledge
   */
  async calculateSynthesisBonus(discoveryAction, progression) {
    let bonus = 0;
    
    // Check if this discovery connects to previous discoveries
    const connections = await this.findKnowledgeConnections(discoveryAction, progression);
    if (connections.length > 0) {
      bonus += connections.length * 0.1; // 10% per connection
      
      // Record the connections
      for (const connection of connections) {
        progression.exploration_journal.connections.push({
          discovery: discoveryAction,
          connected_to: connection,
          timestamp: Date.now()
        });
      }
    }
    
    return Math.min(bonus, 0.5); // Cap at 50% bonus
  }

  /**
   * Customize initial progression based on Explorer subtype
   */
  async customizeInitialProgression(progression, explorerProfile) {
    const subtype = explorerProfile.primarySubtype;
    
    switch (subtype) {
      case 'systematic_cartographer':
        progression.knowledge_tree.unlocked_branches.push('environmental_mastery');
        progression.curiosity_points += 100;
        break;
        
      case 'treasure_hunter':
        progression.knowledge_tree.unlocked_branches.push('discovery_techniques');
        progression.curiosity_points += 75;
        break;
        
      case 'lore_archaeologist':
        progression.knowledge_tree.unlocked_branches.push('world_lore');
        progression.curiosity_points += 125;
        break;
        
      case 'wandering_nomad':
        // Start with multiple small progressions
        progression.curiosity_points += 50;
        break;
        
      case 'puzzle_solver':
        progression.knowledge_tree.unlocked_branches.push('mystery_solving');
        progression.curiosity_points += 100;
        break;
    }
  }

  /**
   * Get and store progression data
   */
  async getProgression(sessionId, userId) {
    const key = `curiosity:progression:${userId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : await this.initializeCuriosityProgression(sessionId, userId, {});
  }

  async storeProgression(sessionId, userId, progression) {
    const key = `curiosity:progression:${userId}`;
    await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(progression)); // 7 days
  }

  /**
   * Record progression milestone
   */
  async recordMilestone(progression, milestoneId) {
    progression.progression_milestones.push({
      id: milestoneId,
      timestamp: Date.now(),
      curiosity_points_at_achievement: progression.curiosity_points
    });
  }

  /**
   * Get new achievements from recent progression
   */
  async getNewAchievements(progression) {
    const recentMilestones = progression.progression_milestones.filter(
      m => Date.now() - m.timestamp < 60000 // Last minute
    );
    
    return recentMilestones.map(m => ({
      type: 'curiosity_milestone',
      id: m.id,
      timestamp: m.timestamp
    }));
  }

  // Placeholder implementations for complex calculations
  async calculateAvailablePaths(knowledgeTree) { return []; }
  async identifyRelevantBranches(discoveryAction) { return ['discovery_techniques']; }
  async shouldUnlockBranch(progression, branch) { return progression.curiosity_points > 500; }
  async progressBranchNodes(knowledgeTree, branch, discoveryAction) { return; }
  async meetsBadgeCriteria(progression, badgeId, criteria) { return progression.curiosity_points > 1000; }
  async contributesToMysteryChain(discoveryAction, chain) { return false; }
  async calculateAreaMasteryLevel(areaMastery) { return Math.floor((areaMastery.discovery_progress + areaMastery.lore_progress) / 0.4); }
  async awardMasteryBenefits(progression, areaId, masteryLevel) { return; }
  async calculateAreaThoroughness(areaMastery) { return 0.5; }
  async calculateMethodologyConsistency(progression) { return 0.6; }
  async findKnowledgeConnections(discoveryAction, progression) { return []; }
}

module.exports = CuriosityProgressionSystem;