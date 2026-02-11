@echo off
title Oysterponds Invoice System
color 0A

echo ============================================
echo    OYSTERPONDS INVOICE SYSTEM
echo ============================================
echo.
echo Starting the application... Please wait.
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Get the directory where this script is located
set SCRIPT_DIR=%~dp0

:: Start the backend server
echo [1/3] Starting backend server...
cd /d "%SCRIPT_DIR%server"
start /min cmd /c "npm run dev"

:: Wait for backend to start
echo [2/3] Waiting for server to initialize...
timeout /t 5 /nobreak >nul

:: Start the frontend
echo [3/3] Starting frontend...
cd /d "%SCRIPT_DIR%client"
start /min cmd /c "npm run dev"

:: Wait for frontend to start
timeout /t 8 /nobreak >nul

:: Open the browser
echo.
echo ============================================
echo    APPLICATION STARTED SUCCESSFULLY!
echo ============================================
echo.
echo Opening browser...
start "" "http://localhost:8080"

echo.
echo The app is now running!
echo.
echo To STOP the application, close this window
echo and press Ctrl+C in the terminal windows.
echo.
echo ============================================
echo    DO NOT CLOSE THIS WINDOW
echo ============================================
echo.

:: Keep window open
pause
