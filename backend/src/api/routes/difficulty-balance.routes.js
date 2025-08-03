/**
 * Difficulty Balance API Routes
 * Provides endpoints for the Dynamic Difficulty Adjustment system
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const DifficultyBalanceAgent = require('../../services/DifficultyBalanceAgent');
const PlayerStateDetector = require('../../services/PlayerStateDetector');
const CombatDifficultyController = require('../../services/CombatDifficultyController');
const AntiFrustrationSystem = require('../../services/AntiFrustrationSystem');
const DifficultyTransparencyManager = require('../../services/DifficultyTransparencyManager');
const { GameSession } = require('../../models');
const logger = require('../../utils/logger');

const router = express.Router();

// Initialize services
const difficultyAgent = new DifficultyBalanceAgent();
const stateDetector = new PlayerStateDetector();
const combatController = new CombatDifficultyController();
const antiFrustrationSystem = new AntiFrustrationSystem();
const transparencyManager = new DifficultyTransparencyManager();

/**
 * Update difficulty after combat encounter
 */
router.post('/update',
  [
    body('sessionId').isUUID(),
    body('combatData').isObject(),
    body('combatData.result').isIn(['victory', 'defeat', 'escape']),
    body('combatData.duration').isNumeric(),
    body('combatData.playerPerformance').isObject()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, combatData } = req.body;

      // Verify session ownership
      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Record combat result
      await stateDetector.recordCombatResult(sessionId, combatData);

      // Update difficulty using DDA agent
      const difficultyUpdate = await difficultyAgent.updateDifficulty(sessionId, combatData);

      // Check for anti-frustration intervention
      let interventionResult = null;
      if (difficultyUpdate.playerState.primary === 'frustrated' && 
          difficultyUpdate.playerState.frustrationScore > 0.6) {
        interventionResult = await antiFrustrationSystem.activateIntervention(
          sessionId,
          difficultyUpdate.playerState.frustrationScore,
          difficultyUpdate.playerState,
          combatData
        );
      }

      // Process transparency for adjustments
      const transparencyResult = await transparencyManager.processAdjustmentTransparency(
        sessionId,
        difficultyUpdate.adjustments,
        difficultyUpdate.playerState,
        {
          sessionId,
          flowMetrics: difficultyUpdate.flowMetrics,
          majorChange: Math.abs(difficultyUpdate.flowMetrics.successRate - 0.7) > 0.2
        }
      );

      res.json({
        difficultyUpdated: true,
        playerState: difficultyUpdate.playerState.primary,
        flowScore: difficultyUpdate.flowMetrics.flowScore,
        notifications: transparencyResult.notifications,
        interventions: interventionResult?.interventions || [],
        analytics: transparencyResult.analyticsData
      });

    } catch (error) {
      logger.error('Difficulty update error:', error);
      next(error);
    }
  }
);

/**
 * Apply difficulty to upcoming combat encounter
 */
router.post('/apply-combat',
  [
    body('sessionId').isUUID(),
    body('encounterData').isObject(),
    body('encounterData.enemies').isArray(),
    body('encounterData.environment').optional().isObject()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, encounterData } = req.body;

      // Verify session ownership
      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Get current difficulty settings
      const currentDifficulty = await difficultyAgent.getCurrentDifficulty(sessionId);

      // Apply difficulty to combat encounter
      const modifiedEncounter = await combatController.applyCombatDifficulty(
        sessionId,
        encounterData,
        currentDifficulty
      );

      // Get anti-frustration status
      const antiFrustrationStatus = await antiFrustrationSystem.getInterventionStatus(sessionId);

      res.json({
        encounter: modifiedEncounter,
        antiFrustrationFeatures: antiFrustrationStatus,
        difficultyLevel: await calculateDifficultyLevel(currentDifficulty)
      });

    } catch (error) {
      logger.error('Combat difficulty application error:', error);
      next(error);
    }
  }
);

/**
 * Record player input for behavior analysis
 */
router.post('/record-input',
  [
    body('sessionId').isUUID(),
    body('inputData').isObject(),
    body('inputData.type').notEmpty(),
    body('inputData.timestamp').optional().isNumeric()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, inputData } = req.body;

      // Verify session ownership
      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Record input event
      await stateDetector.recordInputEvent(sessionId, inputData);

      res.json({ recorded: true });

    } catch (error) {
      logger.error('Input recording error:', error);
      next(error);
    }
  }
);

/**
 * Record player action for behavior analysis
 */
router.post('/record-action',
  [
    body('sessionId').isUUID(),
    body('actionData').isObject(),
    body('actionData.type').notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, actionData } = req.body;

      // Verify session ownership
      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Record player action
      await stateDetector.recordPlayerAction(sessionId, actionData);

      res.json({ recorded: true });

    } catch (error) {
      logger.error('Action recording error:', error);
      next(error);
    }
  }
);

/**
 * Get current player state analysis
 */
