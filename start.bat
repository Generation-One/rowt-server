@echo off
REM Rowt Server Deployment Script for Windows
REM This script helps deploy and manage your Rowt server using Docker Compose

setlocal enabledelayedexpansion

REM Function to print colored output (simplified for Windows)
:print_status
echo [INFO] %~1
goto :eof

:print_success
echo [SUCCESS] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

REM Function to check if Docker is installed and running
:check_docker
docker --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not installed. Please install Docker first."
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not running. Please start Docker first."
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit /b 1
)

call :print_success "Docker and Docker Compose are available"
goto :eof

REM Function to check if .env file exists
:check_env
if not exist .env (
    call :print_warning ".env file not found. Creating from template..."
    copy .env.example .env >nul
    call :print_warning "Please edit .env file with your configuration before continuing."
    call :print_warning "At minimum, update ROWT_JWT_SECRET, ROWT_ADMIN_EMAIL, and ROWT_ADMIN_PASSWORD"
    exit /b 1
)
call :print_success ".env file found"
goto :eof

REM Function to setup environment
:setup_env
call :print_status "Setting up environment configuration..."

if not exist .env (
    copy .env.example .env >nul
    call :print_success "Environment file created"
    call :print_warning "Please edit .env file to set your configuration:"
    call :print_warning "- Generate a secure JWT secret (32+ characters)"
    call :print_warning "- Set ROWT_ADMIN_EMAIL"
    call :print_warning "- Set ROWT_ADMIN_PASSWORD"
) else (
    call :print_success "Environment file already exists"
)
goto :eof

REM Function to start services
:start_services
call :print_status "Starting Rowt server services..."

REM Build and start services
docker-compose up -d --build
if errorlevel 1 (
    call :print_error "Failed to start services"
    exit /b 1
)

call :print_success "Services started successfully"

REM Wait a moment for services to initialize
timeout /t 5 /nobreak >nul

REM Check service health
call :print_status "Checking service health..."

curl -f http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    call :print_warning "Rowt server may still be starting up. Check logs with: docker-compose logs -f"
) else (
    call :print_success "Rowt server is healthy and responding"
)
goto :eof

REM Function to stop services
:stop_services
call :print_status "Stopping Rowt server services..."
docker-compose down
call :print_success "Services stopped"
goto :eof

REM Function to show logs
:show_logs
call :print_status "Showing service logs (press Ctrl+C to exit)..."
docker-compose logs -f
goto :eof

REM Function to show status
:show_status
call :print_status "Service status:"
docker-compose ps

call :print_status "Resource usage:"
docker stats --no-stream
goto :eof

REM Function to backup database
:backup_database
call :print_status "Creating database backup..."

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "datestamp=%YYYY%%MM%%DD%-%HH%%Min%%Sec%"

set "BACKUP_FILE=backup-%datestamp%.sql"

docker-compose exec -T postgres pg_dump -U rowt_user rowt_db > "%BACKUP_FILE%"
if errorlevel 1 (
    call :print_error "Failed to create database backup"
    exit /b 1
) else (
    call :print_success "Database backup created: %BACKUP_FILE%"
)
goto :eof

REM Function to show help
:show_help
echo Rowt Server Deployment Script for Windows
echo.
echo Usage: %~nx0 [COMMAND]
echo.
echo Commands:
echo   start     Start the Rowt server services
echo   stop      Stop the Rowt server services
echo   restart   Restart the Rowt server services
echo   logs      Show service logs
echo   status    Show service status and resource usage
echo   setup     Setup environment configuration
echo   backup    Create database backup
echo   help      Show this help message
echo.
echo Examples:
echo   %~nx0 setup     # Setup environment for first time
echo   %~nx0 start     # Start all services
echo   %~nx0 logs      # View logs
echo   %~nx0 backup    # Create database backup
goto :eof

REM Main script logic
if "%1"=="start" (
    call :check_docker
    if errorlevel 1 exit /b 1
    call :check_env
    if errorlevel 1 exit /b 1
    call :start_services
) else if "%1"=="stop" (
    call :check_docker
    if errorlevel 1 exit /b 1
    call :stop_services
) else if "%1"=="restart" (
    call :check_docker
    if errorlevel 1 exit /b 1
    call :check_env
    if errorlevel 1 exit /b 1
    call :print_status "Restarting services..."
    docker-compose down
    docker-compose up -d --build
    call :print_success "Services restarted"
) else if "%1"=="logs" (
    call :check_docker
    if errorlevel 1 exit /b 1
    call :show_logs
) else if "%1"=="status" (
    call :check_docker
    if errorlevel 1 exit /b 1
    call :show_status
) else if "%1"=="setup" (
    call :check_docker
    if errorlevel 1 exit /b 1
    call :setup_env
) else if "%1"=="backup" (
    call :check_docker
    if errorlevel 1 exit /b 1
    call :backup_database
) else if "%1"=="help" (
    call :show_help
) else if "%1"=="--help" (
    call :show_help
) else if "%1"=="-h" (
    call :show_help
) else if "%1"=="" (
    call :print_error "No command specified"
    call :show_help
    exit /b 1
) else (
    call :print_error "Unknown command: %1"
    call :show_help
    exit /b 1
)
