const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { MultiplayerRoom, RoomParticipant, World, User } = require('../../models');
const { redis } = require('../../config/redis');
const logger = require('../../utils/logger');

const router = express.Router();

// Create multiplayer room
router.post('/rooms',
  [
    body('worldId').isUUID(),
    body('roomName').optional().isLength({ max: 255 }),
    body('maxPlayers').optional().isInt({ min: 2, max: 10 }),
    body('isPrivate').optional().isBoolean()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { worldId, roomName, maxPlayers = 4, isPrivate = false } = req.body;

      // Verify world exists
      const world = await World.findByPk(worldId);
      if (!world) {
        return res.status(404).json({ error: 'World not found' });
      }

      // Generate unique room code
      let roomCode;
      let attempts = 0;
      do {
        roomCode = MultiplayerRoom.generateRoomCode();
        const existing = await MultiplayerRoom.findOne({ where: { room_code: roomCode } });
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        return res.status(500).json({ error: 'Failed to generate room code' });
      }

      // Create room
      const room = await MultiplayerRoom.create({
        world_id: worldId,
        host_id: req.user.id,
        room_code: roomCode,
        room_name: roomName || `${req.user.display_name || req.user.username}'s Room`,
        max_players: maxPlayers,
        current_players: 1,
        is_private: isPrivate,
        game_state: {
          players: {},
          currentLocation: world.world_data.startLocation
        }
      });

      // Add host as participant
      await RoomParticipant.create({
        room_id: room.id,
        user_id: req.user.id,
        player_state: {
          location: world.world_data.startLocation,
          inventory: [],
          ready: false
        }
      });

      // Cache room data
      await redis.setex(
        `room:${room.id}`,
        3600 * 4, // 4 hours TTL
        JSON.stringify({
          worldData: world.world_data,
          gameState: room.game_state,
          players: [{ id: req.user.id, username: req.user.username }]
        })
      );

      logger.info(`Multiplayer room created: ${roomCode} by user ${req.user.username}`);

      res.status(201).json({
        room,
        worldData: world.world_data
      });
    } catch (error) {
      next(error);
    }
  }
);

// Join multiplayer room
router.post('/rooms/join',
  [
    body('roomCode').notEmpty().isLength({ min: 6, max: 6 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { roomCode } = req.body;

      // Find room
      const room = await MultiplayerRoom.findOne({
        where: {
          room_code: roomCode.toUpperCase(),
          is_active: true
        },
        include: [
          {
            model: World,
            as: 'world'
          },
          {
            model: RoomParticipant,
            as: 'participants',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'display_name', 'avatar_url']
            }]
          }
        ]
      });

      if (!room) {
        return res.status(404).json({ error: 'Room not found or inactive' });
      }

      // Check if room is full
      if (room.current_players >= room.max_players) {
        return res.status(400).json({ error: 'Room is full' });
      }

      // Check if already in room
      const existingParticipant = room.participants.find(p => p.user_id === req.user.id && !p.left_at);
      if (existingParticipant) {
        return res.status(400).json({ error: 'Already in this room' });
      }

      // Add participant
      await RoomParticipant.create({
        room_id: room.id,
        user_id: req.user.id,
        player_state: {
          location: room.world.world_data.startLocation,
          inventory: [],
          ready: false
        }
      });

      // Update player count
      room.current_players += 1;
      await room.save();

      // Update cache
      const cachedData = await redis.get(`room:${room.id}`);
      if (cachedData) {
        const data = JSON.parse(cachedData);
        data.players.push({ id: req.user.id, username: req.user.username });
        await redis.setex(`room:${room.id}`, 3600 * 4, JSON.stringify(data));
      }

      logger.info(`User ${req.user.username} joined room ${roomCode}`);

      res.json({
        room,
        worldData: room.world.world_data
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get active rooms
router.get('/rooms', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, showPrivate = false } = req.query;
    const offset = (page - 1) * limit;

    const where = { is_active: true };
    if (showPrivate !== 'true') {
      where.is_private = false;
    }

    const rooms = await MultiplayerRoom.findAndCountAll({
      where,
      include: [
        {
          model: World,
          as: 'world',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'host',
          attributes: ['id', 'username', 'display_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      rooms: rooms.rows,
      total: rooms.count,
      page: parseInt(page),
      totalPages: Math.ceil(rooms.count / limit)
    });
  } catch (error) {
    next(error);
  }
});

// Get room details
router.get('/rooms/:roomId', async (req, res, next) => {
  try {
    const room = await MultiplayerRoom.findOne({
      where: {
        id: req.params.roomId,
        is_active: true
      },
      include: [
        {
          model: World,
          as: 'world'
        },
        {
          model: RoomParticipant,
          as: 'participants',
          where: { left_at: null },
          required: false,
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'display_name', 'avatar_url']
          }]
        }
      ]
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is participant
    const isParticipant = room.participants.some(p => p.user_id === req.user.id);
    if (!isParticipant && room.is_private) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(room);
  } catch (error) {
    next(error);
  }
});

// Leave room
router.post('/rooms/:roomId/leave', async (req, res, next) => {
  try {
    const room = await MultiplayerRoom.findByPk(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const participant = await RoomParticipant.findOne({
      where: {
        room_id: room.id,
        user_id: req.user.id,
        left_at: null
      }
    });

    if (!participant) {
      return res.status(400).json({ error: 'Not in this room' });
    }

    // Mark participant as left
    participant.left_at = new Date();
    await participant.save();

    // Update player count
    room.current_players = Math.max(0, room.current_players - 1);
    
    // If host leaves, close the room
    if (room.host_id === req.user.id) {
      room.is_active = false;
    }
    
    await room.save();

    logger.info(`User ${req.user.username} left room ${room.room_code}`);

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    next(error);
  }
});

// Update player state
router.put('/rooms/:roomId/state',
  [
    body('playerState').notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const participant = await RoomParticipant.findOne({
        where: {
          room_id: req.params.roomId,
          user_id: req.user.id,
          left_at: null
        }
      });

      if (!participant) {
        return res.status(404).json({ error: 'Not in this room' });
      }

      participant.player_state = { ...participant.player_state, ...req.body.playerState };
      await participant.save();

      res.json({ message: 'State updated' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;