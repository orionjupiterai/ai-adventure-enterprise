const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { 
  User, World, GameSession, SaveGame, WorldRating, 
  Achievement, UserAchievement, MultiplayerRoom, RoomParticipant, AIContent,
  PrestigeSystem, SeasonalTrack, PrestigeReward
} = require('../../models');
const { redis } = require('../../config/redis');
const OpenAI = require('openai');
const PrestigeService = require('../../services/PrestigeService');
const GMEPComplianceMonitor = require('../../services/GMEPComplianceMonitor');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize prestige services
const prestigeService = new PrestigeService();
const complianceMonitor = new GMEPComplianceMonitor();

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '7d' }
  );
};

const requireAuth = (context) => {
  if (!context.user) {
    throw new AuthenticationError('Authentication required');
  }
  return context.user;
};

const resolvers = {
  Query: {
    // User queries
    me: async (_, __, context) => {
      return requireAuth(context);
    },

    user: async (_, { id }) => {
      return User.findByPk(id);
    },

    users: async (_, { page = 1, limit = 50 }, context) => {
      requireAuth(context);
      if (!context.user.is_admin) {
        throw new ForbiddenError('Admin access required');
      }

      const offset = (page - 1) * limit;
      const users = await User.findAll({
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });
      return users;
    },

    // World queries
    world: async (_, { id }, context) => {
      const world = await World.findByPk(id);
      
      if (!world) {
        throw new UserInputError('World not found');
      }

      if (!world.is_public && (!context.user || (context.user.id !== world.author_id && !context.user.is_admin))) {
        throw new ForbiddenError('Access denied');
      }

      return world;
    },

    worlds: async (_, args) => {
      const { page = 1, limit = 20, search, tags, sortBy = 'created_at', order = 'DESC', featured } = args;
      const offset = (page - 1) * limit;
      const where = { is_public: true };

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (tags && tags.length > 0) {
        where.tags = { [Op.overlap]: tags };
      }

      if (featured !== undefined) {
        where.is_featured = featured;
      }

      const result = await World.findAndCountAll({
        where,
        order: [[sortBy, order]],
        limit,
        offset
      });

      return {
        worlds: result.rows,
        total: result.count,
        page,
        totalPages: Math.ceil(result.count / limit)
      };
    },

    myWorlds: async (_, { page = 1, limit = 20 }, context) => {
      const user = requireAuth(context);
      const offset = (page - 1) * limit;

      const result = await World.findAndCountAll({
        where: { author_id: user.id },
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return {
        worlds: result.rows,
        total: result.count,
        page,
        totalPages: Math.ceil(result.count / limit)
      };
    },

    // Game session queries
    gameSession: async (_, { id }, context) => {
      const user = requireAuth(context);
      
      const session = await GameSession.findOne({
        where: { 
          id,
          [Op.or]: [
            { user_id: user.id },
            { '$world.author_id$': user.id }
          ]
        },
        include: [{ model: World, as: 'world' }]
      });

      if (!session) {
        throw new UserInputError('Game session not found');
      }

      return session;
    },

    mySessions: async (_, { page = 1, limit = 20, active }, context) => {
      const user = requireAuth(context);
      const offset = (page - 1) * limit;
      const where = { user_id: user.id };

      if (active !== undefined) {
        where.is_active = active;
      }

      const result = await GameSession.findAndCountAll({
        where,
        order: [['last_played_at', 'DESC']],
        limit,
        offset
      });

      return {
        sessions: result.rows,
        total: result.count,
        page,
        totalPages: Math.ceil(result.count / limit)
      };
    },

    // Other queries
    mySaves: async (_, __, context) => {
      const user = requireAuth(context);
      return SaveGame.findAll({
        where: { user_id: user.id },
        order: [['created_at', 'DESC']]
      });
    },

    multiplayerRoom: async (_, { id }, context) => {
      const room = await MultiplayerRoom.findByPk(id, {
        include: [
          { model: World, as: 'world' },
          { model: User, as: 'host' },
          { 
            model: RoomParticipant, 
            as: 'participants',
            where: { left_at: null },
            required: false
          }
        ]
      });

      if (!room) {
        throw new UserInputError('Room not found');
      }

      // Check access for private rooms
      if (room.is_private && context.user) {
        const isParticipant = room.participants.some(p => p.user_id === context.user.id);
        if (!isParticipant && room.host_id !== context.user.id) {
          throw new ForbiddenError('Access denied');
        }
      }

      return room;
    },

    activeRooms: async (_, { page = 1, limit = 20, showPrivate = false }) => {
      const offset = (page - 1) * limit;
      const where = { is_active: true };
      
      if (!showPrivate) {
        where.is_private = false;
      }

      return MultiplayerRoom.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
    },

    achievements: async () => {
      return Achievement.findAll({
        order: [['category', 'ASC'], ['points', 'ASC']]
      });
    },

    myAchievements: async (_, __, context) => {
      const user = requireAuth(context);
      return UserAchievement.findAll({
        where: { user_id: user.id },
        order: [['earned_at', 'DESC']]
      });
    },

    // Prestige system queries
    prestigeStatus: async (_, __, context) => {
      const user = requireAuth(context);
      return await prestigeService.getPrestigeStatus(user.id);
    },

    seasonalTracks: async (_, __, context) => {
      const user = requireAuth(context);
      return await SeasonalTrack.findAll({
        where: { user_id: user.id },
        order: [['track_type', 'ASC']]
      });
    },

    prestigeLeaderboards: async (_, { limit = 50 }) => {
      return await prestigeService.getPrestigeLeaderboards(limit);
    },

    prestigeRewards: async (_, { tier }, context) => {
      const filters = tier ? { 'unlock_requirements.tier': tier.toLowerCase() } : {};
      return await PrestigeReward.findAll({
        where: filters,
        order: [['rarity', 'ASC'], ['sort_order', 'ASC']]
      });
    },

    complianceReport: async (_, __, context) => {
      const user = requireAuth(context);
      return complianceMonitor.getPlayerComplianceReport(user.id);
    },

    systemComplianceMetrics: async (_, __, context) => {
      const user = requireAuth(context);
      if (!user.is_admin) {
        throw new ForbiddenError('Admin access required');
      }
      return complianceMonitor.getSystemComplianceMetrics();
    },

    aiUsageStats: async (_, __, context) => {
      const user = requireAuth(context);
      
      const usage = await AIContent.findAll({
        attributes: [
          'content_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('tokens_used')), 'total_tokens']
        ],
        where: {
          session_id: {
            [Op.in]: sequelize.literal(
              `(SELECT id FROM game_sessions WHERE user_id = '${user.id}')`
            )
          }
        },
        group: ['content_type'],
        raw: true
      });

      const totalTokens = usage.reduce((sum, item) => sum + (parseInt(item.total_tokens) || 0), 0);
      const estimatedCost = (totalTokens / 1000) * 0.03;

      return {
        usage,
        totalTokens,
        estimatedCost
      };
    }
  },

  Mutation: {
    // Auth mutations
    register: async (_, { username, email, password, displayName }) => {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email }]
        }
      });

      if (existingUser) {
        throw new UserInputError(
          existingUser.username === username ? 'Username already taken' : 'Email already registered'
        );
      }

      const user = await User.create({
        username,
        email,
        password_hash: password,
        display_name: displayName || username
      });

      const token = generateToken(user.id);

      return { user, token };
    },

    login: async (_, { username, email, password }) => {
      if (!username && !email) {
        throw new UserInputError('Username or email required');
      }

      const user = await User.findOne({
        where: username ? { username } : { email }
      });

      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        throw new AuthenticationError('Invalid credentials');
      }

      if (!user.is_active) {
        throw new ForbiddenError('Account is deactivated');
      }

      const token = generateToken(user.id);

      return { user, token };
    },

    changePassword: async (_, { currentPassword, newPassword }, context) => {
      const user = requireAuth(context);
      const fullUser = await User.findByPk(user.id);

      const isValidPassword = await fullUser.validatePassword(currentPassword);
      if (!isValidPassword) {
        throw new AuthenticationError('Current password is incorrect');
      }

      fullUser.password_hash = newPassword;
      await fullUser.save();

      return true;
    },

    // World mutations
    createWorld: async (_, args, context) => {
      const user = requireAuth(context);
      const { name, description, worldData, tags, isPublic = true } = args;

      if (!worldData.worldInfo || !worldData.locations || !worldData.startLocation) {
        throw new UserInputError('Invalid world data structure');
      }

      const world = await World.create({
        name,
        description,
        author_id: user.id,
        world_data: worldData,
        tags: tags || [],
        is_public: isPublic,
        version: worldData.worldInfo.version || '1.0.0'
      });

      return world;
    },

    updateWorld: async (_, { id, ...updates }, context) => {
      const user = requireAuth(context);
      const world = await World.findByPk(id);

      if (!world) {
        throw new UserInputError('World not found');
      }

      if (world.author_id !== user.id && !user.is_admin) {
        throw new ForbiddenError('Access denied');
      }

      if (updates.worldData) {
        if (!updates.worldData.worldInfo || !updates.worldData.locations || !updates.worldData.startLocation) {
          throw new UserInputError('Invalid world data structure');
        }
      }

      await world.update(updates);
      return world;
    },

    deleteWorld: async (_, { id }, context) => {
      const user = requireAuth(context);
      const world = await World.findByPk(id);

      if (!world) {
        throw new UserInputError('World not found');
      }

      if (world.author_id !== user.id && !user.is_admin) {
        throw new ForbiddenError('Access denied');
      }

      await world.destroy();
      return true;
    },

    // Game mutations
    startGame: async (_, { worldId, sessionName }, context) => {
      const user = requireAuth(context);
      const world = await World.findByPk(worldId);

      if (!world) {
        throw new UserInputError('World not found');
      }

      if (!world.is_public && world.author_id !== user.id) {
        throw new ForbiddenError('Access denied');
      }

      const session = await GameSession.create({
        user_id: user.id,
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

      // Cache session data
      await redis.setex(
        `session:${session.id}`,
        3600,
        JSON.stringify({
          worldData: world.world_data,
          currentLocation: session.current_location,
          inventory: session.inventory,
          gameState: session.game_state
        })
      );

      return session;
    },

    // Prestige system mutations
    initializePrestige: async (_, { playerLevel }, context) => {
      const user = requireAuth(context);
      
      try {
        const prestigeSystem = await prestigeService.initializePlayerPrestige(user.id, playerLevel);
        return prestigeSystem;
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    awardPrestigePoints: async (_, { activity, points, context: activityContext }, context) => {
      const user = requireAuth(context);
      
      try {
        // GMEP compliance check
        const compliance = prestigeService.validateGMEPCompliance(activity, points, user.id);
        if (!compliance.compliant) {
          return {
            success: false,
            reason: compliance.reason
          };
        }

        const result = await prestigeService.awardPrestigePoints(
          user.id,
          activity,
          compliance.adjustedPoints || points,
          activityContext || {}
        );

        // Track with compliance monitor
        complianceMonitor.trackPrestigePoints(user.id, result.pointsAwarded, activity);

        return result;
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    advancePrestige: async (_, __, context) => {
      const user = requireAuth(context);
      
      try {
        const result = await prestigeService.handlePrestigeAdvancement(user.id);
        return result;
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    startSession: async (_, { sessionData }, context) => {
      const user = requireAuth(context);
      
      try {
        complianceMonitor.startSession(user.id, sessionData || {});
        return true;
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    updateSessionActivity: async (_, { activity }, context) => {
      const user = requireAuth(context);
      
      try {
        complianceMonitor.updateSessionActivity(user.id, activity);
        return true;
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    endSession: async (_, __, context) => {
      const user = requireAuth(context);
      
      try {
        complianceMonitor.endSession(user.id);
        return true;
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    // AI mutations
    generateStory: async (_, { sessionId, prompt, context: aiContext }, context) => {
      const user = requireAuth(context);
      
      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: user.id },
        include: [{ model: World, as: 'world' }]
      });

      if (!session) {
        throw new UserInputError('Game session not found');
      }

      const systemPrompt = `You are a creative storyteller for a choose-your-own-adventure game. 
        The game world is: ${session.world.name}. 
        Current location: ${session.current_location}.
        Generate engaging, immersive story content.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.8
      });

      const generatedContent = completion.choices[0].message.content;

      await AIContent.create({
        world_id: session.world_id,
        session_id: sessionId,
        content_type: 'story',
        prompt,
        generated_content: generatedContent,
        metadata: { context: aiContext },
        tokens_used: completion.usage.total_tokens
      });

      return generatedContent;
    }
  },

  // Type resolvers
  User: {
    worlds: async (user) => {
      return World.findAll({ where: { author_id: user.id } });
    },
    gameSessions: async (user) => {
      return GameSession.findAll({ where: { user_id: user.id } });
    },
    achievements: async (user) => {
      return UserAchievement.findAll({ where: { user_id: user.id } });
    }
  },

  World: {
    author: async (world) => {
      return User.findByPk(world.author_id);
    },
    ratings: async (world) => {
      return WorldRating.findAll({ where: { world_id: world.id } });
    }
  },

  GameSession: {
    user: async (session) => {
      return User.findByPk(session.user_id);
    },
    world: async (session) => {
      return World.findByPk(session.world_id);
    },
    saves: async (session) => {
      return SaveGame.findAll({ where: { session_id: session.id } });
    }
  },

  SaveGame: {
    session: async (save) => {
      return GameSession.findByPk(save.session_id);
    },
    user: async (save) => {
      return User.findByPk(save.user_id);
    }
  },

  WorldRating: {
    world: async (rating) => {
      return World.findByPk(rating.world_id);
    },
    user: async (rating) => {
      return User.findByPk(rating.user_id);
    }
  },

  UserAchievement: {
    user: async (ua) => {
      return User.findByPk(ua.user_id);
    },
    achievement: async (ua) => {
      return Achievement.findByPk(ua.achievement_id);
    },
    world: async (ua) => {
      return ua.world_id ? World.findByPk(ua.world_id) : null;
    }
  },

  MultiplayerRoom: {
    world: async (room) => {
      return World.findByPk(room.world_id);
    },
    host: async (room) => {
      return User.findByPk(room.host_id);
    },
    participants: async (room) => {
      return RoomParticipant.findAll({ 
        where: { room_id: room.id, left_at: null } 
      });
    }
  },

  RoomParticipant: {
    room: async (participant) => {
      return MultiplayerRoom.findByPk(participant.room_id);
    },
    user: async (participant) => {
      return User.findByPk(participant.user_id);
    }
  },

  AIContent: {
    world: async (content) => {
      return World.findByPk(content.world_id);
    },
    session: async (content) => {
      return content.session_id ? GameSession.findByPk(content.session_id) : null;
    }
  },

  User: {
    worlds: async (user) => {
      return World.findAll({ where: { author_id: user.id } });
    },
    gameSessions: async (user) => {
      return GameSession.findAll({ where: { user_id: user.id } });
    },
    achievements: async (user) => {
      return UserAchievement.findAll({ where: { user_id: user.id } });
    },
    prestigeSystem: async (user) => {
      return PrestigeSystem.findOne({ where: { user_id: user.id } });
    }
  },

  PrestigeSystem: {
    user: async (prestige) => {
      return User.findByPk(prestige.user_id);
    },
    tierBenefits: (prestige) => {
      return prestige.getTierBenefits();
    },
    seasonProgress: (prestige) => {
      return prestige.getSeasonProgress();
    },
    canPrestige: (prestige) => {
      return prestige.canPrestige();
    }
  },

  SeasonalTrack: {
    user: async (track) => {
      return User.findByPk(track.user_id);
    },
    timeRemaining: (track) => {
      return track.getSeasonTimeRemaining();
    }
  }
};

module.exports = resolvers;