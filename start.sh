#!/bin/bash

# Rowt Server Deployment Script
# This script helps deploy and manage your Rowt server using Docker Compose

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker and Docker Compose are available"
}

# Function to check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        setup_env
        print_warning "Please edit .env file with your configuration before continuing."
        print_warning "At minimum, update ROWT_ADMIN_EMAIL and ROWT_ADMIN_PASSWORD"
        exit 1
    fi
    print_success ".env file found"
}

# Function to generate a secure JWT secret
generate_jwt_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -hex 32
    else
        # Fallback method using /dev/urandom
        head -c 32 /dev/urandom | xxd -p -c 32
    fi
}

# Function to check and setup Traefik network
setup_traefik_network() {
    print_status "Checking Traefik network..."

    NETWORK_NAME=${TRAEFIK_NETWORK:-traefik}

    if ! docker network ls | grep -q "$NETWORK_NAME"; then
        print_status "Creating Traefik network: $NETWORK_NAME"
        docker network create "$NETWORK_NAME"
        print_success "Traefik network created"
    else
        print_success "Traefik network already exists"
    fi
}

# Function to setup environment
setup_env() {
    print_status "Setting up environment configuration..."

    if [ ! -f .env ]; then
        cp .env.example .env

        # Generate a secure JWT secret
        JWT_SECRET=$(generate_jwt_secret)
        sed -i "s/your-secure-jwt-secret-here-change-this-in-production/$JWT_SECRET/" .env

        # Generate a secure admin password
        ADMIN_PASSWORD=$(generate_jwt_secret | cut -c1-16)
        sed -i "s/change-this-secure-password/$ADMIN_PASSWORD/" .env

        print_success "Environment file created with secure credentials"
        print_success "Generated admin password: $ADMIN_PASSWORD"
        print_warning "Please edit .env file to set your admin email and domain:"
        print_warning "- ROWT_ADMIN_EMAIL (currently: admin@example.com)"
        print_warning "- DOMAIN (currently: rowt.localhost)"
        print_warning "- ACME_EMAIL (for Let's Encrypt certificates)"
    else
        print_success "Environment file already exists"
    fi
}

# Function to start services
start_services() {
    print_status "Starting Rowt server services..."

    # Setup Traefik network first
    setup_traefik_network

    # Build and start services
    docker-compose up -d --build

    print_success "Services started successfully"

    # Wait a moment for services to initialize
    print_status "Waiting for services to initialize..."
    sleep 10

    # Check service health
    print_status "Checking service health..."

    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Docker services are running"

        # Try to check health endpoint
        DOMAIN=$(grep "^DOMAIN=" .env 2>/dev/null | cut -d'=' -f2 || echo "rowt.localhost")

        # Check both HTTP and HTTPS endpoints
        if curl -f -k "http://$DOMAIN/health" &> /dev/null || curl -f -k "https://$DOMAIN/health" &> /dev/null; then
            print_success "Rowt server is healthy and responding at $DOMAIN"
        elif curl -f "http://localhost:3000/health" &> /dev/null; then
            print_success "Rowt server is healthy and responding on localhost:3000"
        else
            print_warning "Rowt server may still be starting up. Check logs with: ./start.sh logs"
            print_warning "You can also try accessing: http://$DOMAIN or http://localhost:3000"
        fi
    else
        print_error "Some services failed to start. Check logs with: ./start.sh logs"
    fi
}

# Function to stop services
stop_services() {
    print_status "Stopping Rowt server services..."
    docker-compose down
    print_success "Services stopped"
}

# Function to show logs
show_logs() {
    print_status "Showing service logs (press Ctrl+C to exit)..."
    docker-compose logs -f
}

# Function to show status
show_status() {
    print_status "Service status:"
    docker-compose ps
    
    print_status "Resource usage:"
    docker stats --no-stream
}

# Function to start Traefik
start_traefik() {
    print_status "Starting Traefik reverse proxy..."

    if docker ps | grep -q "traefik"; then
        print_success "Traefik is already running"
        return
    fi

    if [ -f docker-compose.traefik.yml ]; then
        docker-compose -f docker-compose.traefik.yml up -d
        print_success "Traefik started successfully"
        print_status "Traefik dashboard available at: http://traefik.${DOMAIN:-localhost}:8080"
    else
        print_error "docker-compose.traefik.yml not found"
        exit 1
    fi
}

# Function to stop Traefik
stop_traefik() {
    print_status "Stopping Traefik reverse proxy..."

    if [ -f docker-compose.traefik.yml ]; then
        docker-compose -f docker-compose.traefik.yml down
        print_success "Traefik stopped"
    else
        print_warning "docker-compose.traefik.yml not found"
    fi
}

# Function to backup database
backup_database() {
    print_status "Creating database backup..."

    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"

    if docker-compose exec -T postgres pg_dump -U rowt_user rowt_db > "$BACKUP_FILE"; then
        print_success "Database backup created: $BACKUP_FILE"
    else
        print_error "Failed to create database backup"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "Rowt Server Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup         Setup environment configuration"
    echo "  start         Start the Rowt server services"
    echo "  stop          Stop the Rowt server services"
    echo "  restart       Restart the Rowt server services"
    echo "  logs          Show service logs"
    echo "  status        Show service status and resource usage"
    echo "  backup        Create database backup"
    echo ""
    echo "Traefik Commands:"
    echo "  traefik-start Start Traefik reverse proxy"
    echo "  traefik-stop  Stop Traefik reverse proxy"
    echo ""
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup          # Setup environment for first time"
    echo "  $0 traefik-start  # Start Traefik (if not already running)"
    echo "  $0 start          # Start Rowt server services"
    echo "  $0 logs           # View logs"
    echo "  $0 backup         # Create database backup"
    echo ""
    echo "Quick Start:"
    echo "  1. $0 setup       # Configure environment"
    echo "  2. Edit .env file with your settings"
    echo "  3. $0 traefik-start (optional, if you don't have Traefik)"
    echo "  4. $0 start       # Start the server"
}

# Main script logic
case "${1:-}" in
    "start")
        check_docker
        check_env
        start_services
        ;;
    "stop")
        check_docker
        stop_services
        ;;
    "restart")
        check_docker
        check_env
        print_status "Restarting services..."
        docker-compose down
        setup_traefik_network
        docker-compose up -d --build
        print_success "Services restarted"
        ;;
    "logs")
        check_docker
        show_logs
        ;;
    "status")
        check_docker
        show_status
        ;;
    "setup")
        check_docker
        setup_env
        ;;
    "backup")
        check_docker
        backup_database
        ;;
    "traefik-start")
        check_docker
        start_traefik
        ;;
    "traefik-stop")
        check_docker
        stop_traefik
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        print_error "No command specified"
        show_help
        exit 1
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
