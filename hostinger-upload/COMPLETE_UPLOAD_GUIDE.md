# Complete Upload Guide for Hostinger

## What You Now Have:

### 1. **index.html** - Login Page
- Video background (customizable)
- Functional login system
- Demo account support
- Error/success messages

### 2. **game.html** - Game Interface
- Protected page (requires login)
- Game menu with options
- Sample gameplay mechanics
- Responsive design

### 3. **video-guide.md** - Video Instructions
- How to choose videos
- Where to find free videos
- Optimization tips

## Upload Steps:

### Step 1: Prepare Your Video
1. Choose a video (16:9 recommended)
2. Keep it under 10MB
3. Name it `background.mp4`

### Step 2: Upload to Hostinger
1. **Login to Hostinger**
2. Go to **File Manager**
3. Navigate to **public_html**
4. **Create a folder** called `videos`
5. **Upload files**:
   - `index.html` (to public_html)
   - `game.html` (to public_html)
   - `background.mp4` (to videos folder)

### Step 3: Update Video Path
In index.html, change line 14:
```html
<source src="/videos/background.mp4" type="video/mp4">
```

### Step 4: Update API URL (For Production)
In index.html, change line 94:
```javascript
const API_URL = 'https://your-backend-api.com';
```
(Keep as localhost for now if no backend deployed)

## File Structure on Hostinger:
```
public_html/
├── index.html
├── game.html
└── videos/
    └── background.mp4
```

## Testing Your Site:

1. Visit: https://seagreen-wombat-500044.hostingersite.com/
2. Try the "Use Demo Account" button
3. Login with demo credentials
4. You'll be redirected to game.html

## Demo Credentials:
- **Email**: demo@immersive-rpg.com
- **Password**: DemoAccount123!

## What's Working:
- ✅ Login page with video background
- ✅ Authentication system
- ✅ Game interface after login
- ✅ Logout functionality
- ✅ Sample game mechanics

## Next Steps:
1. Upload these files to Hostinger
2. Add your own video
3. Connect real backend when ready
4. Expand game functionality

Your site is ready to go live!