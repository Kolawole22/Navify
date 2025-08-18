# Docker Setup Guide for Navify Backend

This guide explains how to run the Navify backend using Docker in both development and production environments.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- Make (optional, for convenience commands)

## Windows/WSL Setup

### Docker Desktop WSL 2 Integration

If you're using WSL 2 on Windows and getting "docker-compose could not be found":

1. **Enable WSL 2 Integration in Docker Desktop:**

   ```powershell
   # Open Docker Desktop → Settings → Resources → WSL Integration
   # Enable integration with your WSL 2 distro (Ubuntu, etc.)
   # Click "Apply & Restart"
   ```

2. **Verify Docker is accessible in WSL:**

   ```bash
   # In WSL terminal
   docker --version
   docker-compose --version
   ```

3. **Alternative: Use PowerShell instead of WSL:**

   ```powershell
   # Navigate to project in PowerShell
   cd C:\Users\USER\Desktop\monorepo\Navify\apps\server

   # Use PowerShell commands instead of make
   docker-compose -f docker-compose.dev.yml up --build
   ```

### Windows Command Alternatives

If `make` commands don't work, use these PowerShell equivalents:

| Make Command | PowerShell Alternative                                |
| ------------ | ----------------------------------------------------- |
| `make dev`   | `docker-compose -f docker-compose.dev.yml up --build` |
| `make prod`  | `docker-compose up --build`                           |
| `make logs`  | `docker-compose logs -f`                              |
| `make clean` | `docker-compose down -v --remove-orphans`             |

## Quick Start

### Development Environment

```powershell
# Clone and navigate to the project
cd apps/server

# Copy environment file and customize
copy env.example .env
# Edit .env with your specific values

# Start development environment with hot reload
make dev
# OR
docker-compose -f docker-compose.dev.yml up --build
```

### Production Environment

```powershell
# Set production environment variables
$env:JWT_SECRET="your-super-secure-jwt-secret-minimum-32-chars"
$env:SMS_API_KEY="your-sms-service-api-key"

# Start production environment
make prod
# OR
docker-compose up --build
```

## Architecture Overview

The Docker setup includes:

- **API Service**: Node.js/TypeScript backend with Express
- **PostgreSQL**: Primary database for user data and addresses
- **Redis**: Cache and OTP storage
- **Migration Service**: Handles database schema updates

### Network Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   API Service   │◄──►│   PostgreSQL    │    │     Redis       │
│   (Port 5001)   │    │   (Port 5432)   │    │   (Port 6379)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │
        ▼
┌─────────────────┐
│  External APIs  │
│ (SMS, Maps etc) │
└─────────────────┘
```

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://navify_user:navify_password@postgres:5432/navify_db

# Security
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long
JWT_EXPIRES_IN_SECONDS=2592000

# External Services
SMS_API_KEY=your-sms-service-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Redis
REDIS_URL=redis://redis:6379
```

### Development vs Production

| Environment | Database   | Hot Reload | Debug Port | SSL |
| ----------- | ---------- | ---------- | ---------- | --- |
| Development | navify_dev | ✅         | 9229       | ❌  |
| Production  | navify_db  | ❌         | ❌         | ✅  |

## Available Commands

### Make Commands (Recommended)

```powershell
make help           # Show all available commands
make dev            # Start development environment
make prod           # Start production environment
make logs           # View logs from all services
make migrate        # Run database migrations
make seed           # Seed database with initial data
make clean          # Clean up containers and volumes
make health         # Check health of all services
```

### Direct Docker Commands

```powershell
# Development
docker-compose -f docker-compose.dev.yml up --build
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose up --build
docker-compose down

# Database operations
docker-compose run --rm migrate
docker-compose exec postgres psql -U navify_user -d navify_db
```

## Database Management

### Running Migrations

```powershell
# Production
make migrate

# Development
make migrate-dev

# Manual migration
docker-compose run --rm api yarn drizzle:migrate
```

### Database Seeding

```powershell
# Seed with initial data
make seed

# Development seeding
make seed-dev
```

### Database Shell Access

