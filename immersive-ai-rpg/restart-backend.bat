@echo off
echo Restarting backend with updated CORS settings...
cd backend
taskkill /FI "WindowTitle eq *Backend*" /T /F >nul 2>&1
timeout /t 2 /nobreak > nul
start "RPG Backend" cmd /k "npm run dev:minimal"
echo Backend restarted! Please wait 5 seconds...
timeout /t 5 /nobreak > nul
echo Done! Check http://localhost:3002/debug.html again