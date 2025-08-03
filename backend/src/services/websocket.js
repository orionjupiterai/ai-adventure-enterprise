const { User, MultiplayerRoom, RoomParticipant } = require('../models');
const { redis, realtime } = require('../config/redis');
const authentication = require('../middleware/authentication');
const logger = require('../utils/logger');

const setupSocketHandlers = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const user = await authentication.verifyToken(token);

      if (!user || !user.is_active) {
        return next(new Error('Invalid user'));
      }

      socket.userId = user.id;
      socket.user = {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        isAdmin: user.is_admin
      };
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    logger.info(`User ${socket.user.username} connected via WebSocket`);

    // Set user online status
    await realtime.setUserOnline(socket.userId, socket.id);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Send initial connection data
    socket.emit('connected', {
      user: socket.user,
      timestamp: new Date(),
      socketId: socket.id
    });

    // Handle joining game rooms
    socket.on('join_room', async (roomId) => {
      try {
        // Verify user is participant
        const participant = await RoomParticipant.findOne({
          where: {
            room_id: roomId,
            user_id: socket.userId,
            left_at: null
          }
        });

        if (!participant) {
          socket.emit('error', { message: 'Not authorized to join this room' });
          return;
        }

        // Join socket room
        socket.join(`room:${roomId}`);
        socket.roomId = roomId;

        // Notify other players
        socket.to(`room:${roomId}`).emit('player_joined', {
          user: socket.user,
          timestamp: new Date()
        });

        logger.info(`User ${socket.user.username} joined room ${roomId}`);
      } catch (error) {
        logger.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle game actions in multiplayer
    socket.on('game_action', async (data) => {
      try {
        const { action, target, sessionId } = data;

        if (!socket.roomId) {
          socket.emit('error', { message: 'Not in a room' });
          return;
        }

        // Broadcast action to all players in room
        io.to(`room:${socket.roomId}`).emit('player_action', {
          userId: socket.userId,
          username: socket.user.username,
          action,
          target,
          timestamp: new Date()
        });

        // Update room state in cache
        const roomData = await redis.get(`room:${socket.roomId}`);
        if (roomData) {
          const data = JSON.parse(roomData);
          
          // Log action in game state
          if (!data.gameState.actionLog) {
            data.gameState.actionLog = [];
          }
          
          data.gameState.actionLog.push({
            userId: socket.userId,
            username: socket.user.username,
            action,
            target,
            timestamp: new Date()
          });

          // Keep only last 100 actions
          if (data.gameState.actionLog.length > 100) {
            data.gameState.actionLog = data.gameState.actionLog.slice(-100);
          }

          await redis.setex(`room:${socket.roomId}`, 3600 * 4, JSON.stringify(data));
        }
      } catch (error) {
        logger.error('Error handling game action:', error);
        socket.emit('error', { message: 'Failed to process action' });
      }
    });

    // Handle chat messages
    socket.on('chat_message', async (data) => {
      try {
        const { message, roomId } = data;

        if (!message || message.length > 500) {
          socket.emit('error', { message: 'Invalid message' });
          return;
        }

        // Verify user is in the room
        if (!socket.rooms.has(`room:${roomId}`)) {
          socket.emit('error', { message: 'Not in this room' });
          return;
        }

        // Broadcast message to room
        io.to(`room:${roomId}`).emit('chat_message', {
          userId: socket.userId,
          username: socket.user.username,
          message,
          timestamp: new Date()
        });

        logger.debug(`Chat message in room ${roomId} from ${socket.user.username}`);
      } catch (error) {
        logger.error('Error handling chat message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle player state updates
    socket.on('update_player_state', async (data) => {
      try {
        const { state } = data;

        if (!socket.roomId) {
          socket.emit('error', { message: 'Not in a room' });
          return;
        }

        // Update participant state in database
        await RoomParticipant.update(
          { player_state: state },
          {
            where: {
              room_id: socket.roomId,
              user_id: socket.userId,
              left_at: null
            }
          }
        );

        // Broadcast state update to other players
        socket.to(`room:${socket.roomId}`).emit('player_state_update', {
          userId: socket.userId,
          state,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Error updating player state:', error);
        socket.emit('error', { message: 'Failed to update state' });
      }
    });

    // Handle voice chat signaling (WebRTC)
    socket.on('voice_signal', async (data) => {
      try {
        const { targetUserId, signal } = data;

        if (!socket.roomId) {
          socket.emit('error', { message: 'Not in a room' });
          return;
        }

        // Forward signal to target user
        io.to(`user:${targetUserId}`).emit('voice_signal', {
          fromUserId: socket.userId,
          signal,
          roomId: socket.roomId
        });
      } catch (error) {
        logger.error('Error handling voice signal:', error);
        socket.emit('error', { message: 'Failed to send voice signal' });
      }
    });

    // Handle leaving room
    socket.on('leave_room', async (roomId) => {
      try {
        socket.leave(`room:${roomId}`);
        
        // Notify other players
        socket.to(`room:${roomId}`).emit('player_left', {
          userId: socket.userId,
          username: socket.user.username,
          timestamp: new Date()
        });

        delete socket.roomId;
        
        logger.info(`User ${socket.user.username} left room ${roomId}`);
      } catch (error) {
        logger.error('Error leaving room:', error);
      }
    });

    // Handle heartbeat/ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      try {
        // Set user offline
        await realtime.setUserOffline(socket.userId);

        if (socket.roomId) {
          // Notify room members
          socket.to(`room:${socket.roomId}`).emit('player_disconnected', {
            userId: socket.userId,
            username: socket.user.username,
            reason,
            timestamp: new Date()
          });
        }

        logger.info(`User ${socket.user.username} disconnected: ${reason}`);
      } catch (error) {
        logger.error('Error handling disconnect:', error);
      }
    });

    // Handle real-time notifications
    socket.on('subscribe_notifications', () => {
      socket.join(`notifications:${socket.userId}`);
      socket.emit('notifications_subscribed', { timestamp: new Date() });
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      if (socket.roomId) {
        socket.to(`room:${socket.roomId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.user.username,
          timestamp: new Date()
        });
      }
    });

    socket.on('typing_stop', (data) => {
      if (socket.roomId) {
        socket.to(`room:${socket.roomId}`).emit('user_stopped_typing', {
          userId: socket.userId,
          username: socket.user.username,
          timestamp: new Date()
        });
      }
    });

    // Handle room admin actions
    socket.on('admin_action', async (data) => {
      try {
        const { action, targetUserId, roomId } = data;

        if (!socket.roomId || socket.roomId !== roomId) {
          socket.emit('error', { message: 'Not in this room' });
          return;
        }

        // Check if user is room host
        const room = await MultiplayerRoom.findByPk(roomId);
        if (!room || room.host_id !== socket.userId) {
          socket.emit('error', { message: 'Not authorized for admin actions' });
          return;
        }

        switch (action) {
          case 'kick_player':
            // Remove participant from room
            await RoomParticipant.update(
              { left_at: new Date() },
              {
                where: {
                  room_id: roomId,
                  user_id: targetUserId,
                  left_at: null
                }
              }
            );

            // Notify player and room
            io.to(`user:${targetUserId}`).emit('kicked_from_room', {
              roomId,
              reason: 'Kicked by host',
              timestamp: new Date()
            });

            io.to(`room:${roomId}`).emit('player_kicked', {
              targetUserId,
              adminUserId: socket.userId,
              timestamp: new Date()
            });
            break;

          case 'transfer_host':
            // Transfer room ownership
            await MultiplayerRoom.update(
              { host_id: targetUserId },
              { where: { id: roomId } }
            );

            io.to(`room:${roomId}`).emit('host_transferred', {
              newHostId: targetUserId,
              previousHostId: socket.userId,
              timestamp: new Date()
            });
            break;

          default:
            socket.emit('error', { message: 'Unknown admin action' });
        }
      } catch (error) {
        logger.error('Error handling admin action:', error);
        socket.emit('error', { message: 'Failed to execute admin action' });
      }
    });

    // Handle game state synchronization
    socket.on('sync_game_state', async (data) => {
      try {
        if (!socket.roomId) {
          socket.emit('error', { message: 'Not in a room' });
          return;
        }

        const { gameState } = data;

        // Update room state in cache
        const roomData = await redis.get(`room:${socket.roomId}`);
        if (roomData) {
          const data = JSON.parse(roomData);
          data.gameState = { ...data.gameState, ...gameState };
          data.lastUpdated = new Date();
          
          await redis.setex(`room:${socket.roomId}`, 3600 * 4, JSON.stringify(data));

          // Broadcast updated state to other players
          socket.to(`room:${socket.roomId}`).emit('game_state_updated', {
            gameState: data.gameState,
            updatedBy: socket.userId,
            timestamp: new Date()
          });
        }
      } catch (error) {
        logger.error('Error syncing game state:', error);
        socket.emit('error', { message: 'Failed to sync game state' });
      }
    });

    // Handle direct messages
    socket.on('direct_message', async (data) => {
      try {
        const { targetUserId, message } = data;

        if (!message || message.length > 1000) {
          socket.emit('error', { message: 'Invalid message' });
          return;
        }

        // Check if target user is online
        const isOnline = await realtime.isUserOnline(targetUserId);
        if (!isOnline) {
          socket.emit('error', { message: 'User is not online' });
          return;
        }

        // Send message to target user
        io.to(`user:${targetUserId}`).emit('direct_message', {
          fromUserId: socket.userId,
          fromUsername: socket.user.username,
          message,
          timestamp: new Date()
        });

        // Confirm delivery
        socket.emit('message_sent', {
          targetUserId,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Error sending direct message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
  });

  // Helper function to send notifications
  const sendNotification = (userId, notification) => {
    io.to(`notifications:${userId}`).emit('notification', {
      ...notification,
      id: require('uuid').v4(),
      timestamp: new Date()
    });
  };

  // Helper function to broadcast to a room
  const broadcastToRoom = (roomId, event, data) => {
    io.to(`room:${roomId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  };

  // Helper function to send direct message to user
  const sendDirectMessage = (userId, message) => {
    io.to(`user:${userId}`).emit('system_message', {
      message,
      type: 'system',
      timestamp: new Date()
    });
  };

  // Helper function to get online users
  const getOnlineUsers = async () => {
    try {
      return await realtime.getOnlineUsers();
    } catch (error) {
      logger.error('Error getting online users:', error);
      return [];
    }
  };

  // Helper function to check if user is online
  const isUserOnline = async (userId) => {
    try {
      return await realtime.isUserOnline(userId);
    } catch (error) {
      logger.error('Error checking user online status:', error);
      return false;
    }
  };

  // Helper function to get room participants
  const getRoomParticipants = (roomId) => {
    const roomSockets = io.sockets.adapter.rooms.get(`room:${roomId}`);
    if (!roomSockets) return [];

    const participants = [];
    for (const socketId of roomSockets) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && socket.user) {
        participants.push({
          socketId,
          user: socket.user,
          connectedAt: socket.connectedAt || new Date()
        });
      }
    }
    return participants;
  };

  // Helper function to force disconnect user
  const forceDisconnectUser = (userId, reason = 'Admin action') => {
    const userSockets = io.sockets.adapter.rooms.get(`user:${userId}`);
    if (userSockets) {
      for (const socketId of userSockets) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('force_disconnect', { reason });
          socket.disconnect(true);
        }
      }
    }
  };

  // Helper function to broadcast system announcement
  const broadcastAnnouncement = (announcement) => {
    io.emit('system_announcement', {
      ...announcement,
      timestamp: new Date()
    });
  };

  // Helper function to get server stats
  const getServerStats = () => {
    const connectedUsers = io.sockets.sockets.size;
    const rooms = io.sockets.adapter.rooms.size;
    
    return {
      connectedUsers,
      rooms,
      timestamp: new Date()
    };
  };

  return {
    io,
    sendNotification,
    broadcastToRoom,
    sendDirectMessage,
    getOnlineUsers,
    isUserOnline,
    getRoomParticipants,
    forceDisconnectUser,
    broadcastAnnouncement,
    getServerStats
  };
};

module.exports = { setupSocketHandlers };