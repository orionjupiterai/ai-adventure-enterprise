@echo off
echo Cleaning up old processes...

REM Kill all Node.js processes
taskkill /F /IM node.exe 2>nul
echo Node processes terminated.

timeout /t 2 /nobreak > nul

echo Starting fresh servers...
echo.

REM Start backend
cd backend
start "RPG Backend" cmd /k "npm run dev:minimal"

timeout /t 5 /nobreak > nul

REM Start frontend  
cd ../frontend
start "RPG Frontend" cmd /k "npx vite --host 0.0.0.0 --port 3000"

timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo Servers should be running at:
echo Backend:  http://localhost:3001/health
echo Frontend: http://localhost:3000
echo ========================================
echo.
pause