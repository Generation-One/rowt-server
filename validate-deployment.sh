#!/bin/bash

# Rowt Deployment Validation Script
# This script validates that all required files are present for deployment

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

ERRORS=0

print_info "Validating Rowt deployment setup..."

# Check required files
REQUIRED_FILES=(
    "Dockerfile"
    ".dockerignore"
    "docker-compose.yml"
    "docker-compose.standalone.yml"
    ".env.example"
    "package.json"
    "tsconfig.json"
    "nest-cli.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file is missing"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check .dockerignore doesn't exclude .env.example
if grep -q "^\.env\.example$" .dockerignore 2>/dev/null; then
    print_error "✗ .env.example is excluded in .dockerignore"
    print_info "  Fix: Remove '.env.example' line from .dockerignore"
    ERRORS=$((ERRORS + 1))
else
    print_success "✓ .env.example is not excluded in .dockerignore"
fi

# Check if Docker is running
if docker info >/dev/null 2>&1; then
    print_success "✓ Docker is running"
else
    print_error "✗ Docker is not running or not accessible"
    print_info "  Fix: Start Docker Desktop or Docker daemon"
    ERRORS=$((ERRORS + 1))
fi

# Check if docker-compose is available
if command -v docker-compose >/dev/null 2>&1; then
    print_success "✓ docker-compose is available"
else
    print_error "✗ docker-compose is not available"
    print_info "  Fix: Install Docker Compose"
    ERRORS=$((ERRORS + 1))
fi

# Check .env file
if [ -f ".env" ]; then
    print_success "✓ .env file exists"
    
    # Check for required environment variables
    REQUIRED_VARS=(
        "ROWT_JWT_SECRET"
        "ROWT_ADMIN_EMAIL"
        "ROWT_ADMIN_PASSWORD"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" .env; then
            print_success "✓ $var is set in .env"
        else
            print_warning "⚠ $var is not set in .env"
        fi
    done
else
    print_warning "⚠ .env file not found (will be created from template)"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    print_success "All validation checks passed! Ready for deployment."
    echo ""
    print_info "To deploy:"
    print_info "  With Traefik:    ./deploy.sh --with-traefik"
    print_info "  Standalone:      ./deploy.sh --standalone"
    exit 0
else
    print_error "Found $ERRORS error(s). Please fix them before deploying."
    exit 1
fi
