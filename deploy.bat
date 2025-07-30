@echo off
setlocal enabledelayedexpansion

REM Rowt Deployment Script for Windows
REM This script helps deploy Rowt with or without Traefik

set "USE_TRAEFIK=true"
set "PORT=3000"
set "FORCE_BUILD=false"

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :start_deploy
if "%~1"=="--with-traefik" (
    set "USE_TRAEFIK=true"
    shift
    goto :parse_args
)
if "%~1"=="--standalone" (
    set "USE_TRAEFIK=false"
    shift
    goto :parse_args
)
if "%~1"=="--port" (
    set "PORT=%~2"
    shift
    shift
    goto :parse_args
)
if "%~1"=="--build" (
    set "FORCE_BUILD=true"
    shift
    goto :parse_args
)
if "%~1"=="--help" (
    goto :show_help
)
echo [ERROR] Unknown option: %~1
goto :show_help

:show_help
echo Rowt Deployment Script for Windows
echo.
echo Usage: %~nx0 [OPTIONS]
echo.
echo Options:
echo   --with-traefik     Deploy with Traefik reverse proxy (default)
echo   --standalone       Deploy without Traefik (direct port exposure)
echo   --port PORT        Port to expose in standalone mode (default: 3000)
echo   --build            Force rebuild of Docker images
echo   --help             Show this help message
echo.
echo Examples:
echo   %~nx0                           # Deploy with Traefik
echo   %~nx0 --standalone              # Deploy without Traefik on port 3000
echo   %~nx0 --standalone --port 8080  # Deploy without Traefik on port 8080
echo   %~nx0 --build                   # Rebuild and deploy with Traefik
exit /b 0

:start_deploy
echo [INFO] Starting Rowt deployment...

REM Check if .env file exists
if not exist .env (
    echo [WARNING] .env file not found. Creating from template...
    copy .env.example .env >nul
    echo [WARNING] Please edit .env file with your configuration before continuing.
    echo [WARNING] At minimum, update ROWT_JWT_SECRET, ROWT_ADMIN_EMAIL, and ROWT_ADMIN_PASSWORD
    exit /b 1
)

REM Stop existing containers
echo [INFO] Stopping existing containers...
docker-compose down

REM Build if requested
if "%FORCE_BUILD%"=="true" (
    echo [INFO] Building Docker images...
    docker-compose build --no-cache
)

REM Deploy based on mode
if "%USE_TRAEFIK%"=="true" (
    echo [INFO] Deploying with Traefik reverse proxy...
    docker-compose up -d
    echo [SUCCESS] Deployment complete!
    echo [INFO] Application will be available at: https://rowt.localhost
) else (
    echo [INFO] Deploying in standalone mode on port %PORT%...
    set "ROWT_PORT=%PORT%"
    docker-compose -f docker-compose.yml -f docker-compose.standalone.yml up -d
    echo [SUCCESS] Deployment complete!
    echo [INFO] Application is available at: http://localhost:%PORT%
)

REM Show status
echo [INFO] Container status:
docker-compose ps

exit /b 0