```powershell
# Production database
make db-shell

# Development database
make db-shell-dev

# Manual access
docker-compose exec postgres psql -U navify_user -d navify_db
```

## Development Workflow

### 1. Initial Setup

```powershell
# Copy environment template
copy env.example .env

# Edit environment variables
notepad .env

# Start development environment
make dev
```

### 2. Making Changes

- Edit files in `src/` directory
- Changes auto-reload via nodemon
- View logs: `make logs-api`
- Access container: `make shell-dev`

### 3. Database Changes

```powershell
# Generate new migration
docker-compose -f docker-compose.dev.yml run --rm api-dev yarn drizzle:generate

# Apply migrations
make migrate-dev

# Restart API if needed
docker-compose -f docker-compose.dev.yml restart api-dev
```

### 4. Testing

```powershell
# Run tests in development environment
make test-dev

# Run specific tests
docker-compose -f docker-compose.dev.yml run --rm api-dev yarn test --testNamePattern="auth"
```

## Production Deployment

### 1. Environment Setup

```powershell
# Set production environment variables
$env:JWT_SECRET="your-production-jwt-secret"
$env:DATABASE_URL="postgresql://user:pass@prod-db:5432/navify"
$env:REDIS_URL="redis://prod-redis:6379"
$env:SMS_API_KEY="your-production-sms-key"
```

### 2. Security Considerations

- Use strong, unique JWT secrets
- Configure proper CORS origins
- Set up SSL/TLS termination (use reverse proxy like Nginx)
- Regular security updates
- Monitor logs and metrics

### 3. Scaling

```powershell
# Scale API service
docker-compose up --scale api=3

# With load balancer
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up
```

## Troubleshooting

### Common Issues

**1. Port Already in Use**

```powershell
# Find process using port 5001
netstat -ano | findstr :5001

# Kill process (replace PID)
taskkill /PID 1234 /F
```

**2. Database Connection Failed**

```powershell
# Check database logs
make logs-db

# Verify database is ready
docker-compose exec postgres pg_isready -U navify_user
```

**3. Migration Errors**

```powershell
# Reset database (DANGER: data loss)
docker-compose down -v
docker-compose up --build

# Check migration status
docker-compose run --rm api yarn drizzle:status
```

**4. Out of Memory**

```powershell
# Increase Docker memory limit in Docker Desktop settings
# Clean up unused containers and images
make clean-all
```

### Debug Mode

```powershell
# Start with debug enabled
docker-compose -f docker-compose.dev.yml up

# Attach debugger to port 9229
# In VS Code: F5 with "Node.js: Attach to Remote" configuration
```

### Logs and Monitoring

```powershell
# View all logs
make logs

# View specific service logs
make logs-api
make logs-db

# Follow logs in real-time
docker-compose logs -f api

# Export logs to file
docker-compose logs api > api.log 2>&1
```

## Performance Optimization

### Docker Image Optimization

- Multi-stage build reduces final image size by ~60%
- `.dockerignore` excludes unnecessary files
- Alpine Linux base image for smaller footprint
- Separate development and production configurations

### Database Performance

- Connection pooling enabled in Drizzle ORM
- Indexed columns for faster queries
- Separate read/write replicas for scaling

### Caching Strategy

- Redis for OTP storage and session caching
- Application-level caching for geographic data
- CDN for static assets

## Backup and Recovery

### Database Backup

```powershell
# Create backup
docker-compose exec postgres pg_dump -U navify_user navify_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U navify_user navify_db < backup.sql
```

### Volume Backup

```powershell
# Backup persistent volumes
docker run --rm -v navify_postgres_data:/data -v ${PWD}:/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

## CI/CD Integration

### Example GitHub Actions

```yaml
name: Deploy Backend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.yml up -d --build
```

### Health Checks

The setup includes comprehensive health checks:

- API endpoint: `GET /health`
- Database: `pg_isready` command
- Redis: `PING` command
- Container-level health monitoring

## Support

For issues or questions:

1. Check logs: `make logs`
2. Verify health: `make health`
3. Review this documentation
4. Check Docker Desktop status (Windows)
