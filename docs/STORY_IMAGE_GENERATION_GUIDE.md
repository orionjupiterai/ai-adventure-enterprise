# Story State Change Image Generation Guide

This guide explains the image generation workflow triggered by story state changes in the Adventure Platform.

## Overview

When significant story events occur (location changes, boss encounters, dramatic reveals), the system automatically generates contextual images using Midjourney as the primary provider with Grok as fallback.

## Workflow Flow

```
Story State Change → Generate Prompt → Check Cache → Try Midjourney → If Failed, Try Grok → Cache & Return
```

## Trigger Events

The following story change types trigger automatic image generation:

- `location_change` - Player enters new area
- `major_event` - Significant story development
- `boss_encounter` - Boss battle begins
- `puzzle_solved` - Major puzzle completion
- `chapter_start` - New chapter begins
- `dramatic_reveal` - Plot twist or revelation
- `environment_shift` - Weather/time changes

## Request Structure

### Triggering Image Generation

```javascript
POST /webhook/story-image-trigger
{
  "storyId": "story_123",
  "chapterId": "chapter_3",
  "sceneId": "scene_456",
  "changeType": "location_change",
  
  // Visual Context
  "location": "Ancient Crystal Cavern",
  "timeOfDay": "night",
  "weather": "stormy",
  "mood": "mysterious",
  
  // Characters
  "characters": [
    {
      "name": "Elena the Mage",
      "appearance": "robed figure with glowing staff"
    },
    {
      "name": "Shadow Guardian",
      "appearance": "ethereal dark entity"
    }
  ],
  
  // Style Preferences
  "worldTheme": "fantasy",
  "artStyle": "digital painting",
  "colorPalette": "dark blues and purples",
  
  // Narrative Context
  "narrative": "The crystal cavern reveals ancient secrets as magical energies pulse through the air",
  "emotionalTone": "tense",
  "previousScene": "Traveled through the enchanted forest",
  
  // Technical Settings
  "aspectRatio": "16:9",
  "quality": "high",
  "priority": "normal"
}
```

## Prompt Generation

The system generates optimized prompts for each provider:

### Midjourney Prompt Structure

```
[Scene Description], [Style Modifiers], [Mood Lighting], [Time of Day], [Art Style], [Character Descriptions] --ar 16:9 --quality 2 --style raw --v 6
```

Example:
```
Ancient Crystal Cavern with pulsing magical energies, fantasy art, magical atmosphere, ethereal lighting, mysterious fog, dim lighting, enigmatic shadows, moonlight, stars visible, nocturnal atmosphere, digital painting, highly detailed, artstation quality, featuring robed figure with glowing staff, ethereal dark entity --ar 16:9 --quality 2 --style raw --v 6
```

### Grok Prompt Structure

```
Create a [Art Style] image of: [Scene]. The scene is set in a [World Theme] world during [Time of Day]. The mood should be [Mood] with [Emotional Tone] emotional undertones. Weather: [Weather]. Characters in scene: [Character Names]. Art style: [Style Details].
```

## Provider Logic

### 1. Cache Check
- Cache key: `scene:{storyId}:{changeType}:{location}`
- TTL: 24 hours
- Returns immediately if found

### 2. Midjourney (Primary)
- Discord bot integration
- Webhook-based response
- Average processing: 45-60 seconds
- High quality artistic renders

### 3. Grok Fallback
- Direct API call
- Faster processing: 10-20 seconds
- Good quality, style-aware

### 4. Ultimate Fallback
- Placeholder image generation
- Color scheme based on theme
- Immediate response

## Response Format

### Success Response
```json
{
  "success": true,
  "imageUrl": "https://cdn.midjourney.com/generated/abc123_1.png",
  "thumbnailUrl": "https://cdn.midjourney.com/generated/abc123_1_thumb.png",
  "provider": "midjourney",
  "variations": [
    "https://cdn.midjourney.com/generated/abc123_v1.png",
    "https://cdn.midjourney.com/generated/abc123_v2.png"
  ],
  "metadata": {
    "requestId": "req_789",
    "storyId": "story_123",
    "chapterId": "chapter_3",
    "sceneId": "scene_456",
    "changeType": "location_change",
    "processingTime": 45000,
    "cached": false,
    "cacheHit": false
  }
}
```

### Cached Response
```json
{
  "success": true,
  "imageUrl": "https://cdn.midjourney.com/generated/xyz789_1.png",
  "metadata": {
    "cacheHit": true,
    "cachedAt": "2024-01-20T10:30:00Z",
    "ttlRemaining": 82800
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Both image generation providers failed",
    "midjourney": "Rate limit exceeded",
    "grok": "API timeout"
  },
  "fallbackUrl": "https://via.placeholder.com/1024x576/...",
  "metadata": {
    "requestId": "req_789"
  }
}
```

