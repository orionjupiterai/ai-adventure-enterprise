@echo off
echo Starting Immersive AI RPG...
echo.

REM Kill any existing Node processes
taskkill /F /IM node.exe >nul 2>&1

REM Start backend
echo Starting backend server...
cd backend
start "RPG Backend" cmd /k "npm run dev:minimal"
cd ..

timeout /t 5 /nobreak

REM Start frontend
echo Starting frontend server...
cd frontend
start "RPG Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ====================================
echo Game starting...
echo ====================================
echo Backend: http://localhost:3001/health
echo Frontend: http://localhost:5173
echo.
echo Opening game in browser...
timeout /t 5 /nobreak
start http://localhost:5173

echo.
echo Press any key to stop servers...
pause
taskkill /F /IM node.exe