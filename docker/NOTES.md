# Technical Notes

Technical details and historical notes for Quiz Quest Docker deployment.

## Docker Compose v2 Migration

### Command Syntax Change

Docker Compose v2 changed the command syntax from `docker-compose` (hyphen) to `docker compose` (space).

**v1 (deprecated):**
```bash
docker-compose up -d
```

**v2 (current):**
```bash
docker compose up -d
```

### Important: Filenames Stay the Same

When migrating, **only change the command**, not the filenames:

✅ **Correct:**
```bash
docker compose -f docker-compose-native.yml up -d
#      ↑ space              ↑ hyphen (filename)
```

❌ **Incorrect:**
```bash
docker compose -f docker compose-native.yml up -d
#      ↑ space              ↑ space (WRONG!)
```

### Why Two Versions Exist

**Docker Compose v1 (`docker-compose`):**
- Standalone Python-based CLI
- Installed separately from Docker
- Being deprecated/EOL
- Command: `docker-compose` (hyphen)

**Docker Compose v2 (`docker compose`):**
- Built-in Docker CLI plugin (Go-based)
- Included with Docker Desktop / Docker CE 20.10+
- Current standard, actively maintained
- Command: `docker compose` (space)

## Session Management Fix

### Problem
Sessions not persisting in production (`NODE_ENV=production`) but working in development.

### Root Causes
1. `secure: true` cookie flag incompatible with proxies
2. Missing `SESSION_SECRET` environment variable
3. `sameSite: 'strict'` blocking cross-site requests

### Solution
Updated `api/src/config/session.ts`:

```typescript
// Detect if behind proxy (tunneling services)
const behindProxy = process.env.BEHIND_PROXY === 'true';

{
  cookie: {
    secure: !behindProxy,  // Disable secure flag when behind proxy
    httpOnly: true,
    sameSite: 'lax',       // Changed from 'strict'
    maxAge: 24 * 60 * 60 * 1000
  }
}
```

### Environment Variables
- `BEHIND_PROXY=true` - Set for localhost.run and Serveo deployments
- `SESSION_SECRET` - Required for session encryption (auto-generated if missing)

## CORS Configuration

### Wildcard Origin Support

Updated `api/src/config/cors.ts` to support wildcard patterns:

```typescript
origin: (origin, callback) => {
  const patterns = ['https://*.lhr.life', 'https://*.serveo.net'];
  // Match against patterns
}
```

Allows dynamic subdomains from tunneling services.

## Docker Profiles

### Native Deployment with Optional Nginx

The native deployment supports an optional Nginx reverse proxy using Docker Compose profiles:

```yaml
services:
  nginx:
    profiles: [with-nginx]
```

**Deploy with Nginx:**
```bash
docker compose -f docker-compose-native.yml --profile with-nginx up -d
```

**Important:** When stopping, you must include the profile flag:
```bash
docker compose -f docker-compose-native.yml --profile with-nginx down
```

Without the `--profile` flag, Docker Compose won't see the Nginx service and won't stop it.

### Why Profiles?

Profiles allow optional services without maintaining separate compose files. The Nginx service is only needed when:
- Running without a reverse proxy
- Testing SSL/TLS locally
- Need load balancing

## Network Cleanup Issue

### Problem
"Network not found" errors when restarting deployments after stopping.

### Cause
Docker networks can remain orphaned when containers are stopped, causing conflicts when trying to create new networks with the same name.

### Solution
Enhanced cleanup function to remove networks:

```bash
# Remove Quiz Quest networks
docker network ls --filter "name=quiz-quest" --format "{{.Name}}" | xargs -r docker network rm
docker network ls --filter "name=docker_quiz-quest" --format "{{.Name}}" | xargs -r docker network rm

# Prune unused networks
docker network prune -f
```

The `manage.sh` cleanup option (10) now removes:
- Containers
- Volumes
- Networks
- Dangling resources

## Tunneling Services

### localhost.run

**Pros:**
- Zero configuration
- Automatic HTTPS
- Fast setup

