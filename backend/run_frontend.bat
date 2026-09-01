@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo.
echo  ___              _        ___      _       _
echo ^| _ \_ _ ___ _ __^| ^|_ ___ ^| _ \__ _^| ^|_ __ ^| ^|_
echo ^|  _/ '_/ _ \ '_ \  _/ _ \^|  _/ _` ^|  _/ _/ ^|  _^|
echo ^|_^| ^|_^| \___/ .__/\__\___/^|_^| \__,_^|\__\__^|_^|\__^|
echo            ^|_^|
echo.
echo  [Frontend] Starting ProtoPatch PWA Server...
echo  =============================================
echo.

:: Navigate to frontend public directory
cd /d "%~dp0\frontend\public"

:: Check for Python (for http.server)
python --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERROR] Python not found. Please install Python 3.12+
    pause
    exit /b 1
)

:: Find a free port (try 3000, then 3001)
set PORT=3000
netstat -an 2>nul | find ":%PORT% " >nul
IF NOT ERRORLEVEL 1 (
    set PORT=3001
    netstat -an 2>nul | find ":%PORT% " >nul
    IF NOT ERRORLEVEL 1 (
        set PORT=3002
    )
)

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  ProtoPatch Frontend is RUNNING!                     ║
echo  ║                                                      ║
echo  ║  Browser URL:  http://localhost:%PORT%/              ║
echo  ║                                                      ║
echo  ║  Mobile Access (same WiFi):                          ║
echo  ║  1. Run: ipconfig ^| find "IPv4"                    ║
echo  ║  2. Open: http://YOUR_LAN_IP:%PORT%/ on phone       ║
echo  ║                                                      ║
echo  ║  Add to Home Screen for full PWA experience!         ║
echo  ║                                                      ║
echo  ║  Press Ctrl+C to stop the server                     ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: Open browser automatically
start "" "http://localhost:%PORT%/"

:: Start Python HTTP server (CORS-friendly, serves static files)
python -m http.server %PORT%

ENDLOCAL
