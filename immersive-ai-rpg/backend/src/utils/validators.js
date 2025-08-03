import Joi from 'joi';

// Auth validation schemas
export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().min(3).max(20).required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
      }),
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().optional(),
  }),
  
  refresh: Joi.object({
    refreshToken: Joi.string().required(),
  }),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  }),
  
  updateSettings: Joi.object({
    settings: Joi.object().required(),
  }),
};

// Game validation schemas
export const gameSchemas = {
  startGame: Joi.object({
    worldConfig: Joi.object({
      theme: Joi.string().valid('fantasy', 'scifi', 'cyberpunk', 'horror').required(),
      difficulty: Joi.string().valid('novice', 'standard', 'veteran', 'master').required(),
      customSettings: Joi.object().optional(),
    }).required(),
    characterData: Joi.object({
      name: Joi.string().min(1).max(50).required(),
      class: Joi.string().required(),
      appearance: Joi.object().optional(),
    }).required(),
  }),
  
  saveGame: Joi.object({
    sessionId: Joi.string().required(),
    saveName: Joi.string().min(1).max(100).required(),
    saveData: Joi.object().required(),
  }),
  
  playerAction: Joi.object({
    sessionId: Joi.string().required(),
    action: Joi.object({
      type: Joi.string().valid('move', 'interact', 'combat', 'dialogue', 'inventory').required(),
      target: Joi.string().optional(),
      params: Joi.object().optional(),
    }).required(),
  }),
};

// World validation schemas
export const worldSchemas = {
  generateWorld: Joi.object({
    theme: Joi.string().valid('fantasy', 'scifi', 'cyberpunk', 'horror').required(),
    size: Joi.string().valid('small', 'medium', 'large').default('medium'),
    seed: Joi.string().optional(),
    customParameters: Joi.object().optional(),
  }),
  
  queryLocations: Joi.object({
    worldId: Joi.string().required(),
    type: Joi.string().optional(),
    discovered: Joi.boolean().optional(),
  }),
};

// AI validation schemas
export const aiSchemas = {
  generateNarrative: Joi.object({
    context: Joi.object({
      location: Joi.string().required(),
      playerState: Joi.object().required(),
      recentActions: Joi.array().items(Joi.string()).required(),
      worldState: Joi.object().required(),
    }).required(),
    style: Joi.string().optional(),
  }),
  
  generateDialogue: Joi.object({
    npcId: Joi.string().required(),
    context: Joi.object().required(),
    playerChoice: Joi.string().optional(),
  }),
  
  processAction: Joi.object({
    action: Joi.object().required(),
    gameState: Joi.object().required(),
  }),
};