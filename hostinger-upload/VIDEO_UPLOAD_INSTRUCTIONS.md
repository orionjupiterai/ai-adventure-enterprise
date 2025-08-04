# Video Upload Instructions for Hostinger

## What's New:
Your login page now randomly rotates through 6 different videos on each visit!

## Features:
- **Random Selection**: Shows a different video each time someone visits
- **Smart Rotation**: Avoids showing the same video twice in a row
- **Seamless Loading**: Videos autoplay with smooth transitions
- **Fallback**: Purple gradient background if video fails to load

## Upload Steps:

### 1. Prepare Your Videos
Your 6 videos are located at:
```
C:\Users\User\Documents\images\
├── 1.mp4
├── 2.mp4
├── 3.mp4
├── 4.mp4
├── 5.mp4
└── 6.mp4
```

### 2. Upload to Hostinger

1. **Login to Hostinger** control panel
2. Go to **File Manager**
3. Navigate to **public_html**
4. **Create a new folder** called `videos`
5. **Upload all 6 videos** to the videos folder:
   - Select all 6 MP4 files
   - Upload them keeping the same names (1.mp4, 2.mp4, etc.)

### 3. Upload the Updated HTML
1. Upload the new `index.html` to **public_html** (replace the old one)
2. Upload `game.html` to **public_html**

## Final Structure on Hostinger:
```
public_html/
├── index.html
├── game.html
└── videos/
    ├── 1.mp4
    ├── 2.mp4
    ├── 3.mp4
    ├── 4.mp4
    ├── 5.mp4
    └── 6.mp4
```

## How It Works:
- First visit: Random video from all 6
- Page refresh: Different video (never the same one twice)
- New browser session: Starts fresh with all 6 options

## Testing:
1. Visit your site
2. Note which video plays
3. Refresh the page
4. A different video should play
5. Try in incognito mode for a fresh experience

## Tips:
- **Video Size**: Keep each video under 10-15MB for fast loading
- **Optimization**: Use HandBrake to compress if needed
- **Format**: MP4 with H.264 codec works best
- **Length**: 10-30 second loops are ideal

Your visitors will now see a fresh, dynamic background every time they visit!