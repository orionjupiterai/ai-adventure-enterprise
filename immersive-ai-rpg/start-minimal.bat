@echo off
echo Starting Immersive AI RPG (Minimal Mode)...
echo.
echo This runs a simplified backend that doesn't require external services.
echo Data is stored in memory and will be lost when you stop the servers.
echo.

REM Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists in backend
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
)

REM Check if node_modules exists in frontend
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
)

REM Start minimal backend in new window
echo Starting minimal backend server...
start "Minimal Backend Server" cmd /k "cd backend && npm run dev:minimal"

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

REM Test if backend is running
curl -s http://localhost:3001/health >nul 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Backend might not be running yet. Continuing anyway...
)

REM Start frontend in new window
echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

REM Wait a bit more
timeout /t 3 /nobreak > nul

echo.
echo ====================================
echo Servers are starting...
echo.
echo Backend:  http://localhost:3001/health
echo Frontend: http://localhost:3000
echo.
echo Demo Account:
echo Email: demo@immersive-rpg.com
echo Password: DemoAccount123!
echo ====================================
echo.
echo Press any key to stop all servers...
pause > nul

REM Kill the processes
taskkill /FI "WindowTitle eq Minimal Backend Server*" /T /F >nul 2>nul
taskkill /FI "WindowTitle eq Frontend Server*" /T /F >nul 2>nul

echo Servers stopped.