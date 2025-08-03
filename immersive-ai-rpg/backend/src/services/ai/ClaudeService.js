import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/errors.js';

export class ClaudeService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    
    this.defaultModel = 'claude-3-opus-20240229';
    this.maxTokens = 4096;
  }

  async generateNarrative(context) {
    try {
      const prompt = this.buildNarrativePrompt(context);
      
      const response = await this.anthropic.messages.create({
        model: this.defaultModel,
        max_tokens: this.maxTokens,
        temperature: 0.8,
        system: this.getSystemPrompt('narrative'),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const narrative = response.content[0].text;
      
      logger.info('Generated narrative', { 
        contextType: context.type,
        length: narrative.length,
      });

      return this.parseNarrativeResponse(narrative);
    } catch (error) {
      logger.error('Failed to generate narrative', error);
      throw new AppError('Failed to generate narrative', 500);
    }
  }

  async generateDialogue(npc, context, playerChoice = null) {
    try {
      const prompt = this.buildDialoguePrompt(npc, context, playerChoice);
      
      const response = await this.anthropic.messages.create({
        model: this.defaultModel,
        max_tokens: 1024,
        temperature: 0.7,
        system: this.getSystemPrompt('dialogue', npc),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const dialogue = response.content[0].text;
      
      return this.parseDialogueResponse(dialogue);
    } catch (error) {
      logger.error('Failed to generate dialogue', error);
      throw new AppError('Failed to generate dialogue', 500);
    }
  }

  async processPlayerAction(action, gameState) {
    try {
      const prompt = this.buildActionPrompt(action, gameState);
      
      const response = await this.anthropic.messages.create({
        model: this.defaultModel,
        max_tokens: 2048,
        temperature: 0.6,
        system: this.getSystemPrompt('gamemaster'),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const result = response.content[0].text;
      
      return this.parseActionResponse(result);
    } catch (error) {
      logger.error('Failed to process player action', error);
      throw new AppError('Failed to process action', 500);
    }
  }

  async generateWorldDetails(worldConfig, specificRequest = null) {
    try {
      const prompt = this.buildWorldPrompt(worldConfig, specificRequest);
      
      const response = await this.anthropic.messages.create({
        model: this.defaultModel,
        max_tokens: 3000,
        temperature: 0.9,
        system: this.getSystemPrompt('worldbuilder'),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const worldDetails = response.content[0].text;
      
      return this.parseWorldResponse(worldDetails);
    } catch (error) {
      logger.error('Failed to generate world details', error);
      throw new AppError('Failed to generate world details', 500);
    }
  }

  // System prompts for different contexts
  getSystemPrompt(type, additionalContext = null) {
    const prompts = {
      narrative: `You are a master storyteller for an immersive RPG game. 
        Create vivid, engaging narratives that respond dynamically to player actions.
        Balance description with action, maintain consistent tone, and always 
        leave room for player agency. Format responses as JSON with the following structure:
        {
          "narrative": "main narrative text",
          "sceneDetails": "environmental details",
          "atmosphere": "mood and atmosphere description",
          "choices": ["available player actions"]
        }`,
        
      dialogue: `You are roleplaying as ${additionalContext?.name || 'an NPC'} 
        in an immersive RPG. ${additionalContext?.personality || ''}
        Respond in character, maintaining consistent personality and knowledge.
        Format responses as JSON with the following structure:
        {
          "speech": "what the character says",
          "action": "what the character does",
          "emotion": "character's emotional state",
          "choices": ["player response options"]
        }`,
        
      gamemaster: `You are the game master of an immersive RPG. 
        Process player actions fairly, creating logical consequences and 
        maintaining game balance. Consider the current game state and 
        ensure continuity. Format responses as JSON with outcomes and state changes.`,
        
      worldbuilder: `You are a world builder creating rich, detailed game environments.
        Generate coherent, immersive locations with history, culture, and 
        interesting features. Ensure logical geography and compelling points of interest.
        Format responses as structured JSON with locations, NPCs, and lore.`,
    };

    return prompts[type] || prompts.narrative;
  }

  // Prompt builders
  buildNarrativePrompt(context) {
    return `
      Current Scene: ${context.location}
      Player State: Level ${context.playerLevel}, ${context.playerClass}
      Recent Actions: ${context.recentActions.join(', ')}
      World State: ${JSON.stringify(context.worldState)}
      
      Generate an engaging narrative for this scene, considering the player's 
      recent actions and current state. Include environmental details and 
      suggest 3-5 meaningful actions the player can take.
    `;
  }

  buildDialoguePrompt(npc, context, playerChoice) {
    return `
      NPC: ${npc.name} (${npc.role})
      Personality: ${npc.personality}
      Current Context: ${context.situation}
      Player Relationship: ${context.relationship}
      ${playerChoice ? `Player said/did: "${playerChoice}"` : 'Initial greeting'}
      
      Generate an in-character response that advances the conversation 
      and provides 3-4 meaningful dialogue options for the player.
    `;
  }

  buildActionPrompt(action, gameState) {
    return `
      Player Action: ${action.type} - ${action.description}
      Current Location: ${gameState.location}
      Player Stats: HP ${gameState.player.hp}/${gameState.player.maxHp}, 
                    Level ${gameState.player.level}
      Inventory: ${gameState.player.inventory.map(i => i.name).join(', ')}
      Active Quests: ${gameState.quests.active.map(q => q.title).join(', ')}
      
      Process this action and determine the outcome. Consider success/failure,
      consequences, state changes, and narrative description of what happens.
      Format as JSON with: outcome, stateChanges, narrative, and newChoices.
    `;
  }

  buildWorldPrompt(worldConfig, specificRequest) {
    return `
      World Theme: ${worldConfig.theme}
      Setting: ${worldConfig.setting}
      Key Features: ${worldConfig.features.join(', ')}
      ${specificRequest ? `Specific Request: ${specificRequest}` : ''}
      
      Generate detailed world information including locations, NPCs, 
      lore, and points of interest. Ensure consistency with the theme 
      and create compelling, explorable content.
    `;
  }

  // Response parsers
  parseNarrativeResponse(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      // Fallback for non-JSON responses
      return {
        narrative: response,
        sceneDetails: '',
        atmosphere: '',
        choices: ['Look around', 'Move forward', 'Go back'],
      };
    }
  }

  parseDialogueResponse(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        speech: response,
        action: '',
        emotion: 'neutral',
        choices: ['Continue', 'Ask something else', 'Leave'],
      };
    }
  }

  parseActionResponse(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        outcome: 'success',
        stateChanges: {},
        narrative: response,
        newChoices: [],
      };
    }
  }

  parseWorldResponse(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        locations: [],
        npcs: [],
        lore: response,
        pointsOfInterest: [],
      };
    }
  }
}