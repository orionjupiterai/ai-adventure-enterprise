const axios = require('axios');
const { redis } = require('../config/redis');
const logger = require('../utils/logger');
const crypto = require('crypto');

class N8nIntegrationService {
  constructor() {
    this.n8nBaseUrl = process.env.N8N_BASE_URL || 'https://n8n.hostinger.com';
    this.n8nApiKey = process.env.N8N_API_KEY;
    this.webhookSecret = process.env.N8N_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex');
    
    // Workflow IDs
    this.workflows = {
      grokNPC: process.env.N8N_GROK_NPC_WORKFLOW,
      storyGeneration: process.env.N8N_STORY_GEN_WORKFLOW,
      artworkGeneration: process.env.N8N_ARTWORK_GEN_WORKFLOW,
      voiceNarration: process.env.N8N_VOICE_NARRATION_WORKFLOW,
      contentModeration: process.env.N8N_MODERATION_WORKFLOW,
      questGeneration: process.env.N8N_QUEST_GEN_WORKFLOW
    };

    // Cache configuration
    this.cacheConfig = {
      story: 3600, // 1 hour
      artwork: 86400, // 24 hours
      voice: 604800, // 7 days
      npcDialogue: 1800 // 30 minutes
    };
  }

  /**
   * Trigger n8n workflow via webhook
   */
  async triggerWorkflow(workflowId, data, options = {}) {
    const requestId = crypto.randomUUID();
    const webhookUrl = `${this.n8nBaseUrl}/webhook/${workflowId}`;
    
    try {
      logger.info(`Triggering n8n workflow: ${workflowId}`, { requestId });
      
      const response = await axios.post(webhookUrl, {
        requestId,
        timestamp: new Date().toISOString(),
        data,
        options
      }, {
        headers: {
          'X-N8N-Api-Key': this.n8nApiKey,
          'X-Webhook-Secret': this.webhookSecret,
          'Content-Type': 'application/json'
        },
        timeout: options.timeout || 30000
      });

      logger.info(`n8n workflow response received: ${workflowId}`, { requestId });
      return response.data;
    } catch (error) {
      logger.error(`n8n workflow error: ${workflowId}`, { 
        requestId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Generate NPC dialogue using xAI Grok
   */
  async generateNPCDialogue(context) {
    const cacheKey = `npc:dialogue:${crypto.createHash('md5').update(JSON.stringify(context)).digest('hex')}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('NPC dialogue cache hit');
      return JSON.parse(cached);
    }

    const result = await this.triggerWorkflow(this.workflows.grokNPC, {
      npcName: context.npcName,
      npcRole: context.npcRole,
      playerHistory: context.playerHistory,
      currentLocation: context.currentLocation,
      gameState: context.gameState,
      emotionalContext: context.emotionalContext,
      memoryPersistence: true
    });

    // Cache result
    await redis.setex(cacheKey, this.cacheConfig.npcDialogue, JSON.stringify(result));

    return result;
  }

  /**
   * Generate dynamic story content
   */
  async generateStoryContent(context) {
    const cacheKey = `story:${context.sessionId}:${context.storyPoint}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Story content cache hit');
      return JSON.parse(cached);
    }

    const result = await this.triggerWorkflow(this.workflows.storyGeneration, {
      sessionId: context.sessionId,
      worldData: context.worldData,
      playerChoices: context.playerChoices,
      currentLocation: context.currentLocation,
      inventory: context.inventory,
      characterDevelopment: context.characterDevelopment,
      providers: ['grok', 'openai', 'claude'], // Multi-provider support
      contextWindow: 4000
    });

    // Cache result
    await redis.setex(cacheKey, this.cacheConfig.story, JSON.stringify(result));

    // Track story progression
    await this.updateStoryProgression(context.sessionId, result);

    return result;
  }

  /**
   * Generate artwork for scenes
   */
  async generateArtwork(context) {
    const cacheKey = `artwork:${crypto.createHash('md5').update(context.prompt).digest('hex')}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Artwork cache hit');
      return JSON.parse(cached);
    }

    const result = await this.triggerWorkflow(this.workflows.artworkGeneration, {
      prompt: context.prompt,
      style: context.style || 'fantasy digital art',
      aspectRatio: context.aspectRatio || '16:9',
      provider: context.provider || 'midjourney', // Primary: Midjourney
      fallbackProvider: 'grok-image', // Fallback: xAI Grok Image
      quality: context.quality || 'high',
      sceneContext: context.sceneContext
    });

    // Cache result
    await redis.setex(cacheKey, this.cacheConfig.artwork, JSON.stringify(result));

    return result;
  }

  /**
   * Generate voice narration
   */
  async generateVoiceNarration(context) {
    const cacheKey = `voice:${context.voiceId}:${crypto.createHash('md5').update(context.text).digest('hex')}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Voice narration cache hit');
      return JSON.parse(cached);
    }

    const result = await this.triggerWorkflow(this.workflows.voiceNarration, {
      text: context.text,
      voiceId: context.voiceId,
      emotion: context.emotion || 'neutral',
      speed: context.speed || 1.0,
      provider: 'elevenlabs', // Primary: ElevenLabs
      fallbackProvider: 'google-tts', // Fallback: Google TTS
      characterContext: context.characterContext
    });

    // Cache result
    await redis.setex(cacheKey, this.cacheConfig.voice, JSON.stringify(result));

    return result;
  }

  /**
   * Moderate content using AI
   */
  async moderateContent(content) {
    const result = await this.triggerWorkflow(this.workflows.contentModeration, {
      content,
      moderationType: 'comprehensive',
      structuredReasoning: true,
      categories: ['violence', 'adult', 'hate', 'self-harm', 'illegal']
    });

    return result;
  }

  /**
   * Generate procedural quests
   */
  async generateQuest(context) {
    const result = await this.triggerWorkflow(this.workflows.questGeneration, {
      worldContext: context.worldContext,
      playerLevel: context.playerLevel,
      questType: context.questType || 'main',
      difficulty: context.difficulty || 'medium',
      branchingLogic: true,
      rewardTiers: context.rewardTiers || 3
    });

    return result;
  }

  /**
   * Update story progression tracking
   */
  async updateStoryProgression(sessionId, storyData) {
    const key = `story:progression:${sessionId}`;
    const progression = await redis.get(key) || '{}';
    const data = JSON.parse(progression);
    
    data.lastUpdate = new Date().toISOString();
    data.storyPoints = (data.storyPoints || []).concat([{
      timestamp: new Date().toISOString(),
      content: storyData.summary,
      choices: storyData.choices
    }]);
    
    // Keep only last 100 story points
    if (data.storyPoints.length > 100) {
      data.storyPoints = data.storyPoints.slice(-100);
    }
    
    await redis.setex(key, 86400, JSON.stringify(data)); // 24 hour expiry
  }

  /**
   * Handle n8n webhook callbacks
   */
  async handleWebhookCallback(payload, signature) {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    const { workflowId, requestId, status, result, error } = payload;
    
    logger.info('n8n webhook callback received', { workflowId, requestId, status });
    
    // Store result in Redis for async processing
    if (status === 'success') {
      await redis.setex(`n8n:result:${requestId}`, 300, JSON.stringify(result));
    } else if (status === 'error') {
      await redis.setex(`n8n:error:${requestId}`, 300, JSON.stringify(error));
    }
    
    return { received: true, requestId };
  }

  /**
   * Get workflow execution status
   */
  async getWorkflowStatus(requestId) {
    const result = await redis.get(`n8n:result:${requestId}`);
    const error = await redis.get(`n8n:error:${requestId}`);
    
    if (result) {
      return { status: 'completed', result: JSON.parse(result) };
    } else if (error) {
      return { status: 'error', error: JSON.parse(error) };
    } else {
      return { status: 'pending' };
    }
  }

  /**
   * Batch process multiple AI requests
   */
  async batchProcess(requests) {
    const results = await Promise.allSettled(
      requests.map(req => {
        switch (req.type) {
          case 'npc':
            return this.generateNPCDialogue(req.context);
          case 'story':
            return this.generateStoryContent(req.context);
          case 'artwork':
            return this.generateArtwork(req.context);
          case 'voice':
            return this.generateVoiceNarration(req.context);
          case 'quest':
            return this.generateQuest(req.context);
          default:
            return Promise.reject(new Error(`Unknown request type: ${req.type}`));
        }
      })
    );

    return results.map((result, index) => ({
      id: requests[index].id,
      type: requests[index].type,
      status: result.status,
      value: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  }
}

module.exports = new N8nIntegrationService();