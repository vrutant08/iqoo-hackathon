@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo.
echo  ___              _        ___      _       _
echo ^| _ \_ _ ___ _ __^| ^|_ ___ ^| _ \__ _^| ^|_ __ ^| ^|_
echo ^|  _/ '_/ _ \ '_ \  _/ _ \^|  _/ _` ^|  _/ _/ ^|  _^|
echo ^|_^| ^|_^| \___/ .__/\__\___/^|_^| \__,_^|\__\__^|_^|\__^|
echo            ^|_^|
echo.
echo  [Backend] Starting ProtoPatch API Server...
echo  =========================================
echo.

:: Navigate to backend directory
cd /d "%~dp0\backend"

:: Check for Python
python --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERROR] Python not found. Please install Python 3.12+
    echo         Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

FOR /F "tokens=*" %%i IN ('python --version 2^>^&1') DO SET PY_VERSION=%%i
echo [OK] Found %PY_VERSION%

:: Create virtual environment if it doesn't exist
IF NOT EXIST ".venv" (
    echo [SETUP] Creating virtual environment...
    python -m venv .venv
    IF ERRORLEVEL 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
)

:: Activate virtual environment
echo [SETUP] Activating virtual environment...
call .venv\Scripts\activate.bat
IF ERRORLEVEL 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

:: Install/upgrade dependencies
echo [SETUP] Installing dependencies (this may take a few minutes on first run)...
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
IF ERRORLEVEL 1 (
    echo [ERROR] Failed to install dependencies
    echo         Try running: pip install -r requirements.txt
    pause
    exit /b 1
)
echo [OK] Dependencies installed

:: Check for .env file
IF NOT EXIST "..\\.env" (
    IF EXIST "..\\.env.example" (
        echo.
        echo [WARN] .env file not found!
        echo        Copying .env.example to .env — please edit it with your API keys.
        copy "..\\.env.example" "..\\.env" >nul
        echo        File created: %~dp0.env
        echo.
        echo        REQUIRED: Add your GEMINI_API_KEY to .env
        echo        OPTIONAL: Add GITHUB_TOKEN for PR creation
        echo.
    )
) ELSE (
    echo [OK] .env file found
)

:: Run Django migrations
echo [SETUP] Running database migrations...
python manage.py migrate --run-syncdb --no-input >nul 2>&1
echo [OK] Database ready

:: Start development server
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  ProtoPatch Backend is RUNNING!                      ║
echo  ║                                                      ║
echo  ║  Local:    http://localhost:8000/api/health/         ║
echo  ║  LAN:      http://0.0.0.0:8000/api/health/          ║
echo  ║                                                      ║
echo  ║  Press Ctrl+C to stop the server                     ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

python manage.py runserver 0.0.0.0:8000

ENDLOCAL
