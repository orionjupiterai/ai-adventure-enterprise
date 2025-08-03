const express = require('express');
const { body, validationResult } = require('express-validator');
const { GameSession, World, SaveGame } = require('../../models');
const { redis } = require('../../config/redis');
const logger = require('../../utils/logger');

const router = express.Router();

// Start new game session
router.post('/start',
  [
    body('worldId').isUUID(),
    body('sessionName').optional().isLength({ max: 255 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { worldId, sessionName } = req.body;

      // Get world data
      const world = await World.findByPk(worldId);
      if (!world) {
        return res.status(404).json({ error: 'World not found' });
      }

      // Check access
      if (!world.is_public && world.author_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Create game session
      const session = await GameSession.create({
        user_id: req.user.id,
        world_id: worldId,
        session_name: sessionName || `${world.name} - ${new Date().toLocaleDateString()}`,
        current_location: world.world_data.startLocation,
        game_state: {},
        inventory: [],
        stats: {
          moves: 0,
          startTime: new Date(),
          achievements: []
        }
      });

      // Cache session data in Redis for fast access
      await redis.setex(
        `session:${session.id}`,
        3600, // 1 hour TTL
        JSON.stringify({
          worldData: world.world_data,
          currentLocation: session.current_location,
          inventory: session.inventory,
          gameState: session.game_state
        })
      );

      logger.info(`Game session started: ${session.id} for user ${req.user.username}`);

      res.json({
        sessionId: session.id,
        sessionName: session.session_name,
        currentLocation: session.current_location,
        locationData: world.world_data.locations[session.current_location],
        worldInfo: world.world_data.worldInfo
      });
    } catch (error) {
      next(error);
    }
  }
);

// Continue existing game session
router.get('/continue/:sessionId', async (req, res, next) => {
  try {
    const session = await GameSession.findOne({
      where: {
        id: req.params.sessionId,
        user_id: req.user.id,
        is_active: true
      },
      include: [{
        model: World,
        as: 'world'
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Game session not found' });
    }

    // Try to get from cache first
    let sessionData = await redis.get(`session:${session.id}`);
    
    if (!sessionData) {
      // Rebuild cache
      sessionData = {
        worldData: session.world.world_data,
        currentLocation: session.current_location,
        inventory: session.inventory,
        gameState: session.game_state
      };
      
      await redis.setex(
        `session:${session.id}`,
        3600,
        JSON.stringify(sessionData)
      );
    } else {
      sessionData = JSON.parse(sessionData);
    }

    // Update last played
    session.last_played_at = new Date();
    await session.save();

    res.json({
      sessionId: session.id,
      sessionName: session.session_name,
      currentLocation: sessionData.currentLocation,
      locationData: sessionData.worldData.locations[sessionData.currentLocation],
      inventory: sessionData.inventory,
      gameState: sessionData.gameState,
      stats: session.stats
    });
  } catch (error) {
    next(error);
  }
});

// Get user's game sessions
router.get('/sessions', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    const offset = (page - 1) * limit;

    const where = { user_id: req.user.id };
    if (active !== undefined) {
      where.is_active = active === 'true';
    }

    const sessions = await GameSession.findAndCountAll({
      where,
      include: [{
        model: World,
        as: 'world',
        attributes: ['id', 'name', 'description', 'thumbnail_url']
      }],
      order: [['last_played_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      sessions: sessions.rows,
      total: sessions.count,
      page: parseInt(page),
      totalPages: Math.ceil(sessions.count / limit)
    });
  } catch (error) {
    next(error);
  }
});

// Perform game action
router.post('/action',
  [
    body('sessionId').isUUID(),
    body('action').isIn(['move', 'examine', 'use', 'take', 'talk', 'special']),
    body('target').notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, action, target } = req.body;

      // Get session from cache
      let sessionData = await redis.get(`session:${sessionId}`);
      if (!sessionData) {
        return res.status(404).json({ error: 'Session expired or not found' });
      }

      sessionData = JSON.parse(sessionData);
      
      // Get session from DB for validation
      const session = await GameSession.findOne({
        where: {
          id: sessionId,
          user_id: req.user.id,
          is_active: true
        }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      let result = {
        success: true,
        currentLocation: sessionData.currentLocation,
        message: null,
        inventoryUpdate: null,
        stateUpdate: null
      };

      // Process action
      switch (action) {
        case 'move':
          if (sessionData.worldData.locations[target]) {
            sessionData.currentLocation = target;
            result.currentLocation = target;
            result.locationData = sessionData.worldData.locations[target];
            
            // Update session stats
            session.stats.moves = (session.stats.moves || 0) + 1;
          } else {
            result.success = false;
            result.message = 'Invalid location';
          }
          break;

        case 'examine':
        case 'special':
          const specialAction = sessionData.worldData.specialActions?.[target];
          if (specialAction) {
            result.message = specialAction;
            
            // Handle item collection
            if (sessionData.worldData.items?.[target] && !sessionData.inventory.find(item => item.id === target)) {
              const item = { ...sessionData.worldData.items[target], id: target };
              sessionData.inventory.push(item);
              result.inventoryUpdate = item;
            }
          } else {
            result.message = 'You examine it closely...';
          }
          break;

        case 'use':
          // Check if item is in inventory
          const item = sessionData.inventory.find(i => i.id === target);
          if (!item) {
            result.success = false;
            result.message = 'You don\'t have that item';
          } else {
            result.message = `You use the ${item.name}`;
            // Additional use logic can be implemented here
          }
          break;

        case 'take':
          if (sessionData.worldData.items?.[target] && !sessionData.inventory.find(item => item.id === target)) {
            const item = { ...sessionData.worldData.items[target], id: target };
            sessionData.inventory.push(item);
            result.inventoryUpdate = item;
            result.message = `You take the ${item.name}`;
          } else {
            result.success = false;
            result.message = 'You can\'t take that';
          }
          break;
      }

      // Update cache
      await redis.setex(
        `session:${sessionId}`,
        3600,
        JSON.stringify(sessionData)
      );

      // Update database
      session.current_location = sessionData.currentLocation;
      session.inventory = sessionData.inventory;
      session.game_state = sessionData.gameState;
      session.last_played_at = new Date();
      await session.save();

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Save game
router.post('/save',
  [
    body('sessionId').isUUID(),
    body('saveName').notEmpty().isLength({ max: 255 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, saveName } = req.body;

      const session = await GameSession.findOne({
        where: {
          id: sessionId,
          user_id: req.user.id
        }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      const saveGame = await SaveGame.create({
        session_id: sessionId,
        user_id: req.user.id,
        save_name: saveName,
        save_data: {
          current_location: session.current_location,
          inventory: session.inventory,
          game_state: session.game_state,
          stats: session.stats
        }
      });

      logger.info(`Game saved: ${saveName} for user ${req.user.username}`);

      res.json({
        saveId: saveGame.id,
        message: 'Game saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Load saved game
router.post('/load/:saveId', async (req, res, next) => {
  try {
    const saveGame = await SaveGame.findOne({
      where: {
        id: req.params.saveId,
        user_id: req.user.id
      },
      include: [{
        model: GameSession,
        as: 'session',
        include: [{
          model: World,
          as: 'world'
        }]
      }]
    });

    if (!saveGame) {
      return res.status(404).json({ error: 'Save game not found' });
    }

    // Update session with saved data
    const session = saveGame.session;
    session.current_location = saveGame.save_data.current_location;
    session.inventory = saveGame.save_data.inventory;
    session.game_state = saveGame.save_data.game_state;
    session.stats = saveGame.save_data.stats;
    session.last_played_at = new Date();
    await session.save();

    // Update cache
    await redis.setex(
      `session:${session.id}`,
      3600,
      JSON.stringify({
        worldData: session.world.world_data,
        currentLocation: session.current_location,
        inventory: session.inventory,
        gameState: session.game_state
      })
    );

    res.json({
      sessionId: session.id,
      sessionName: session.session_name,
      currentLocation: session.current_location,
      locationData: session.world.world_data.locations[session.current_location],
      inventory: session.inventory,
      gameState: session.game_state,
      stats: session.stats
    });
  } catch (error) {
    next(error);
  }
});

// Get saved games
router.get('/saves', async (req, res, next) => {
  try {
    const saves = await SaveGame.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: GameSession,
        as: 'session',
        include: [{
          model: World,
          as: 'world',
          attributes: ['id', 'name']
        }]
      }],
      order: [['created_at', 'DESC']]
    });

    res.json(saves);
  } catch (error) {
    next(error);
  }
});

module.exports = router;