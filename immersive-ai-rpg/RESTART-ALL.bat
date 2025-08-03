@echo off
cls
echo ====================================
echo    RESTARTING ALL SERVERS
echo ====================================
echo.

echo [1/4] Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node processes terminated
) else (
    echo [OK] No Node processes were running
)

timeout /t 3 /nobreak > nul

echo.
echo [2/4] Starting backend server...
cd backend
start "RPG Backend - Minimal" cmd /k "npm run dev:minimal"
cd ..

echo [..] Waiting for backend to start...
timeout /t 5 /nobreak > nul

:checkbackend
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [..] Still waiting for backend...
    timeout /t 2 /nobreak > nul
    goto checkbackend
)
echo [OK] Backend is running!

echo.
echo [3/4] Starting frontend server...
cd frontend
start "RPG Frontend" cmd /k "npx vite --port 3002 --strictPort"
cd ..

echo [..] Waiting for frontend to start...
timeout /t 5 /nobreak > nul

echo.
echo [4/4] Testing connections...
timeout /t 2 /nobreak > nul

echo.
echo ====================================
echo    SERVERS ARE READY!
echo ====================================
echo.
echo Backend:  http://localhost:3001/health
echo Frontend: http://localhost:3002
echo Debug:    http://localhost:3002/debug.html
echo.
echo Opening debug page to verify everything works...
start http://localhost:3002/debug.html
echo.
echo If the debug page shows:
echo - "JavaScript is working!" (green)
echo - "Backend API: Backend is running!" (green)
echo Then everything is working!
echo.
echo Press any key to stop all servers...
pause > nul

taskkill /FI "WindowTitle eq RPG Backend*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq RPG Frontend*" /T /F >nul 2>&1
echo Servers stopped.