import { logger } from '../../utils/logger.js';
import { GameService } from '../game/GameService.js';
import { authMiddleware } from '../../middleware/auth.js';

export function setupSocketHandlers(io) {
  const gameService = new GameService();
  
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      // Verify token and attach user to socket
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      
      authMiddleware(req, res, (err) => {
        if (err) {
          return next(err);
        }
        socket.userId = req.user.id;
        socket.user = req.user;
        next();
      });
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId}`);
    
    // Join user's room
    socket.join(`user:${socket.userId}`);
    
    // Join game session room if active
    socket.on('join:game', async (sessionId) => {
      try {
        const hasAccess = await gameService.verifyUserAccess(sessionId, socket.userId);
        if (hasAccess) {
          socket.join(`game:${sessionId}`);
          socket.sessionId = sessionId;
          logger.info(`User ${socket.userId} joined game ${sessionId}`);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join game session' });
      }
    });
    
    // Handle player actions
    socket.on('player:action', async (data) => {
      try {
        const result = await gameService.processPlayerAction(
          socket.sessionId,
          socket.userId,
          data
        );
        
        // Emit result to player
        socket.emit('action:result', result);
        
        // Broadcast state updates to room
        io.to(`game:${socket.sessionId}`).emit('game:update', result.stateUpdates);
      } catch (error) {
        socket.emit('error', { message: 'Failed to process action' });
      }
    });
    
    // Handle combat actions
    socket.on('combat:action', async (data) => {
      try {
        const result = await gameService.processCombatAction(
          socket.sessionId,
          socket.userId,
          data
        );
        
        socket.emit('combat:update', result);
      } catch (error) {
        socket.emit('error', { message: 'Failed to process combat action' });
      }
    });
    
    // Handle dialogue choices
    socket.on('dialogue:choice', async (data) => {
      try {
        const result = await gameService.processDialogueChoice(
          socket.sessionId,
          socket.userId,
          data
        );
        
        socket.emit('dialogue:response', result);
      } catch (error) {
        socket.emit('error', { message: 'Failed to process dialogue' });
      }
    });
    
    // Handle save requests
    socket.on('game:save', async (data) => {
      try {
        const result = await gameService.saveGame(
          socket.sessionId,
          socket.userId,
          data.saveName
        );
        
        socket.emit('save:complete', result);
      } catch (error) {
        socket.emit('error', { message: 'Failed to save game' });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
      
      // Leave all rooms
      if (socket.sessionId) {
        socket.leave(`game:${socket.sessionId}`);
      }
      socket.leave(`user:${socket.userId}`);
    });
  });
  
  return io;
}