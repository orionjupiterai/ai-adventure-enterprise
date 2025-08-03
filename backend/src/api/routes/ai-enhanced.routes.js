const express = require('express');
const { body, validationResult } = require('express-validator');
const n8nService = require('../../services/n8nIntegration');
const { GameSession, World, AIContent } = require('../../models');
const logger = require('../../utils/logger');
const { redis } = require('../../config/redis');

const router = express.Router();

/**
 * Generate NPC dialogue with xAI Grok
 */
router.post('/npc/dialogue',
  [
    body('sessionId').isUUID(),
    body('npcName').notEmpty(),
    body('npcRole').optional(),
    body('emotionalContext').optional().isIn(['happy', 'sad', 'angry', 'neutral', 'excited', 'fearful'])
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, npcName, npcRole, emotionalContext } = req.body;

      // Get session context
      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id },
        include: [{ model: World, as: 'world' }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Get player history from Redis
      const historyKey = `session:history:${sessionId}`;
      const playerHistory = JSON.parse(await redis.get(historyKey) || '[]');

      // Generate dialogue through n8n
      const dialogue = await n8nService.generateNPCDialogue({
        npcName,
        npcRole: npcRole || 'friendly villager',
        playerHistory: playerHistory.slice(-10), // Last 10 interactions
        currentLocation: session.current_location,
        gameState: session.game_state,
        emotionalContext,
        worldContext: session.world.world_data
      });

      // Save AI content
      await AIContent.create({
        world_id: session.world_id,
        session_id: sessionId,
        content_type: 'npc_dialogue',
        prompt: `${npcName} dialogue`,
        generated_content: JSON.stringify(dialogue),
        metadata: { npcName, npcRole, emotionalContext },
        tokens_used: dialogue.tokensUsed || 0
      });

      // Update player history
      playerHistory.push({
        type: 'npc_interaction',
        npc: npcName,
        timestamp: new Date().toISOString()
      });
      await redis.setex(historyKey, 86400, JSON.stringify(playerHistory));

      res.json({
        dialogue: dialogue.text,
        emotion: dialogue.emotion,
        choices: dialogue.suggestedChoices,
        metadata: dialogue.metadata
      });
    } catch (error) {
      logger.error('NPC dialogue generation error:', error);
      next(error);
    }
  }
);

/**
 * Generate dynamic story content
 */
router.post('/story/generate',
  [
    body('sessionId').isUUID(),
    body('storyPoint').notEmpty(),
    body('playerChoice').optional()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, storyPoint, playerChoice } = req.body;

      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id },
        include: [{ model: World, as: 'world' }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Get player choices history
      const choicesKey = `session:choices:${sessionId}`;
      const playerChoices = JSON.parse(await redis.get(choicesKey) || '[]');
      
      if (playerChoice) {
        playerChoices.push({
          choice: playerChoice,
          timestamp: new Date().toISOString()
        });
        await redis.setex(choicesKey, 86400, JSON.stringify(playerChoices));
      }

      // Get character development data
      const characterKey = `session:character:${sessionId}`;
      const characterDevelopment = JSON.parse(await redis.get(characterKey) || '{}');

      // Generate story through n8n
      const story = await n8nService.generateStoryContent({
        sessionId,
        storyPoint,
        worldData: session.world.world_data,
        playerChoices: playerChoices.slice(-20), // Last 20 choices
        currentLocation: session.current_location,
        inventory: session.inventory,
        characterDevelopment
      });

      // Save AI content
      await AIContent.create({
        world_id: session.world_id,
        session_id: sessionId,
        content_type: 'story',
        prompt: storyPoint,
        generated_content: JSON.stringify(story),
        metadata: { storyPoint, providers: story.providers },
        tokens_used: story.totalTokens || 0
      });

      // Update character development
      if (story.characterUpdates) {
        Object.assign(characterDevelopment, story.characterUpdates);
        await redis.setex(characterKey, 86400, JSON.stringify(characterDevelopment));
      }

      res.json({
        narrative: story.narrative,
        choices: story.choices,
        consequences: story.consequences,
        characterDevelopment: story.characterUpdates,
        metadata: story.metadata
      });
    } catch (error) {
      logger.error('Story generation error:', error);
      next(error);
    }
  }
);

/**
 * Generate artwork for scenes
 */
router.post('/artwork/generate',
  [
    body('sessionId').isUUID(),
    body('scene').notEmpty(),
    body('style').optional(),
    body('aspectRatio').optional().isIn(['16:9', '4:3', '1:1', '9:16'])
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, scene, style, aspectRatio } = req.body;

      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id },
        include: [{ model: World, as: 'world' }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Build scene context
      const locationData = session.world.world_data.locations[session.current_location];
      const sceneContext = {
        location: locationData,
        worldTheme: session.world.world_data.worldInfo.theme || 'fantasy',
        atmosphere: locationData.atmosphere || 'mysterious'
      };

      // Generate artwork through n8n
      const artwork = await n8nService.generateArtwork({
        prompt: `${scene}. ${locationData.description}`,
        style: style || session.world.world_data.worldInfo.artStyle || 'fantasy digital art',
        aspectRatio,
        provider: 'midjourney',
        quality: 'high',
        sceneContext
      });

      // Save AI content
      await AIContent.create({
        world_id: session.world_id,
        session_id: sessionId,
        content_type: 'image',
        prompt: scene,
        generated_content: artwork.imageUrl,
        metadata: { 
          style, 
          aspectRatio, 
          provider: artwork.provider,
          jobId: artwork.jobId 
        },
        tokens_used: 0
      });

      res.json({
        imageUrl: artwork.imageUrl,
        thumbnailUrl: artwork.thumbnailUrl,
        provider: artwork.provider,
        processingTime: artwork.processingTime,
        metadata: artwork.metadata
      });
    } catch (error) {
      logger.error('Artwork generation error:', error);
      next(error);
    }
  }
);