**Cons:**
- Random subdomain each restart
- Rate limits on free tier
- No custom domains

**Configuration:**
```bash
BEHIND_PROXY=true
CORS_ORIGINS=https://*.lhr.life
```

### Serveo.net

**Pros:**
- Custom subdomain support
- SSH-based (secure)
- Simple protocol

**Cons:**
- Requires SSH access
- Occasional downtime
- No guaranteed availability

**Configuration:**
```bash
BEHIND_PROXY=true
CORS_ORIGINS=https://*.serveo.net
```

## Image Build Strategy

### Multi-Stage Build

The Dockerfile uses multi-stage builds for optimized image size:

```dockerfile
# Stage 1: Build API
FROM node:18-alpine AS api-builder
# Build TypeScript

# Stage 2: Build Client
FROM node:18-alpine AS client-builder
# Build React app

# Stage 3: Production
FROM node:18-alpine
# Copy only built artifacts
```

Benefits:
- Smaller final image (no build tools)
- Faster deployments
- Better security (no dev dependencies)

## Script Design

### Interactive vs Direct

All deployment scripts support both modes:

**Interactive (default):**
```bash
./run-native.sh
# Prompts for all required values
```

**Direct (with environment):**
```bash
TEACHER_PASSWORD=pass123 SESSION_SECRET=abc... ./run-native.sh
# Uses environment variables, no prompts
```

### Error Handling

Scripts use `set -e` to exit on errors, ensuring:
- Failed commands are caught
- Cleanup happens before exit
- Clear error messages

## Security Considerations

### Session Secret

- Minimum 64 characters
- Hex-encoded random bytes
- Generated automatically if not provided (with warning)

### Cookie Settings

- `httpOnly: true` - Prevents XSS access
- `secure: true` - HTTPS only (disabled behind proxy)
- `sameSite: 'lax'` - CSRF protection while allowing navigation

### Environment Variables

Never commit `.env` files with:
- `TEACHER_PASSWORD`
- `SESSION_SECRET`
- Production credentials

## File Organization

### Production Standards

```
docker/
├── README.md              # User-facing documentation
├── NOTES.md               # Technical details (this file)
├── START_HERE.txt         # Quick start banner
├── README.txt             # Ultra-quick pointer
│
├── *.sh                   # Executable scripts
├── *.yml                  # Docker Compose configs
├── Dockerfile             # Image definition
└── nginx.conf             # Service configs
```

### Removed Files

Cleaned up unnecessary documentation:
- `IMPROVEMENTS.md` - Temporary solution documentation
- `SOLUTION_SUMMARY.md` - Temporary summary
- `STRUCTURE_SIMPLE.md` - Redundant structure doc
- `VISUAL_GUIDE.md` - Redundant visual guide
- `QUICK_REFERENCE.md` - Consolidated into README
- `DOCKER_COMPOSE_FIX.md` - Info moved to NOTES
- `DOCKER_COMPOSE_V2_UPDATE.md` - Info moved to NOTES

### Documentation Philosophy

- **README.md** - What users need to deploy
- **NOTES.md** - Why things work the way they do
- **START_HERE.txt** - Immediate guidance
- Inline comments in scripts - How things are implemented

## Future Improvements

Potential enhancements:

1. **Health Checks** - Add Docker health checks to services
2. **Auto-scaling** - Docker Swarm or Kubernetes configs
3. **Monitoring** - Prometheus/Grafana integration
4. **Backup Strategy** - Automated quiz data backup
5. **CI/CD** - GitHub Actions for automated builds
6. **SSL Automation** - Let's Encrypt integration for native deployments

## Changelog

**2025-10-05:**
- Simplified documentation structure (README + NOTES)
- Removed redundant markdown files
- Enhanced cleanup to include network removal
- Updated all scripts to Docker Compose v2 syntax
- Added profile support for optional Nginx
- Fixed session management for production

**2025-10-04:**
- Initial Docker deployment structure
- Three deployment options (native, localhost.run, serveo)
- Interactive management menu
