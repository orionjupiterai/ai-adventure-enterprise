import { v4 as uuidv4 } from 'uuid';
import { GameRepository } from '../database/GameRepository.js';
import { ClaudeService } from '../ai/ClaudeService.js';
import { RedisService } from '../external/RedisService.js';
import { logger } from '../../utils/logger.js';

export class GameService {
  constructor() {
    this.gameRepository = new GameRepository();
    this.claudeService = new ClaudeService();
    this.activeSessions = new Map();
  }

  async createSession(config) {
    const sessionId = uuidv4();
    const gameSession = {
      id: sessionId,
      userId: config.userId,
      world: config.world,
      character: config.character,
      state: {
        location: config.world.startingLocation,
        time: 'morning',
        weather: 'clear',
        inventory: [],
        quests: [],
        combatActive: false,
      },
      createdAt: Date.now(),
    };

    // Store in memory
    this.activeSessions.set(sessionId, gameSession);
    
    // Cache in Redis
    await RedisService.set(`game:${sessionId}`, gameSession, 7200); // 2 hour TTL
    
    return gameSession;
  }

  async getSession(sessionId, userId) {
    // Check memory first
    let session = this.activeSessions.get(sessionId);
    
    if (!session) {
      // Check Redis
      session = await RedisService.get(`game:${sessionId}`);
      
      if (!session) {
        // Load from database
        const gameData = await this.gameRepository.findBySessionId(sessionId);
        if (gameData && gameData.user_id === userId) {
          session = {
            id: sessionId,
            userId: gameData.user_id,
            state: gameData.game_state,
          };
          this.activeSessions.set(sessionId, session);
        }
      }
    }
    
    return session;
  }

  async getGameState(sessionId, userId) {
    const session = await this.getSession(sessionId, userId);
    return session?.state;
  }

  async updateGameState(sessionId, updates) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      Object.assign(session.state, updates);
      
      // Update cache
      await RedisService.set(`game:${sessionId}`, session, 7200);
      
      // Update database
      await this.gameRepository.updateGameState(sessionId, session.state);
    }
  }

  async generateInitialScene(gameSession) {
    const context = {
      location: gameSession.state.location,
      playerLevel: 1,
      playerClass: gameSession.character.class,
      recentActions: ['Game started'],
      worldState: {
        time: gameSession.state.time,
        weather: gameSession.state.weather,
      },
    };

    const narrative = await this.claudeService.generateNarrative(context);
    
    return {
      narrative: narrative.narrative,
      sceneDetails: narrative.sceneDetails,
      atmosphere: narrative.atmosphere,
      choices: narrative.choices,
      imagePrompt: this.generateImagePrompt(narrative),
    };
  }

  async processMovement(gameSession, params) {
    // Process movement logic
    const newLocation = params.destination;
    
    // Generate narrative for new location
    const context = {
      location: newLocation,
      playerLevel: gameSession.character.level,
      playerClass: gameSession.character.class,
      recentActions: [`Moved to ${newLocation.name}`],
      worldState: gameSession.state,
    };

    const narrative = await this.claudeService.generateNarrative(context);
    
    return {
      stateUpdates: {
        location: newLocation,
      },
      narrative,
    };
  }

  async processInteraction(gameSession, params) {
    const action = {
      type: 'interact',
      description: `Interact with ${params.target}`,
    };

    const result = await this.claudeService.processPlayerAction(action, gameSession.state);
    
    return {
      stateUpdates: result.stateChanges,
      narrative: result.narrative,
      choices: result.newChoices,
    };
  }

  async processDialogue(gameSession, params) {
    const { npcId, choice } = params;
    
    const context = {
      situation: gameSession.state.location,
      relationship: 'neutral', // Could be loaded from state
    };

    const dialogue = await this.claudeService.generateDialogue(
      { id: npcId, name: params.npcName },
      context,
      choice
    );
    
    return {
      stateUpdates: {},
      dialogue,
    };
  }

  async processInventoryAction(gameSession, params) {
    const { action, item } = params;
    
    switch (action) {
      case 'use':
        // Process item use
        break;
      case 'equip':
        // Process item equip
        break;
      case 'drop':
        // Process item drop
        break;
    }
    
    return {
      stateUpdates: {
        inventory: gameSession.state.inventory,
      },
    };
  }

  async endSession(sessionId, userId) {
    const session = await this.getSession(sessionId, userId);
    if (session) {
      // Update database
      await this.gameRepository.updateGameStatus(sessionId, 'completed');
      
      // Clean up
      this.activeSessions.delete(sessionId);
      await RedisService.delete(`game:${sessionId}`);
    }
  }

  async getGameStatistics(sessionId, userId) {
    const session = await this.getSession(sessionId, userId);
    if (!session) return null;
    
    return {
      playTime: Date.now() - session.createdAt,
      questsCompleted: session.state.quests.filter(q => q.status === 'completed').length,
      locationsDiscovered: session.state.discoveredLocations?.length || 0,
      // Add more stats as needed
    };
  }

  async verifyUserAccess(sessionId, userId) {
    const session = await this.getSession(sessionId, userId);
    return session && session.userId === userId;
  }

  generateImagePrompt(narrative) {
    // Generate image prompt based on narrative
    return `${narrative.atmosphere}, ${narrative.sceneDetails}, fantasy art style, highly detailed`;
  }
}