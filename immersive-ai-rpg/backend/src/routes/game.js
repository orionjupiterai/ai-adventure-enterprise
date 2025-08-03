import { Router } from 'express';
import { GameController } from '../controllers/GameController.js';
import { validateRequest } from '../middleware/validation.js';
import { gameSchemas } from '../utils/validators.js';

const router = Router();
const gameController = new GameController();

// Start a new game
router.post('/start', 
  validateRequest(gameSchemas.startGame),
  gameController.startGame.bind(gameController)
);

// Get current game state
router.get('/state/:sessionId',
  gameController.getGameState.bind(gameController)
);

// Save game
router.post('/save',
  validateRequest(gameSchemas.saveGame),
  gameController.saveGame.bind(gameController)
);

// Load game
router.get('/load/:saveId',
  gameController.loadGame.bind(gameController)
);

// List saves
router.get('/saves',
  gameController.listSaves.bind(gameController)
);

// Delete save
router.delete('/save/:saveId',
  gameController.deleteSave.bind(gameController)
);

// Process player action
router.post('/action',
  validateRequest(gameSchemas.playerAction),
  gameController.processAction.bind(gameController)
);

// Get game statistics
router.get('/stats/:sessionId',
  gameController.getGameStats.bind(gameController)
);

// End game session
router.post('/end/:sessionId',
  gameController.endGame.bind(gameController)
);

export default router;