## Integration Examples

### Backend Integration

```javascript
// Story state change handler
async function handleStoryStateChange(gameSession, changeData) {
  // Check if change requires image
  if (shouldGenerateImage(changeData.changeType)) {
    const imageRequest = {
      storyId: gameSession.storyId,
      chapterId: gameSession.currentChapter,
      sceneId: generateSceneId(),
      changeType: changeData.changeType,
      location: changeData.newLocation,
      timeOfDay: gameSession.worldState.timeOfDay,
      weather: gameSession.worldState.weather,
      mood: detectMood(changeData),
      characters: getVisibleCharacters(gameSession),
      worldTheme: gameSession.worldInfo.theme,
      artStyle: gameSession.worldInfo.artStyle || 'digital painting',
      narrative: changeData.narrative,
      emotionalTone: changeData.emotionalTone
    };
    
    const imageResult = await triggerImageGeneration(imageRequest);
    
    // Store image URL with scene
    await updateSceneImage(gameSession.id, changeData.sceneId, imageResult);
    
    // Emit to connected clients
    io.to(gameSession.id).emit('scene-image-ready', {
      sceneId: changeData.sceneId,
      imageUrl: imageResult.imageUrl,
      thumbnailUrl: imageResult.thumbnailUrl
    });
  }
}

// Trigger n8n workflow
async function triggerImageGeneration(requestData) {
  const response = await fetch(`${process.env.N8N_BASE_URL}/webhook/story-image-trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET
    },
    body: JSON.stringify(requestData)
  });
  
  return await response.json();
}
```

### Frontend Integration

```javascript
// React component for scene images
function SceneImage({ sceneId, storyId }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Listen for image ready events
    socket.on('scene-image-ready', (data) => {
      if (data.sceneId === sceneId) {
        setImageUrl(data.imageUrl);
        setLoading(false);
      }
    });
    
    // Fetch existing image
    fetchSceneImage(sceneId).then(url => {
      if (url) {
        setImageUrl(url);
        setLoading(false);
      }
    });
  }, [sceneId]);
  
  if (loading) {
    return <ImagePlaceholder mood={scene.mood} theme={worldTheme} />;
  }
  
  return (
    <div className="scene-image-container">
      <img 
        src={imageUrl} 
        alt={scene.description}
        className="scene-image"
        loading="lazy"
      />
      <ImageVariations sceneId={sceneId} />
    </div>
  );
}
```

## Style Guidelines

### Fantasy Worlds
- Magical atmosphere, ethereal lighting
- Rich colors, mystical elements
- Detailed environments

### Sci-Fi Worlds
- Futuristic, cyberpunk aesthetics
- Neon colors, technological elements
- Clean, modern designs

### Horror Worlds
- Dark fantasy, gothic atmosphere
- Muted colors, dramatic shadows
- Atmospheric dread

### Historical Worlds
- Period-appropriate settings
- Classical art style
- Authentic details

## Performance Optimization

### Caching Strategy
- Scene-based caching (24 hour TTL)
- Thumbnail generation for quick loading
- Progressive image loading

### Request Prioritization
- `high`: Boss encounters, chapter starts
- `normal`: Location changes, events
- `low`: Minor environmental shifts

### Batch Processing
- Queue multiple requests
- Process in priority order
- Prevent duplicate generations

## Monitoring

Track these metrics:
- Provider success rates
- Average generation times
- Cache hit rates
- Error frequencies
- Cost per image by provider

## Troubleshooting

### Common Issues

1. **Midjourney Timeout**
   - Check Discord bot status
   - Verify webhook configuration
   - Monitor Discord rate limits

2. **Poor Image Quality**
   - Review prompt generation
   - Check style parameters
   - Verify scene context completeness

3. **Cache Misses**
   - Validate cache key generation
   - Check Redis connection
   - Monitor TTL settings

4. **Slow Response Times**
   - Enable request prioritization
   - Implement queue management
   - Use thumbnails for preview

## Best Practices

1. **Prompt Engineering**
   - Include specific visual details
   - Use consistent style descriptors
   - Balance detail with creativity

2. **Resource Management**
   - Cache aggressively
   - Use thumbnails for lists
   - Lazy load full images

3. **Error Handling**
   - Always provide fallbacks
   - Log provider failures
   - Monitor cost thresholds

4. **User Experience**
   - Show loading states
   - Provide image variations
   - Allow manual regeneration