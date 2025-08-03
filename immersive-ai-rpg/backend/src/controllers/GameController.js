import { GameService } from '../services/game/GameService.js';
import { WorldGeneratorService } from '../services/game/WorldGeneratorService.js';
import { CombatService } from '../services/game/CombatService.js';
import { QuestService } from '../services/game/QuestService.js';
import { GameRepository } from '../services/database/GameRepository.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export class GameController {
  constructor() {
    this.gameService = new GameService();
    this.worldGenerator = new WorldGeneratorService();
    this.combatService = new CombatService();
    this.questService = new QuestService();
    this.gameRepository = new GameRepository();
  }

  async startGame(req, res, next) {
    try {
      const { worldConfig, characterData } = req.body;
      const userId = req.user.id;

      // Generate initial world
      const world = await this.worldGenerator.generateWorld(worldConfig);
      
      // Create game session
      const gameSession = await this.gameService.createSession({
        userId,
        world,
        character: characterData,
      });

      // Generate initial scene
      const initialScene = await this.gameService.generateInitialScene(gameSession);

      // Save to database
      await this.gameRepository.createGame({
        userId,
        sessionId: gameSession.id,
        worldData: world,
        characterData,
        state: gameSession.state,
      });

      logger.info(`Game started for user ${userId}, session ${gameSession.id}`);

      res.status(201).json({
        success: true,
        sessionId: gameSession.id,
        gameState: gameSession.state,
        initialScene,
        world: {
          name: world.name,
          description: world.description,
          currentLocation: world.startingLocation,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getGameState(req, res, next) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const gameState = await this.gameService.getGameState(sessionId, userId);
      
      if (!gameState) {
        throw new AppError('Game session not found', 404);
      }

      res.json({
        success: true,
        gameState,
      });
    } catch (error) {
      next(error);
    }
  }

  async saveGame(req, res, next) {
    try {
      const { sessionId, saveName, saveData } = req.body;
      const userId = req.user.id;

      const save = await this.gameRepository.saveGame({
        userId,
        sessionId,
        saveName,
        saveData,
      });

      logger.info(`Game saved: ${save.id} for user ${userId}`);

      res.json({
        success: true,
        saveId: save.id,
        message: 'Game saved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async loadGame(req, res, next) {
    try {
      const { saveId } = req.params;
      const userId = req.user.id;

      const saveData = await this.gameRepository.loadGame(saveId, userId);
      
      if (!saveData) {
        throw new AppError('Save not found', 404);
      }

      // Restore game session
      const gameSession = await this.gameService.restoreSession(saveData);

      res.json({
        success: true,
        sessionId: gameSession.id,
        gameState: gameSession.state,
        message: 'Game loaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async listSaves(req, res, next) {
    try {
      const userId = req.user.id;
      const saves = await this.gameRepository.getUserSaves(userId);

      res.json({
        success: true,
        saves: saves.map(save => ({
          id: save.id,
          name: save.name,
          createdAt: save.createdAt,
          characterName: save.characterData?.name,
          level: save.characterData?.level,
          location: save.worldData?.currentLocation?.name,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSave(req, res, next) {
    try {
      const { saveId } = req.params;
      const userId = req.user.id;

      await this.gameRepository.deleteSave(saveId, userId);

      res.json({
        success: true,
        message: 'Save deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async processAction(req, res, next) {
    try {
      const { sessionId, action, params } = req.body;
      const userId = req.user.id;

      const gameSession = await this.gameService.getSession(sessionId, userId);
      
      if (!gameSession) {
        throw new AppError('Game session not found', 404);
      }

      let result;
      
      // Process different action types
      switch (action.type) {
        case 'move':
          result = await this.gameService.processMovement(gameSession, params);
          break;
        case 'interact':
          result = await this.gameService.processInteraction(gameSession, params);
          break;
        case 'combat':
          result = await this.combatService.processCombatAction(gameSession, params);
          break;
        case 'dialogue':
          result = await this.gameService.processDialogue(gameSession, params);
          break;
        case 'inventory':
          result = await this.gameService.processInventoryAction(gameSession, params);
          break;
        default:
          throw new AppError('Invalid action type', 400);
      }

      // Update game state
      await this.gameService.updateGameState(sessionId, result.stateUpdates);

      res.json({
        success: true,
        result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGameStats(req, res, next) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const stats = await this.gameService.getGameStatistics(sessionId, userId);

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async endGame(req, res, next) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      await this.gameService.endSession(sessionId, userId);

      res.json({
        success: true,
        message: 'Game session ended',
      });
    } catch (error) {
      next(error);
    }
  }
}