@echo off
title Stopping Oysterponds App
color 0C

echo ============================================
echo    STOPPING OYSTERPONDS INVOICE SYSTEM
echo ============================================
echo.

echo Stopping Node.js processes...

:: Kill all node processes
taskkill /F /IM node.exe >nul 2>&1

echo.
echo All processes stopped successfully!
echo.
pause
