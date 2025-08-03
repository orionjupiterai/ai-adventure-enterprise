@echo off
cls
echo ====================================
echo    IMMERSIVE AI RPG - QUICK START
echo ====================================
echo.

REM Check if backend is already running
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is already running on port 3001
) else (
    echo [..] Starting backend server...
    cd backend
    start /min "RPG Backend" cmd /c "npm run dev:minimal"
    cd ..
    timeout /t 5 /nobreak > nul
)

REM Start frontend
echo [..] Starting frontend server...
cd frontend

REM Find an available port
set PORT=3000
:findport
netstat -an | findstr ":%PORT%" >nul 2>&1
if %errorlevel% equ 0 (
    set /a PORT+=1
    if %PORT% gtr 3010 (
        echo [ERROR] No available ports found
        pause
        exit /b 1
    )
    goto findport
)

echo [..] Using port %PORT% for frontend...
start "RPG Frontend" cmd /k "npx vite --port %PORT% --strictPort"

timeout /t 8 /nobreak > nul

echo.
echo ====================================
echo    GAME IS READY!
echo ====================================
echo.
echo Backend API: http://localhost:3001/health
echo Frontend UI: http://localhost:%PORT%
echo.
echo Opening browser...
timeout /t 2 /nobreak > nul
start http://localhost:%PORT%

echo.
echo Press any key to stop all servers...
pause > nul

taskkill /FI "WindowTitle eq RPG Backend*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq RPG Frontend*" /T /F >nul 2>&1
echo Servers stopped.