/**
 * Generate voice narration
 */
router.post('/voice/narrate',
  [
    body('sessionId').isUUID(),
    body('text').notEmpty().isLength({ max: 5000 }),
    body('voiceId').optional(),
    body('emotion').optional().isIn(['neutral', 'happy', 'sad', 'excited', 'fearful', 'angry'])
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, text, voiceId, emotion } = req.body;

      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Get character context for voice selection
      const characterKey = `session:character:voice:${sessionId}`;
      const characterVoices = JSON.parse(await redis.get(characterKey) || '{}');

      // Generate narration through n8n
      const narration = await n8nService.generateVoiceNarration({
        text,
        voiceId: voiceId || characterVoices.narrator || 'default-narrator',
        emotion: emotion || 'neutral',
        speed: 1.0,
        characterContext: {
          isNarrator: !voiceId,
          characterName: characterVoices[voiceId]?.name
        }
      });

      // Save AI content
      await AIContent.create({
        world_id: session.world_id,
        session_id: sessionId,
        content_type: 'voice',
        prompt: text.substring(0, 100) + '...',
        generated_content: narration.audioUrl,
        metadata: { 
          voiceId, 
          emotion, 
          duration: narration.duration,
          provider: narration.provider 
        },
        tokens_used: Math.ceil(text.length / 4)
      });

      res.json({
        audioUrl: narration.audioUrl,
        duration: narration.duration,
        voiceId: narration.voiceId,
        provider: narration.provider,
        metadata: narration.metadata
      });
    } catch (error) {
      logger.error('Voice narration error:', error);
      next(error);
    }
  }
);

/**
 * Generate procedural quest
 */
router.post('/quest/generate',
  [
    body('sessionId').isUUID(),
    body('questType').optional().isIn(['main', 'side', 'daily', 'random']),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'legendary'])
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, questType, difficulty } = req.body;

      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id },
        include: [{ model: World, as: 'world' }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Calculate player level based on stats
      const playerLevel = session.stats?.level || 1;

      // Generate quest through n8n
      const quest = await n8nService.generateQuest({
        worldContext: session.world.world_data,
        playerLevel,
        questType: questType || 'side',
        difficulty: difficulty || 'medium',
        currentLocation: session.current_location,
        inventory: session.inventory
      });

      // Save quest to game state
      const gameState = { ...session.game_state };
      gameState.activeQuests = gameState.activeQuests || [];
      gameState.activeQuests.push({
        id: quest.id,
        ...quest
      });
      
      session.game_state = gameState;
      await session.save();

      // Save AI content
      await AIContent.create({
        world_id: session.world_id,
        session_id: sessionId,
        content_type: 'quest',
        prompt: `${questType} quest generation`,
        generated_content: JSON.stringify(quest),
        metadata: { questType, difficulty },
        tokens_used: quest.tokensUsed || 0
      });

      res.json({
        quest: {
          id: quest.id,
          title: quest.title,
          description: quest.description,
          objectives: quest.objectives,
          rewards: quest.rewards,
          difficulty: quest.difficulty,
          estimatedTime: quest.estimatedTime
        },
        branchingPaths: quest.branchingPaths,
        metadata: quest.metadata
      });
    } catch (error) {
      logger.error('Quest generation error:', error);
      next(error);
    }
  }
);

/**
 * Batch AI processing
 */
router.post('/batch/process',
  [
    body('sessionId').isUUID(),
    body('requests').isArray().isLength({ min: 1, max: 10 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, requests } = req.body;

      // Verify session ownership
      const session = await GameSession.findOne({
        where: { id: sessionId, user_id: req.user.id }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Add session context to all requests
      const enrichedRequests = requests.map(req => ({
        ...req,
        context: {
          ...req.context,
          sessionId,
          worldId: session.world_id
        }
      }));

      // Process batch through n8n
      const results = await n8nService.batchProcess(enrichedRequests);

      // Track usage
      const totalTokens = results.reduce((sum, result) => 
        sum + (result.value?.tokensUsed || 0), 0
      );

      await AIContent.create({
        world_id: session.world_id,
        session_id: sessionId,
        content_type: 'batch',
        prompt: 'Batch AI processing',
        generated_content: JSON.stringify(results),
        metadata: { requestCount: requests.length },
        tokens_used: totalTokens
      });

      res.json({ results });
    } catch (error) {
      logger.error('Batch processing error:', error);
      next(error);
    }
  }
);

/**
 * Handle n8n webhook callbacks
 */
router.post('/webhook/n8n',
  async (req, res, next) => {
    try {
      const signature = req.headers['x-webhook-signature'];
      
      if (!signature) {
        return res.status(401).json({ error: 'Missing webhook signature' });
      }

      const result = await n8nService.handleWebhookCallback(req.body, signature);
      
      res.json(result);
    } catch (error) {
      logger.error('Webhook processing error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * Get workflow status
 */
router.get('/workflow/status/:requestId',
  async (req, res, next) => {
    try {
      const status = await n8nService.getWorkflowStatus(req.params.requestId);
      res.json(status);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;