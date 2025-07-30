# Rowt Server - Docker & Traefik Ready

A production-ready, containerized deployment of [Rowt](https://github.com/Rowt-Deeplinks/create-rowt-server) - the self-hosted deep linking solution.

> **📖 For complete Rowt documentation and features, see the [Original Rowt README](./ORIGINAL_README.md)**

## 🚀 Quick Start

This fork provides a complete Docker-based deployment solution with Traefik integration for secure, production-ready hosting.

### Prerequisites

- Docker & Docker Compose
- Existing Traefik reverse proxy (with Let's Encrypt)
- Domain name (e.g., `rowt.generation.one`)

### 1. Clone and Configure

```bash
git clone <this-repo>
cd rowt
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your settings:

```bash
# Domain Configuration
DOMAIN=rowt.generation.one
TRAEFIK_NETWORK=traefik

# Database (PostgreSQL recommended)
ROWT_DATABASE_URL=postgresql://rowt_user:rowt_password@postgres:5432/rowt_db

# Security (IMPORTANT: Change these!)
ROWT_JWT_SECRET=your-secure-32-character-secret-here
ROWT_ADMIN_EMAIL=admin@yourdomain.com
ROWT_ADMIN_PASSWORD=your-secure-password

# Single-tenant mode (recommended)
ROWT_TENANT_MODE=single-tenant
```

### 3. Deploy

#### Option A: With Traefik (Recommended for Production)
```bash
# Using the deployment script
./deploy.sh --with-traefik

# Or manually
docker-compose up -d
```

#### Option B: Standalone (Without Traefik)
```bash
# Using the deployment script (port 3000)
./deploy.sh --standalone

# Using the deployment script (custom port)
./deploy.sh --standalone --port 8080

# Or manually
ROWT_PORT=3000 docker-compose -f docker-compose.yml -f docker-compose.standalone.yml up -d
```

#### Windows Users
```cmd
REM With Traefik
deploy.bat --with-traefik

REM Standalone
deploy.bat --standalone --port 3000
```

**Access your application:**
- **With Traefik**: `https://rowt.generation.one` (or your configured domain)
- **Standalone**: `http://localhost:3000` (or your configured port)

## 🔧 Configuration

### Traefik Integration

This deployment assumes you have Traefik already running. The configuration includes:

- **Automatic HTTPS** via Let's Encrypt
- **HTTP to HTTPS redirect**
- **Security headers**
- **External Traefik network** connection

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Your domain name | `rowt.generation.one` |
| `TRAEFIK_NETWORK` | Traefik network name | `traefik` |
| `ROWT_TENANT_MODE` | Single or multi-tenant | `single-tenant` |
| `ROWT_JWT_SECRET` | JWT signing secret | `32-char-random-string` |
| `ROWT_ADMIN_EMAIL` | Admin email | `admin@yourdomain.com` |
| `ROWT_ADMIN_PASSWORD` | Admin password | `secure-password` |

### Database Options

**PostgreSQL (Recommended for Production):**
```env
ROWT_DATABASE_URL=postgresql://user:pass@postgres:5432/rowt_db
ROWT_DB_TYPE=postgres
ROWT_DB_SSL=false
```

**SQLite (Development/Small Scale):**
```env
ROWT_DATABASE_URL=sqlite:database.sqlite
ROWT_DB_TYPE=sqlite
```

## 📁 Project Structure

```
rowt/
├── docker-compose.yml          # Main deployment configuration
├── docker-compose.override.yml # Development overrides
├── Dockerfile                  # Multi-stage production build
├── .env.example               # Environment template
├── init-db.sql               # Database initialization
├── start.sh / start.bat      # Deployment scripts
├── DEPLOYMENT.md             # Detailed deployment guide
├── ORIGINAL_README.md        # Original Rowt documentation
└── src/                      # Rowt server source code
```

## 🛠️ Management

### Using the Helper Scripts

**Linux/macOS:**
```bash
./start.sh setup    # Initial setup
./start.sh start    # Start services
./start.sh logs     # View logs
./start.sh backup   # Backup database
./start.sh stop     # Stop services
```

**Windows:**
```cmd
start.bat setup    # Initial setup
start.bat start    # Start services
start.bat logs     # View logs
start.bat backup   # Backup database
start.bat stop     # Stop services
```

### Manual Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f rowt-server

# Stop services
docker-compose down

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Database backup
docker-compose exec postgres pg_dump -U rowt_user rowt_db > backup.sql
```

## 🔒 Security Features

- **Non-root container** execution
- **Multi-stage Docker build** for minimal attack surface
- **Automatic HTTPS** via Traefik + Let's Encrypt
- **Security headers** configured
- **HTTP to HTTPS redirect** enforced
- **Rate limiting** built-in
- **JWT-based authentication**

## 📊 Monitoring & Health Checks

- **Health endpoint**: `https://yourdomain.com/health`
- **Docker health checks** configured
- **Traefik dashboard** integration
- **Structured logging** available

## 🔄 Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
./deploy.sh --build

# Or manually
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verify update
curl https://yourdomain.com/health
```

## 🔧 Troubleshooting

### Deployment Error: ".env.example not found"
If you encounter this error during deployment:
```
failed to compute cache key: "/.env.example": not found
```

**Solution**: Make sure `.env.example` exists and is not excluded by `.dockerignore`:
```bash
# Check if file exists
ls -la .env.example

# If missing, recreate it
git checkout .env.example

# Rebuild
docker-compose build --no-cache
```

### Port Already in Use
If you get port conflicts:
```bash
# Use a different port
./deploy.sh --standalone --port 8080

# Or find what's using the port
netstat -tulpn | grep :3000
```

## 📚 Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Comprehensive deployment instructions
- **[Original Rowt README](./ORIGINAL_README.md)** - Complete Rowt documentation
- **[Rowt Official Docs](https://docs.rowt.app)** - Official documentation

## 🆚 What's Different from Original

This fork adds:

- ✅ **Production-ready Dockerfile** with multi-stage build
- ✅ **Traefik integration** with automatic HTTPS
- ✅ **Docker Compose** setup with PostgreSQL
- ✅ **Security hardening** and best practices
- ✅ **Health checks** and monitoring
- ✅ **Deployment scripts** for easy management
- ✅ **Comprehensive documentation**

## 🤝 Contributing

This is a deployment-focused fork. For Rowt core features and issues:
- **Core Rowt Issues**: [Rowt-Deeplinks/create-rowt-server](https://github.com/Rowt-Deeplinks/create-rowt-server)
- **Deployment Issues**: Create issues in this repository

## 📄 License

Same as original Rowt project. See [ORIGINAL_README.md](./ORIGINAL_README.md) for details.

---

**🔗 [Original Rowt Project](https://github.com/Rowt-Deeplinks/create-rowt-server)** | **📖 [Rowt Documentation](https://docs.rowt.app)** | **🚀 [Deployment Guide](./DEPLOYMENT.md)**