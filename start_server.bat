@echo off
title UAV Web Server
cd /d "%~dp0"
echo Building UAV Web (production)...
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo *** Build failed! Starting in dev mode instead. ***
    echo.
    call npm run dev
) else (
    echo.
    echo Starting UAV Web in production mode on port 3000...
    echo.
    call npm run start
)
pause
