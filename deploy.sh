#!/bin/bash

# Rowt Deployment Script
# This script helps deploy Rowt with or without Traefik

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
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

show_help() {
    echo "Rowt Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --with-traefik     Deploy with Traefik reverse proxy (default)"
    echo "  --standalone       Deploy without Traefik (direct port exposure)"
    echo "  --port PORT        Port to expose in standalone mode (default: 3000)"
    echo "  --build            Force rebuild of Docker images"
    echo "  --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy with Traefik"
    echo "  $0 --standalone              # Deploy without Traefik on port 3000"
    echo "  $0 --standalone --port 8080  # Deploy without Traefik on port 8080"
    echo "  $0 --build                   # Rebuild and deploy with Traefik"
}

# Default values
USE_TRAEFIK=true
PORT=3000
FORCE_BUILD=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --with-traefik)
            USE_TRAEFIK=true
            shift
            ;;
        --standalone)
            USE_TRAEFIK=false
            shift
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --build)
            FORCE_BUILD=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

print_info "Starting Rowt deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before continuing."
    print_warning "At minimum, update ROWT_JWT_SECRET, ROWT_ADMIN_EMAIL, and ROWT_ADMIN_PASSWORD"
    exit 1
fi

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose down

# Build if requested
if [ "$FORCE_BUILD" = true ]; then
    print_info "Building Docker images..."
    docker-compose build --no-cache
fi

# Deploy based on mode
if [ "$USE_TRAEFIK" = true ]; then
    print_info "Deploying with Traefik reverse proxy..."
    docker-compose up -d
    print_success "Deployment complete!"
    print_info "Application will be available at: https://${DOMAIN:-rowt.localhost}"
else
    print_info "Deploying in standalone mode on port $PORT..."
    ROWT_PORT=$PORT docker-compose -f docker-compose.yml -f docker-compose.standalone.yml up -d
    print_success "Deployment complete!"
    print_info "Application is available at: http://localhost:$PORT"
fi

# Show status
print_info "Container status:"
docker-compose ps
