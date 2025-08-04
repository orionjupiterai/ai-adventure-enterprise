# Video Guide for Landing Page

## Video Specifications

### 1. Standard 16:9 Video (Recommended)
- **Resolution**: 1920×1080 (Full HD)
- **File Size**: Keep under 10MB for fast loading
- **Format**: MP4 (H.264 codec)
- **Length**: 10-30 seconds (loops seamlessly)

### 2. Ultra-wide 21:9 Video (Cinematic)
- **Resolution**: 2560×1080
- **Best for**: Wide desktop screens
- **Effect**: More cinematic, dramatic feel

### 3. Square 4:3 Video (Classic)
- **Resolution**: 1440×1080
- **Best for**: Balanced view on all devices
- **Effect**: Less cropping on mobile devices

## Free Video Resources

### Option 1: Pexels (Free Stock Videos)
1. Visit: https://www.pexels.com/videos/
2. Search for:
   - "space"
   - "fantasy landscape"
   - "particles"
   - "abstract loop"
   - "game background"

### Option 2: Mixkit (Free Video Loops)
1. Visit: https://mixkit.co/free-stock-video/
2. Categories:
   - Technology
   - Abstract
   - Nature (for fantasy feel)

### Option 3: Coverr (Free Background Videos)
1. Visit: https://coverr.co/
2. Perfect for landing pages
3. Pre-optimized for web

## How to Add Your Video

1. **Download your chosen video**
2. **Rename it** to something simple like `background.mp4`
3. **Upload to Hostinger**:
   - Go to File Manager
   - Create a folder called `videos` in public_html
   - Upload your video there

4. **Update the HTML** (line 14):
```html
<source src="/videos/background.mp4" type="video/mp4">
```

## Video Optimization Tips

### Compress Your Video:
- Use HandBrake (free): https://handbrake.fr/
- Settings:
  - Format: MP4
  - Video Codec: H.264
  - Quality: RF 23-25
  - Audio: Remove if not needed

### Make it Loop Seamlessly:
- First and last frames should match
- No sudden movements at start/end
- Subtle, continuous motion works best

## Recommended Video Themes for Your Game

1. **Fantasy/RPG Theme**:
   - Magical particles
   - Floating islands
   - Mystical forest
   - Castle in clouds

2. **Sci-Fi Theme**:
   - Space nebula
   - Digital rain
   - Circuit patterns
   - Futuristic city

3. **Abstract Theme**:
   - Flowing colors
   - Geometric patterns
   - Light trails
   - Particle effects

## Quick Test Videos

For testing, you can use these free video URLs directly:

```html
<!-- Option 1: Abstract Particles -->
<source src="https://cdn.videvo.net/videvo_files/video/free/2015-04/large_watermarked/Particles_Wave_4K_Motion_Background_Loop_preview.mp4" type="video/mp4">

<!-- Option 2: Space Theme -->
<source src="https://cdn.videvo.net/videvo_files/video/free/2019-11/large_watermarked/190915_A_04_Galaxie_1080p_preview.mp4" type="video/mp4">

<!-- Option 3: Digital Theme -->
<source src="https://www.w3schools.com/howto/rain.mp4" type="video/mp4">
```

Note: These are for testing only. Upload your own video for production.