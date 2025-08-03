# n8n Workflow Configurations for Adventure Platform

This directory contains n8n workflow configurations for the Adventure Platform's AI integration system. These workflows are designed to be imported into your n8n instance running on Hostinger VPS.

## Workflow Overview

### 1. **grok-npc-dialogue.json**
- Generates dynamic NPC dialogue using xAI Grok API
- Features conversation memory and personality traits
- Caches responses for performance optimization

### 2. **multi-provider-story.json**
- Orchestrates story generation across multiple AI providers
- Uses Grok, OpenAI, and Claude for comprehensive narratives
- Merges and analyzes responses for best results

### 3. **midjourney-artwork.json**
- Primary: Midjourney via Discord bot integration
- Fallback: xAI Grok image generation
- Handles style parameters and aspect ratios

### 4. **voice-narration.json**
- Primary: ElevenLabs with emotion-aware synthesis
- Fallback: Google Text-to-Speech
- Character voice mapping and audio file management

### 5. **content-moderation.json**
- Multi-provider content analysis
- Structured reasoning for moderation decisions
- Configurable thresholds per content category

### 6. **quest-generation.json**
- Procedural quest creation with branching narratives
- Dynamic objectives based on player skills
- Quest state tracking and progression management

## Setup Instructions

### 1. Import Workflows

1. Open your n8n instance
2. Navigate to Workflows
3. Click "Import from File"
4. Select each JSON file and import

### 2. Configure Credentials

You'll need to set up the following credentials in n8n:

#### xAI (Grok) Credentials
- Type: Header Auth
- Name: `xaiApiKey`
- Value: Your xAI API key

#### OpenAI Credentials
- Type: Header Auth
- Name: `openaiApiKey`
- Value: Your OpenAI API key

#### Claude (Anthropic) Credentials
- Type: Header Auth
- Name: `claudeApiKey`
- Value: Your Anthropic API key

#### ElevenLabs Credentials
- Type: Header Auth
- Name: `elevenLabsApiKey`
- Value: Your ElevenLabs API key

#### Discord Bot Credentials (for Midjourney)
- Type: Header Auth
- Name: `discordBotToken`
- Value: Your Discord bot token
- Additional fields:
  - `midjourneyAppId`: Midjourney application ID
  - `discordGuildId`: Your Discord server ID
  - `discordChannelId`: Channel ID for image generation

#### Google Cloud Credentials
- Type: OAuth2
- Name: `googleCloudAccessToken`
- Scope: `https://www.googleapis.com/auth/cloud-platform`

#### AWS S3 Credentials (for file storage)
- Type: AWS
- Name: `awsCredentials`
- Access Key ID and Secret Access Key
- Additional fields:
  - `s3BucketName`: Your S3 bucket name
  - `awsRegion`: AWS region (e.g., us-east-1)

#### Redis Credentials
- Type: Redis
- Host: Your Redis host
- Port: 6379
- Password: Your Redis password (if set)

### 3. Update Webhook URLs

After importing, update the webhook URLs in your `.env` file:

```env
N8N_BASE_URL=https://your-n8n-instance.hostinger.com
N8N_GROK_NPC_WORKFLOW=webhook/[workflow-id-from-n8n]
N8N_STORY_GEN_WORKFLOW=webhook/[workflow-id-from-n8n]
N8N_ARTWORK_GEN_WORKFLOW=webhook/[workflow-id-from-n8n]
N8N_VOICE_NARRATION_WORKFLOW=webhook/[workflow-id-from-n8n]
N8N_MODERATION_WORKFLOW=webhook/[workflow-id-from-n8n]
N8N_QUEST_GEN_WORKFLOW=webhook/[workflow-id-from-n8n]
```

### 4. Activate Workflows

1. Open each imported workflow
2. Click the toggle to activate
3. Test the webhook endpoint

## Testing Workflows

### Test NPC Dialogue
```bash
curl -X POST https://your-n8n-instance.hostinger.com/webhook/[grok-npc-workflow-id] \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "characterName": "Wise Elder",
      "playerInput": "Tell me about the ancient prophecy",
      "context": {
        "location": "Temple of Wisdom",
        "timeOfDay": "evening"
      }
    }
  }'
```

### Test Story Generation
```bash
curl -X POST https://your-n8n-instance.hostinger.com/webhook/[story-gen-workflow-id] \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "providers": ["grok", "openai", "claude"],
      "worldData": {
        "worldInfo": {
          "theme": "fantasy adventure"
        },
        "locations": {}
      },
      "playerChoices": [],
      "storyPoint": "The hero enters the dark forest"
    }
  }'
```

## Monitoring and Maintenance

### Performance Monitoring
- Check n8n execution history for performance metrics
- Monitor Redis cache hit rates
- Track API usage across providers

### Error Handling
- All workflows include error handling nodes
- Failed executions are logged with details
- Automatic fallback to secondary providers

### Scaling Considerations
- Adjust Redis TTL values based on usage patterns
- Configure n8n worker processes for high load
- Set up webhook rate limiting if needed

## Troubleshooting

### Common Issues

1. **Webhook not responding**
   - Ensure workflow is activated
   - Check n8n logs for errors
   - Verify webhook URL is correct

2. **API errors**
   - Verify credentials are correctly configured
   - Check API rate limits
   - Ensure API keys have necessary permissions

3. **Redis connection issues**
   - Verify Redis is running
   - Check connection credentials
   - Ensure Redis has enough memory

### Debug Mode
Enable debug mode in n8n for detailed execution logs:
```bash
export N8N_LOG_LEVEL=debug
```

## Security Best Practices

1. Use environment variables for sensitive data
2. Implement webhook authentication
3. Regularly rotate API keys
4. Monitor for unusual activity
5. Keep n8n and dependencies updated

## Support

For issues specific to:
- n8n configuration: Check n8n documentation
- AI provider APIs: Refer to provider documentation
- Adventure Platform integration: Check the main project documentation