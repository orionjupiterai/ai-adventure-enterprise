/**
 * Prestige System API Routes
 * RESTful endpoints for prestige system management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authentication');
const { validateRequest } = require('../../middleware/validation');
const PrestigeService = require('../../services/PrestigeService');
const GMEPComplianceMonitor = require('../../services/GMEPComplianceMonitor');
const PrestigeRewardSeeder = require('../../services/PrestigeRewardSeeder');
const { body, param, query } = require('express-validator');

// Initialize services
const prestigeService = new PrestigeService();
const complianceMonitor = new GMEPComplianceMonitor();
const rewardSeeder = new PrestigeRewardSeeder();

/**
 * GET /api/prestige/status
 * Get comprehensive prestige status for authenticated user
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await prestigeService.getPrestigeStatus(userId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching prestige status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prestige status'
    });
  }
});

/**
 * POST /api/prestige/initialize
 * Initialize prestige system for a level 100+ player
 */
router.post('/initialize', 
  authenticate,
  [
    body('playerLevel').isInt({ min: 100 }).withMessage('Player must be level 100 or higher')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { playerLevel } = req.body;
      
      const prestigeSystem = await prestigeService.initializePlayerPrestige(userId, playerLevel);
      
      res.json({
        success: true,
        data: prestigeSystem,
        message: 'Prestige system initialized successfully'
      });
    } catch (error) {
      console.error('Error initializing prestige:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * POST /api/prestige/award-points
 * Award prestige points for activities (internal use or admin)
 */
router.post('/award-points',
  authenticate,
  [
    body('activity').isString().notEmpty().withMessage('Activity is required'),
    body('points').isInt({ min: 1, max: 100 }).withMessage('Points must be between 1 and 100'),
    body('context').optional().isObject()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { activity, points, context = {} } = req.body;
      
      // GMEP compliance check
      const compliance = prestigeService.validateGMEPCompliance(activity, points, userId);
      if (!compliance.compliant) {
        return res.status(400).json({
          success: false,
          error: 'GMEP compliance violation',
          reason: compliance.reason
        });
      }

      const result = await prestigeService.awardPrestigePoints(
        userId, 
        activity, 
        compliance.adjustedPoints || points, 
        context
      );
      
      // Track with compliance monitor
      complianceMonitor.trackPrestigePoints(userId, result.pointsAwarded, activity);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error awarding prestige points:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to award prestige points'
      });
    }
  }
);

/**
 * POST /api/prestige/advance
 * Handle prestige advancement (reset to level 1 with increased prestige level)
 */
router.post('/advance', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await prestigeService.handlePrestigeAdvancement(userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error handling prestige advancement:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prestige/seasonal-tracks
 * Get seasonal track progress for authenticated user
 */
router.get('/seasonal-tracks', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await prestigeService.getPrestigeStatus(userId);
    
    if (!status.enrolled) {
      return res.status(404).json({
        success: false,
        error: 'Player not enrolled in prestige system'
      });
    }
    
    res.json({
      success: true,
      data: {
        seasonalTracks: status.seasonalTracks,
        currentSeason: status.currentSeason,
        seasonProgress: status.seasonProgress
      }
    });
  } catch (error) {
    console.error('Error fetching seasonal tracks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch seasonal tracks'
    });
  }
});

/**
 * GET /api/prestige/leaderboards
 * Get prestige leaderboards
 */
router.get('/leaderboards',
  [
    query('limit').optional().isInt({ min: 10, max: 100 }).withMessage('Limit must be between 10 and 100')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const leaderboards = await prestigeService.getPrestigeLeaderboards(limit);
      
      res.json({
        success: true,
        data: leaderboards
      });
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboards'
      });
    }
  }
);

/**
 * GET /api/prestige/rewards
 * Get available prestige rewards based on player's progress
 */
router.get('/rewards', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await prestigeService.getPrestigeStatus(userId);
    
    if (!status.enrolled) {
      return res.status(404).json({
        success: false,
        error: 'Player not enrolled in prestige system'
      });
    }

    // Get tier-specific rewards
    const tierRewards = await prestigeService.getTierRewards(status.tier);
    
    res.json({
      success: true,
      data: {
        currentTier: status.tier,
        tierRewards: tierRewards.map(reward => reward.getDisplayInfo()),
        unlockedContent: status.unlockedContent
      }
    });
  } catch (error) {
    console.error('Error fetching prestige rewards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prestige rewards'
    });
  }
});

/**
 * GET /api/prestige/compliance-report
 * Get GMEP compliance report for authenticated user
 */
router.get('/compliance-report', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const report = complianceMonitor.getPlayerComplianceReport(userId);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance report'
    });
  }
});

/**
 * POST /api/prestige/session/start
 * Start a monitored gaming session
 */
router.post('/session/start', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const session = complianceMonitor.startSession(userId, req.body);
    
    res.json({
      success: true,
      data: session,
      message: 'Gaming session started'
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session'
    });
  }
});

/**
 * POST /api/prestige/session/activity
 * Update session activity
 */
router.post('/session/activity',
  authenticate,
  [
    body('activity').isString().notEmpty().withMessage('Activity is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { activity } = req.body;
      
      complianceMonitor.updateSessionActivity(userId, activity);
      
      res.json({
        success: true,
        message: 'Session activity updated'
      });
    } catch (error) {
      console.error('Error updating session activity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update session activity'
      });
    }
  }
);

/**
 * POST /api/prestige/session/end
 * End a gaming session
 */
router.post('/session/end', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const session = complianceMonitor.endSession(userId);
    
    res.json({
      success: true,
      data: session,
      message: 'Gaming session ended'
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
});

// Admin routes (require admin authentication)
/**
 * POST /api/prestige/admin/start-season
 * Start a new prestige season (admin only)
 */
router.post('/admin/start-season',
  authenticate,
  // Add admin check middleware here
  [
    body('seasonConfig').isObject().withMessage('Season config is required'),
    body('seasonConfig.id').isString().notEmpty(),
    body('seasonConfig.name').isString().notEmpty(),
    body('seasonConfig.startDate').isISO8601(),
    body('seasonConfig.endDate').isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user.is_admin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { seasonConfig } = req.body;
      await prestigeService.startNewSeason(seasonConfig);
      
      res.json({
        success: true,
        data: seasonConfig,
        message: 'New season started successfully'
      });
    } catch (error) {
      console.error('Error starting new season:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start new season'
      });
    }
  }
);

/**
 * POST /api/prestige/admin/seed-rewards
 * Seed prestige rewards (admin only, development use)
 */
router.post('/admin/seed-rewards', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const rewards = await rewardSeeder.seedAllRewards();
    
    res.json({
      success: true,
      data: {
        rewardsCreated: rewards.length
      },
      message: 'Prestige rewards seeded successfully'
    });
  } catch (error) {
    console.error('Error seeding rewards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed rewards'
    });
  }
});

/**
 * GET /api/prestige/admin/system-metrics
 * Get system-wide compliance metrics (admin only)
 */
router.get('/admin/system-metrics', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const metrics = complianceMonitor.getSystemComplianceMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system metrics'
    });
  }
});

module.exports = router;