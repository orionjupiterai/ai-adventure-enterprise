const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, World, GameSession, UserAchievement, Achievement } = require('../../models');
const authentication = require('../../middleware/authentication');
const logger = require('../../utils/logger');

const router = express.Router();

// Get current user profile
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: World,
          as: 'worlds',
          attributes: ['id', 'name', 'play_count', 'rating_average'],
          limit: 5,
          order: [['created_at', 'DESC']]
        },
        {
          model: UserAchievement,
          as: 'achievements',
          include: [{
            model: Achievement,
            as: 'achievement'
          }],
          limit: 10,
          order: [['earned_at', 'DESC']]
        }
      ]
    });

    // Get statistics
    const stats = await Promise.all([
      World.count({ where: { author_id: req.user.id } }),
      GameSession.count({ where: { user_id: req.user.id } }),
      UserAchievement.count({ where: { user_id: req.user.id } })
    ]);

    res.json({
      user: user.toJSON(),
      stats: {
        worldsCreated: stats[0],
        gamesPlayed: stats[1],
        achievementsEarned: stats[2]
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile',
  [
    body('displayName').optional().isLength({ min: 1, max: 100 }),
    body('avatarUrl').optional().isURL(),
    body('email').optional().isEmail().normalizeEmail()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findByPk(req.user.id);

      if (req.body.displayName) user.display_name = req.body.displayName;
      if (req.body.avatarUrl) user.avatar_url = req.body.avatarUrl;
      if (req.body.email && req.body.email !== user.email) {
        // Check if email is already taken
        const existingUser = await User.findOne({ where: { email: req.body.email } });
        if (existingUser) {
          return res.status(409).json({ error: 'Email already in use' });
        }
        user.email = req.body.email;
      }

      await user.save();

      logger.info(`Profile updated for user: ${user.username}`);

      res.json({ user: user.toJSON() });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's worlds
router.get('/worlds', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const worlds = await World.findAndCountAll({
      where: { author_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      worlds: worlds.rows,
      total: worlds.count,
      page: parseInt(page),
      totalPages: Math.ceil(worlds.count / limit)
    });
  } catch (error) {
    next(error);
  }
});

// Get user's achievements
router.get('/achievements', async (req, res, next) => {
  try {
    const achievements = await UserAchievement.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Achievement,
          as: 'achievement'
        },
        {
          model: World,
          as: 'world',
          attributes: ['id', 'name']
        }
      ],
      order: [['earned_at', 'DESC']]
    });

    // Get all available achievements
    const allAchievements = await Achievement.findAll({
      order: [['category', 'ASC'], ['points', 'ASC']]
    });

    const earnedIds = achievements.map(ua => ua.achievement_id);
    const unearned = allAchievements.filter(a => !earnedIds.includes(a.id));

    res.json({
      earned: achievements,
      unearned,
      totalPoints: achievements.reduce((sum, ua) => sum + ua.achievement.points, 0)
    });
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/stats', async (req, res, next) => {
  try {
    const [
      worldsCreated,
      gamesPlayed,
      totalPlayTime,
      achievements,
      worldsPlayed
    ] = await Promise.all([
      World.count({ where: { author_id: req.user.id } }),
      GameSession.count({ where: { user_id: req.user.id } }),
      GameSession.sum('EXTRACT(EPOCH FROM (last_played_at - started_at))/3600', {
        where: { user_id: req.user.id }
      }),
      UserAchievement.count({ where: { user_id: req.user.id } }),
      GameSession.count({
        where: { user_id: req.user.id },
        distinct: true,
        col: 'world_id'
      })
    ]);

    res.json({
      worldsCreated,
      gamesPlayed,
      totalPlayTimeHours: Math.round(totalPlayTime || 0),
      achievementsEarned: achievements,
      worldsPlayed
    });
  } catch (error) {
    next(error);
  }
});

// Delete user account
router.delete('/account',
  [
    body('password').notEmpty(),
    body('confirmation').equals('DELETE_MY_ACCOUNT')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findByPk(req.user.id);

      // Validate password
      const isValidPassword = await user.validatePassword(req.body.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Soft delete - deactivate account
      user.is_active = false;
      await user.save();

      logger.info(`Account deactivated for user: ${user.username}`);

      res.json({ message: 'Account successfully deactivated' });
    } catch (error) {
      next(error);
    }
  }
);

// Admin routes
router.get('/all', 
  authentication.admin,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const users = await User.findAndCountAll({
        attributes: { exclude: ['password_hash'] },
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        users: users.rows,
        total: users.count,
        page: parseInt(page),
        totalPages: Math.ceil(users.count / limit)
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;