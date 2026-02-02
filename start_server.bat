@echo off
title UAV Web Backend
cd /d "%~dp0"
echo Starting UAV Web Backend...
echo.
echo If this window closes immediately, something went wrong.
echo.
call npm run dev
pause
