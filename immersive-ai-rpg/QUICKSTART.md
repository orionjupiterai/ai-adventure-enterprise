# Quick Start Guide

## Fixing the Registration Error

The "Unexpected token '<'" error occurs when the backend isn't running. Here's how to fix it:

### Option 1: Use the Minimal Backend (Recommended for Testing)

1. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start the Minimal Backend:**
   ```bash
   npm run dev:minimal
   ```
   
   This starts a simplified backend on port 3001 that:
   - Doesn't require external services (database, Redis, etc.)
   - Stores data in memory (resets on restart)
   - Has working registration and login endpoints

3. **In a new terminal, start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Test the Application:**
   - Open http://localhost:3000
   - Click "Begin Your Adventure"
   - Create a new account or use the demo account:
     - Email: `demo@immersive-rpg.com`
     - Password: `DemoAccount123!`

### Option 2: Use the Start Script (Windows)

Double-click `start-dev.bat` in the project root. This will:
- Install dependencies if needed
- Start both backend and frontend
- Open two terminal windows

### Option 3: Use the Start Script (Mac/Linux)

```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Option 4: Full Docker Setup

1. **Create a `.env` file in the project root:**
   ```env
   CLAUDE_API_KEY=your-claude-api-key
   OPENAI_API_KEY=your-openai-api-key
   JWT_SECRET=your-secret-key-here
   ```

2. **Start with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

## Troubleshooting

### Backend Not Starting
- Check if port 3001 is already in use
- Make sure you have Node.js 18+ installed
- Check for missing dependencies: `npm install`

### Frontend Can't Connect to Backend
- Ensure backend is running on port 3001
- Check the browser console for CORS errors
- Verify the proxy configuration in `vite.config.js`

### Registration Still Failing
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to register
4. Check if the request goes to `http://localhost:3000/api/auth/register`
5. Check the response - it should be JSON, not HTML

## Test Endpoints

With the minimal backend running, you can test these endpoints:

- **Health Check:** http://localhost:3001/health
- **Register:** POST to http://localhost:3001/api/auth/register
- **Login:** POST to http://localhost:3001/api/auth/login

## Next Steps

Once you have the minimal version working:
1. Set up your database (PostgreSQL)
2. Configure environment variables
3. Switch to the full backend (`npm run dev` instead of `dev:minimal`)
4. Add AI service API keys for full functionality