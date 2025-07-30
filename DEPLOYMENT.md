# Rowt Server Deployment Guide

This guide provides comprehensive instructions for deploying your Rowt server using Docker and Docker Compose in single-tenant mode.

## 🚀 Quick Start

### Prerequisites

- Docker (version 20.10 or later)
- Docker Compose (version 2.0 or later)
- Git (for cloning the repository)
- **Existing Traefik reverse proxy** with Let's Encrypt configured
- Domain name pointing to your server (e.g., `rowt.generation.one`)

### 1. Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your configuration:
   ```bash
   # Required: Domain configuration
   DOMAIN=rowt.generation.one
   TRAEFIK_NETWORK=traefik

   # Required: Generate a secure JWT secret
   ROWT_JWT_SECRET=your-secure-32-character-secret-here

   # Required: Set admin credentials
   ROWT_ADMIN_EMAIL=your-admin@example.com
   ROWT_ADMIN_PASSWORD=your-secure-password
   ```

### 2. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f rowt-server

# Check service status
docker-compose ps
```

### 3. Verify Deployment

1. Check if the server is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Access the admin interface:
   - URL: `http://localhost:3000`
   - Email: (as configured in `.env`)
   - Password: (as configured in `.env`)

## 📋 Configuration Details

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ROWT_TENANT_MODE` | Tenant mode (single-tenant/multi-tenant) | `single-tenant` | Yes |
| `ROWT_DATABASE_URL` | Database connection string | PostgreSQL URL | Yes |
| `ROWT_DB_TYPE` | Database type (postgres/sqlite) | `postgres` | Yes |
| `ROWT_JWT_SECRET` | JWT signing secret (32+ chars) | - | Yes |
| `ROWT_ADMIN_EMAIL` | Admin email address | - | Yes |
| `ROWT_ADMIN_PASSWORD` | Admin password | - | Yes |
| `PORT` | Server port | `3000` | No |

### Database Configuration

#### PostgreSQL (Recommended for Production)

The default Docker Compose setup uses PostgreSQL with these settings:
- **Database**: `rowt_db`
- **User**: `rowt_user`
- **Password**: `rowt_password`
- **Port**: `5432`

#### SQLite (Development/Small Scale)

To use SQLite instead:
1. Update `.env`:
   ```
   ROWT_DATABASE_URL=sqlite:database.sqlite
   ROWT_DB_TYPE=sqlite
   ```
2. Remove the PostgreSQL service from `docker-compose.yml`

## 🔧 Production Deployment

### Security Considerations

1. **Change Default Passwords**: Update all default passwords in `.env`
2. **Secure JWT Secret**: Generate a cryptographically secure JWT secret:
   ```bash
   openssl rand -hex 32
   ```
3. **Database Security**: Use strong database passwords and consider network isolation
4. **SSL/TLS**: Configure HTTPS using a reverse proxy (see Nginx section below)

### Nginx Reverse Proxy (Optional)

For production deployments with SSL, uncomment the Nginx service in `docker-compose.yml` and create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream rowt-server {
        server rowt-server:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://rowt-server;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Backup Strategy

#### Database Backups

For PostgreSQL:
```bash
# Create backup
docker-compose exec postgres pg_dump -U rowt_user rowt_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U rowt_user rowt_db < backup.sql
```

For SQLite:
```bash
# Backup SQLite database
docker-compose exec rowt-server cp /app/database.sqlite /app/backup.sqlite
```

#### Automated Backups

Add to your crontab:
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/rowt && docker-compose exec postgres pg_dump -U rowt_user rowt_db > backups/backup-$(date +\%Y\%m\%d).sql
```

## 🛠️ Management Commands

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart rowt-server

# View logs
docker-compose logs -f rowt-server
docker-compose logs -f postgres

# Update and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Management

```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U rowt_user -d rowt_db

# Run database migrations (if needed)
docker-compose exec rowt-server npm run migration:run

# Check database status
docker-compose exec postgres pg_isready -U rowt_user -d rowt_db
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if PostgreSQL container is running: `docker-compose ps`
   - Verify database credentials in `.env`
   - Check logs: `docker-compose logs postgres`

2. **Server Won't Start**
   - Check environment variables in `.env`
   - Verify JWT secret is set and valid
   - Check logs: `docker-compose logs rowt-server`

3. **Port Already in Use**
   - Change the port mapping in `docker-compose.yml`:
     ```yaml
     ports:
       - "3001:3000"  # Use port 3001 instead
     ```

4. **Permission Denied**
   - Ensure Docker has proper permissions
   - Check file ownership: `ls -la`

### Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# Check database connectivity
docker-compose exec rowt-server node -e "console.log('DB connection test')"

# Monitor resource usage
docker stats
```

### Log Analysis

```bash
# Follow all logs
docker-compose logs -f

# Filter logs by service
docker-compose logs -f rowt-server | grep ERROR

# Export logs
docker-compose logs --no-color > deployment.log
```

## 📊 Monitoring

### Basic Monitoring

Monitor your deployment with:
```bash
# Resource usage
docker stats

# Service health
docker-compose ps

# Disk usage
docker system df
```

### Production Monitoring

Consider implementing:
- **Prometheus + Grafana** for metrics
- **ELK Stack** for log aggregation
- **Uptime monitoring** services
- **Database monitoring** tools

## 🔄 Updates

### Updating Rowt Server

1. Pull latest changes:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. Verify the update:
   ```bash
   docker-compose logs -f rowt-server
   curl http://localhost:3000/health
   ```

## 📞 Support

- **Documentation**: [https://docs.rowt.app](https://docs.rowt.app)
- **GitHub Issues**: [Rowt Server Issues](https://github.com/Rowt-Deeplinks/create-rowt-server/issues)
- **Community**: [Rowt Discord/Forum](https://docs.rowt.app)

---

**Note**: This deployment guide assumes single-tenant mode. For multi-tenant deployments, additional configuration for user management and Stripe integration may be required.