router.get('/player-state/:sessionId',
  [
    param('sessionId').isUUID()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId } = req.params;

      // Verify session ownership
      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Get player metrics
      const playerMetrics = await difficultyAgent.getPlayerMetrics(sessionId);

      // Analyze current player state
      const playerState = await difficultyAgent.detectPlayerState(sessionId, {}, playerMetrics);

      // Get flow metrics
      const flowMetrics = await difficultyAgent.calculateFlowMetrics(sessionId, {}, playerMetrics);

      // Get anti-frustration status
      const antiFrustrationStatus = await antiFrustrationSystem.getInterventionStatus(sessionId);

      res.json({
        playerState: playerState.primary,
        frustrationScore: playerState.frustrationScore,
        boredomScore: playerState.boredomScore,
        flowScore: flowMetrics.flowScore,
        successRate: flowMetrics.successRate,
        skillLevel: flowMetrics.skillLevel,
        antiFrustrationFeatures: antiFrustrationStatus
      });

    } catch (error) {
      logger.error('Player state analysis error:', error);
      next(error);
    }
  }
);

/**
 * Get difficulty analytics and transparency report
 */
router.get('/analytics/:sessionId',
  [
    param('sessionId').isUUID()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId } = req.params;

      // Verify session ownership
      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Generate analytics
      const combatAnalytics = await combatController.generateCombatAnalytics(sessionId);
      const transparencyReport = await transparencyManager.generateTransparencyReport(sessionId);
      const interventionAnalytics = await antiFrustrationSystem.generateInterventionAnalytics(sessionId);

      res.json({
        combat: combatAnalytics,
        transparency: transparencyReport,
        interventions: interventionAnalytics,
        summary: {
          totalEncounters: combatAnalytics.totalEncounters,
          averageFlowScore: combatAnalytics.flowStateTime || 0,
          interventionRate: interventionAnalytics.totalInterventions / Math.max(combatAnalytics.totalEncounters, 1),
          transparencyRatio: transparencyReport.transparencyMetrics?.averageTransparencyRatio || 0
        }
      });

    } catch (error) {
      logger.error('Analytics generation error:', error);
      next(error);
    }
  }
);

/**
 * Update transparency preferences
 */
router.post('/transparency/preferences',
  [
    body('sessionId').isUUID(),
    body('preference').isIn(['full', 'balanced', 'minimal', 'immersive'])
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, preference } = req.body;

      // Verify session ownership
      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Update preference
      const result = await transparencyManager.setPlayerTransparencyPreference(sessionId, preference);

      res.json(result);

    } catch (error) {
      logger.error('Transparency preference update error:', error);
      next(error);
    }
  }
);

/**
 * Force anti-frustration intervention (for testing or emergency)
 */
router.post('/intervention/activate',
  [
    body('sessionId').isUUID(),
    body('level').optional().isIn(['mild', 'moderate', 'severe', 'critical'])
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, level = 'moderate' } = req.body;

      // Verify session ownership
      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Get current player state
      const playerMetrics = await difficultyAgent.getPlayerMetrics(sessionId);
      const playerState = await difficultyAgent.detectPlayerState(sessionId, {}, playerMetrics);

      // Force intervention
      const interventionResult = await antiFrustrationSystem.activateIntervention(
        sessionId,
        level === 'critical' ? 0.9 : level === 'severe' ? 0.8 : level === 'moderate' ? 0.6 : 0.4,
        playerState,
        { forced: true, level }
      );

      res.json({
        activated: interventionResult.activated,
        level: interventionResult.level,
        interventions: interventionResult.interventions
      });

    } catch (error) {
      logger.error('Forced intervention error:', error);
      next(error);
    }
  }
);

/**
 * Get system health and status
 */
router.get('/system/status',
  async (req, res, next) => {
    try {
      const status = {
        services: {
          difficultyAgent: 'operational',
          stateDetector: 'operational',
          combatController: 'operational',
          antiFrustrationSystem: 'operational',
          transparencyManager: 'operational'
        },
        version: '1.0.0',
        lastUpdate: new Date().toISOString(),
        features: {
          flowTheoryImplementation: true,
          frustrationDetection: true,
          boredomDetection: true,
          multidimensionalAdjustments: true,
          transparencySystem: true,
          antiFrustrationFeatures: true
        }
      };

      res.json(status);

    } catch (error) {
      logger.error('System status error:', error);
      next(error);
    }
  }
);

/**
 * Helper function to calculate difficulty level
 */
async function calculateDifficultyLevel(difficulty) {
  const factors = [
    difficulty.enemy_health_multiplier || 1,
    difficulty.enemy_damage_multiplier || 1,
    difficulty.enemy_ai_complexity || 1,
    difficulty.spawn_rate_multiplier || 1
  ];

  const averageDifficulty = factors.reduce((sum, factor) => sum + factor, 0) / factors.length;

  if (averageDifficulty < 0.8) return 'Very Easy';
  if (averageDifficulty < 0.9) return 'Easy';
  if (averageDifficulty < 1.1) return 'Normal';
  if (averageDifficulty < 1.3) return 'Hard';
  if (averageDifficulty < 1.6) return 'Very Hard';
  return 'Extreme';
}

module.exports = router;