@echo off
title Oysterponds Invoice System - First Time Setup
color 0B

echo ============================================
echo    OYSTERPONDS INVOICE SYSTEM
echo    FIRST TIME INSTALLATION
echo ============================================
echo.
echo This will install all required dependencies.
echo Please wait, this may take a few minutes...
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ============================================
    echo    ERROR: Node.js is not installed!
    echo ============================================
    echo.
    echo Please download and install Node.js from:
    echo    https://nodejs.org
    echo.
    echo After installing, run this script again.
    echo.
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

:: Get the directory where this script is located
set SCRIPT_DIR=%~dp0

:: Install backend dependencies
echo ============================================
echo [1/3] Installing backend dependencies...
echo ============================================
cd /d "%SCRIPT_DIR%server"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!
echo.

:: Build backend TypeScript
echo ============================================
echo [2/3] Building backend...
echo ============================================
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build backend
    pause
    exit /b 1
)
echo Backend built successfully!
echo.

:: Install frontend dependencies
echo ============================================
echo [3/3] Installing frontend dependencies...
echo ============================================
cd /d "%SCRIPT_DIR%client"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully!
echo.

echo ============================================
echo    INSTALLATION COMPLETE!
echo ============================================
echo.
echo You can now run the application by
echo double-clicking "start-app.bat"
echo.
echo ============================================
pause
