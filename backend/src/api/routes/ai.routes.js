const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const OpenAI = require('openai');
const axios = require('axios');
const { AIContent, GameSession, World } = require('../../models');
const logger = require('../../utils/logger');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate dynamic story content
router.post('/generate-story',
  [
    body('sessionId').isUUID(),
    body('prompt').notEmpty().isLength({ max: 1000 }),
    body('context').optional()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, prompt, context } = req.body;

      // Verify session ownership
      const session = await GameSession.findOne({
        where: {
          id: sessionId,
          user_id: req.user.id
        },
        include: [{
          model: World,
          as: 'world'
        }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Build AI prompt
      const systemPrompt = `You are a creative storyteller for a choose-your-own-adventure game. 
        The game world is: ${session.world.name}. 
        Current location: ${session.current_location}.
        Player inventory: ${JSON.stringify(session.inventory)}.
        Generate engaging, immersive story content that fits the game world's theme and style.
        Keep responses concise (2-3 paragraphs) and end with choices for the player.`;

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
      const tokensUsed = completion.usage.total_tokens;

      // Save AI content
      await AIContent.create({
        world_id: session.world_id,
        session_id: sessionId,
        content_type: 'story',
        prompt,
        generated_content: generatedContent,
        metadata: { context },
        tokens_used: tokensUsed
      });

      logger.info(`AI story generated for session ${sessionId}, tokens: ${tokensUsed}`);

      res.json({
        content: generatedContent,
        tokensUsed
      });
    } catch (error) {
      logger.error('AI story generation error:', error);
      next(error);
    }
  }
);

// Generate scene artwork
router.post('/generate-image',
  [
    body('sessionId').isUUID(),
    body('description').notEmpty().isLength({ max: 500 }),
    body('style').optional().isIn(['realistic', 'fantasy', 'cartoon', 'pixel-art'])
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, description, style = 'fantasy' } = req.body;

      // Verify session ownership
      const session = await GameSession.findOne({
        where: {
          id: sessionId,
          user_id: req.user.id
        }
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Generate image with DALL-E
      const imagePrompt = `${style} art style: ${description}. High quality digital art for a choose-your-own-adventure game.`;

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      });

      const imageUrl = response.data[0].url;

      // Save AI content
      await AIContent.create({
        world_id: session.world_id,
        session_id: sessionId,
        content_type: 'image',
        prompt: description,
        generated_content: imageUrl,
        metadata: { style },
        tokens_used: 0 // DALL-E doesn't report tokens
      });

      logger.info(`AI image generated for session ${sessionId}`);

      res.json({
        imageUrl,
        prompt: imagePrompt
      });
    } catch (error) {
      logger.error('AI image generation error:', error);
      next(error);
    }
  }
);

// AI Dungeon Master for procedural content
router.post('/dungeon-master',
  [
    body('sessionId').isUUID(),
    body('action').notEmpty(),
    body('gameContext').optional()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, action, gameContext } = req.body;

      // Verify session
      const session = await GameSession.findOne({
        where: {
          id: sessionId,
          user_id: req.user.id
        },
        include: [{
          model: World,
          as: 'world'
        }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // AI Dungeon Master prompt
      const systemPrompt = `You are an AI Dungeon Master for a choose-your-own-adventure game.
        World: ${session.world.name}
        Current game state: ${JSON.stringify(gameContext || session.game_state)}
        Player action: ${action}
        
        Generate appropriate consequences, new locations, items, or characters.
        Maintain consistency with the game world and previous events.
        Create engaging narrative outcomes and provide new choices.
        Format response as JSON with: outcome, newChoices, stateChanges, and optionally newItems or newLocations.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Process this action: ${action}` }
        ],
        max_tokens: 600,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const dmResponse = JSON.parse(completion.choices[0].message.content);
      const tokensUsed = completion.usage.total_tokens;

      // Save AI content
      await AIContent.create({
        world_id: session.world_id,
        session_id: sessionId,
        content_type: 'story',
        prompt: action,
        generated_content: JSON.stringify(dmResponse),
        metadata: { type: 'dungeon_master', gameContext },
        tokens_used: tokensUsed
      });

      // Apply state changes if any
      if (dmResponse.stateChanges) {
        session.game_state = { ...session.game_state, ...dmResponse.stateChanges };
        await session.save();
      }

      logger.info(`AI DM response for session ${sessionId}, tokens: ${tokensUsed}`);

      res.json(dmResponse);
    } catch (error) {
      logger.error('AI Dungeon Master error:', error);
      next(error);
    }
  }
);

// Generate voice narration
router.post('/generate-voice',
  [
    body('text').notEmpty().isLength({ max: 1000 }),
    body('voice').optional().isIn(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']),
    body('sessionId').optional().isUUID()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { text, voice = 'nova', sessionId } = req.body;

      // Generate speech
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      
      // Save reference if session provided
      if (sessionId) {
        const session = await GameSession.findOne({
          where: {
            id: sessionId,
            user_id: req.user.id
          }
        });

        if (session) {
          await AIContent.create({
            world_id: session.world_id,
            session_id: sessionId,
            content_type: 'voice',
            prompt: text,
            generated_content: `voice_${Date.now()}.mp3`,
            metadata: { voice },
            tokens_used: Math.ceil(text.length / 4) // Approximate token count
          });
        }
      }

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length
      });
      res.send(buffer);
    } catch (error) {
      logger.error('Voice generation error:', error);
      next(error);
    }
  }
);

// Get AI usage statistics
router.get('/usage', async (req, res, next) => {
  try {
    const usage = await AIContent.findAll({
      attributes: [
        'content_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('tokens_used')), 'total_tokens']
      ],
      where: {
        session_id: {
          [Op.in]: sequelize.literal(
            `(SELECT id FROM game_sessions WHERE user_id = '${req.user.id}')`
          )
        }
      },
      group: ['content_type']
    });

    const totalTokens = usage.reduce((sum, item) => sum + (parseInt(item.dataValues.total_tokens) || 0), 0);
    const estimatedCost = (totalTokens / 1000) * 0.03; // Rough estimate

    res.json({
      usage: usage.map(item => ({
        type: item.content_type,
        count: parseInt(item.dataValues.count),
        tokens: parseInt(item.dataValues.total_tokens) || 0
      })),
      totalTokens,
      estimatedCost
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;