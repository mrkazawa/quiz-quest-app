# Deployment Guide

Complete deployment guide for Quiz Quest application covering all deployment scenarios.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Deployment Options](#deployment-options)
- [CORS Configuration](#cors-configuration)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)
- [Public IP Deployment (No Domain)](#public-ip-deployment-no-domain)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Development
```bash
# Install dependencies
npm run install:all

# Start development servers (API + Client)
npm run dev

# Access at:
# - Client: http://localhost:5173
# - API: http://localhost:3000
```

### Production
```bash
# Build everything
npm run build

# Start production server
npm start
```

---

## Deployment Options

### Option 1: Docker with Own Domain
**Best for:** Production deployment with custom domain

```bash
cd docker
CORS_ORIGINS=https://yourdomain.com \
  docker compose -f docker-compose-native.yml --profile with-nginx up -d
```

**Access:** `https://yourdomain.com`

---

### Option 2: Docker with Public IP (No Domain)
**Best for:** Classroom/internal use without domain name

```bash
cd docker
# Get your public IP first
MY_IP=$(curl -s ifconfig.me)

CORS_ORIGINS=http://$MY_IP \
  docker compose -f docker-compose-native.yml --profile with-nginx up -d
```

**Access:** `http://YOUR_PUBLIC_IP`  
**Students access:** Just share the IP address!

---

### Option 3: Serveo Tunneling
**Best for:** Quick testing, temporary deployment

```bash
cd docker
docker compose -f docker-compose-serveo.yml up -d

# Check logs for your public URL
docker compose -f docker-compose-serveo.yml logs -f
# Look for: "Forwarding HTTP traffic from https://yourname.serveo.net"
```

**Access:** `https://yourname.serveo.net` (auto-generated)

---

### Option 4: Localhost.run Tunneling
**Best for:** Quick testing, alternative to Serveo

```bash
cd docker
docker compose -f docker-compose-localhost-run.yml up -d

# Check logs for your public URL
docker compose -f docker-compose-localhost-run.yml logs -f
# Look for: "Your site is available at https://abc123.lhr.life"
```

**Access:** `https://randomid.lhr.life` (random URL each time)

---

## CORS Configuration

### What is CORS?

CORS (Cross-Origin Resource Sharing) allows your frontend to communicate with your API when they're on different origins.

### Why localhost AND 127.0.0.1?

Browsers treat these as **different origins** for security:
- `localhost` = hostname (DNS-resolved)
- `127.0.0.1` = IP address (direct)

Both are pre-configured for development.

### Production CORS Setup

The app uses `CORS_ORIGINS` environment variable:

```bash
# Single domain
CORS_ORIGINS=https://myapp.com

# Multiple domains (comma-separated, no spaces!)
CORS_ORIGINS=https://myapp.com,https://www.myapp.com,https://m.myapp.com

# Public IP for classroom use
CORS_ORIGINS=http://203.0.113.45

# Wildcard for tunneling services
CORS_ORIGINS=https://*.serveo.net
```

### Deployment-Specific Examples

| Deployment Type | CORS_ORIGINS Value | When to Use |
|----------------|-------------------|-------------|
| **Own Domain** | `https://mysite.com` | Production with domain |
| **Public IP** | `http://123.45.67.89` | Classroom/internal |
| **Serveo** | `https://*.serveo.net` | Quick testing |
| **Localhost.run** | `https://*.lhr.life` | Quick testing |

---

## Environment Variables

### Required Variables

```bash
# Teacher authentication password
TEACHER_PASSWORD=your_secure_password  # Default: quizmaster123

# Session security
SESSION_SECRET=your_random_secret      # Auto-generated if not set

# Environment mode
NODE_ENV=production                    # development | production | test

# CORS origins (production only)
CORS_ORIGINS=https://yourdomain.com    # Comma-separated list
```

### Optional Variables

```bash
# Server port
PORT=3000                              # Default: 3000

# Logging level
LOG_LEVEL=info                         # error | warn | info | debug | verbose
```

---

## Docker Deployment

### Prerequisites
- Docker installed
- Docker Compose installed
- (Optional) Domain name with DNS configured

### Native Deployment (with Nginx)

**File:** `docker/docker-compose-native.yml`

```bash
cd docker

# With domain
CORS_ORIGINS=https://yourdomain.com \
TEACHER_PASSWORD=mysecret \
  docker compose -f docker-compose-native.yml --profile with-nginx up -d

# With public IP
MY_IP=$(curl -s ifconfig.me)
CORS_ORIGINS=http://$MY_IP \
TEACHER_PASSWORD=mysecret \
  docker compose -f docker-compose-native.yml --profile with-nginx up -d
```

**Ports:**
- 80 (HTTP) - Main access point
- 3000 (API) - Internal, proxied by Nginx

**Verify:**
```bash
# Check containers
docker ps

# Check health
curl http://localhost/health

# View logs
docker compose -f docker-compose-native.yml logs -f
```

---

### Serveo Deployment

**File:** `docker/docker-compose-serveo.yml`

```bash
cd docker

# Basic deployment (random subdomain)
docker compose -f docker-compose-serveo.yml up -d

# Custom subdomain (requires SSH key setup)
SERVEO_SUBDOMAIN=myquiz \
CORS_ORIGINS=https://myquiz.serveo.net \
  docker compose -f docker-compose-serveo.yml up -d
```

**Features:**
- ✅ Free HTTPS tunnel
- ✅ No firewall configuration needed
- ✅ Works behind NAT/router
- ⚠️ URL may change if container restarts

---

### Localhost.run Deployment

**File:** `docker/docker-compose-localhost-run.yml`

```bash
cd docker
docker compose -f docker-compose-localhost-run.yml up -d

# Get the generated URL from logs
docker compose -f docker-compose-localhost-run.yml logs | grep "available at"
```

**Features:**
- ✅ Free HTTPS tunnel
- ✅ Works anywhere
- ⚠️ Random URL each time
- ⚠️ Best for temporary testing

---

## Public IP Deployment (No Domain)

### Perfect for Classroom Scenarios!

**Scenario:** Students access via public IP like `http://203.0.113.45`

### Step 1: Find Your Public IP
```bash
curl ifconfig.me
# Example output: 203.0.113.45
```

### Step 2: Configure Firewall
```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp

# Or allow specific port if not using Nginx
sudo ufw allow 3000/tcp

# Check firewall status
sudo ufw status
```

### Step 3: Deploy
```bash
cd docker

# Get your public IP
MY_IP=$(curl -s ifconfig.me)
echo "Your public IP: $MY_IP"

# Deploy with Nginx (port 80)
CORS_ORIGINS=http://$MY_IP \
TEACHER_PASSWORD=mypassword \
  docker compose -f docker-compose-native.yml --profile with-nginx up -d

# Students visit: http://YOUR_PUBLIC_IP
```

### Step 4: Share with Students
1. Write on whiteboard: `http://203.0.113.45`
2. Students type that in browser
3. Quiz Quest loads! ✅

### Ports Explained

| Setup | Students Visit | CORS_ORIGINS Value |
|-------|----------------|-------------------|
| **With Nginx** (recommended) | `http://123.45.67.89` | `http://123.45.67.89` |
| **Without Nginx** | `http://123.45.67.89:3000` | `http://123.45.67.89:3000` |

### Important Notes

**Static vs Dynamic IP:**
- **Static IP:** Same IP always → Perfect! Share once.
- **Dynamic IP:** Changes periodically → Need to update CORS_ORIGINS when IP changes.

**Check if your IP is static:** Contact your ISP or hosting provider.

---

## Troubleshooting

### CORS Errors

**Problem:** Browser console shows "CORS policy blocked"

**Diagnosis:**
```bash
# Check current CORS config
docker exec quiz-quest-native env | grep CORS
```

**Solutions:**
```bash
# 1. Verify CORS_ORIGINS matches what students use
# If students visit: http://203.0.113.45
# Then CORS_ORIGINS must be: http://203.0.113.45

# 2. Restart with correct CORS
docker compose down
CORS_ORIGINS=http://YOUR_ACTUAL_IP docker compose up -d

# 3. Check for typos (http vs https, trailing slash)
```

---

### Can't Access from Other Computers

**Checklist:**
- [ ] Using **public** IP (not `192.168.x.x` private IP)
- [ ] Firewall allows port 80 or 3000
- [ ] Docker container is running (`docker ps`)
- [ ] Can access locally: `curl http://localhost/health`

**Test from server:**
```bash
# This should work locally:
curl http://localhost/health

# This should work from anywhere:
curl http://YOUR_PUBLIC_IP/health
```

**Common Issues:**
1. **Private IP:** `192.168.x.x` only works on local network
   - **Solution:** Use public IP from `curl ifconfig.me`

2. **Firewall blocking:**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw reload
   ```

3. **Container not running:**
   ```bash
   docker ps
   # If not listed, check logs:
   docker compose logs
   ```

---

### Cookie/Session Not Working

**Problem:** Login works but session doesn't persist, or works in development but not production

**Common Causes:**

1. **Production HTTPS/Secure Cookie Issue**
   - **Symptom:** Works with `NODE_ENV=development`, fails with `NODE_ENV=production`
   - **Cause:** Session cookies require HTTPS in production, but Docker may use HTTP internally
   - **Solution:** Set `BEHIND_PROXY=true` environment variable
   ```bash
   # For localhost.run or serveo.net
   BEHIND_PROXY=true docker compose -f docker-compose-localhost-run.yml up -d
   
   # For Nginx reverse proxy
   BEHIND_PROXY=true docker compose -f docker-compose-native.yml --profile with-nginx up -d
   ```

2. **Missing SESSION_SECRET**
   - **Symptom:** Sessions work but get invalidated on container restart
   - **Cause:** Auto-generated session secret changes each restart
   - **Solution:** Set persistent `SESSION_SECRET`
   ```bash
   # Generate a secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Use it in deployment
   SESSION_SECRET=your-generated-secret-here docker compose up -d
   ```

3. **Missing credentials in frontend:**
   ```javascript
   // Fetch API
   fetch('http://api-url/api/login', {
     credentials: 'include',  // ← Required!
     method: 'POST',
     ...
   })

   // Axios
   axios.post('http://api-url/api/login', data, {
     withCredentials: true  // ← Required!
   })
   ```

4. **CORS mismatch:** Verify origin is explicitly listed
   ```bash
   # Good - exact match
   CORS_ORIGINS=http://203.0.113.45:3000
   
   # Good - wildcard for tunneling
   CORS_ORIGINS=https://*.lhr.life

   # Bad - won't work with credentials
   CORS_ORIGINS=*
   ```

**Quick Fix for Docker Production:**
```bash
# 1. Generate session secret
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# 2. Deploy with proper configuration
SESSION_SECRET=$SESSION_SECRET \
BEHIND_PROXY=true \
CORS_ORIGINS=https://your-url \
  docker compose -f docker-compose-localhost-run.yml up -d
```

---

### Docker Container Keeps Restarting

**Check logs:**
```bash
docker compose logs -f
```

**Common causes:**
1. **Port already in use:**
   ```bash
   # Check what's using port 3000
   sudo lsof -i :3000
   # Kill it or change PORT in docker compose
   ```

2. **Missing environment variables:**
   ```bash
   # Ensure CORS_ORIGINS is set if in production
   docker compose -f docker-compose-native.yml config
   ```

3. **Memory issues:**
   ```bash
   # Check Docker resources
   docker stats
   ```

---

### Performance Issues

**Symptoms:** Slow loading, timeouts

**Solutions:**
1. **Check server resources:**
   ```bash
   docker stats
   free -h
   df -h
   ```

2. **Increase Docker limits** (in docker compose.yml):
   ```yaml
   deploy:
     resources:
       limits:
         cpus: "2.0"
         memory: 1024M
   ```

3. **Check network:**
   ```bash
   # Test latency
   ping YOUR_SERVER_IP
   ```

---

## Deployment Checklist

### Before Deployment
- [ ] Choose deployment method (domain, IP, or tunneling)
- [ ] Set strong `TEACHER_PASSWORD`
- [ ] Configure `CORS_ORIGINS` correctly
- [ ] Test locally first: `npm run dev`
- [ ] Build succeeds: `npm run build`

### After Deployment
- [ ] Health endpoint responds: `curl http://your-url/health`
- [ ] Test CORS from browser DevTools
- [ ] Test teacher login end-to-end
- [ ] Test student join flow
- [ ] Verify Socket.IO WebSocket connection
- [ ] Test creating and running a quiz room

### For Classroom Use
- [ ] Write access URL on whiteboard
- [ ] Test from student device (different network)
- [ ] Verify QR code generation works
- [ ] Prepare quiz content (questions/ folder)
- [ ] Set timer for desired class length

---

## Quick Commands Reference

```bash
# Development
npm run dev                    # Start dev servers
npm run build                  # Build for production
npm start                      # Run production build

# Docker - Native
cd docker
CORS_ORIGINS=http://IP docker compose -f docker-compose-native.yml --profile with-nginx up -d
docker compose -f docker-compose-native.yml logs -f
docker compose -f docker-compose-native.yml down

# Docker - Serveo
cd docker
docker compose -f docker-compose-serveo.yml up -d
docker compose -f docker-compose-serveo.yml logs -f

# Docker - Localhost.run
cd docker
docker compose -f docker-compose-localhost-run.yml up -d
docker compose -f docker-compose-localhost-run.yml logs -f

# Utilities
curl ifconfig.me               # Get public IP
docker ps                      # List containers
docker logs CONTAINER_ID       # View container logs
docker exec -it CONTAINER_ID sh  # Access container shell
```

---

## Need More Help?

- **Setup Instructions:** See [docs/SETUP.md](SETUP.md)
- **User Guide:** See [docs/USER_GUIDE.md](USER_GUIDE.md)
- **API Documentation:** See [api/README.md](../api/README.md)
- **Testing:** See [api/tests/README.md](../api/tests/README.md)

---

## Summary

**For Production with Domain:**
```bash
CORS_ORIGINS=https://mysite.com docker compose -f docker-compose-native.yml --profile with-nginx up -d
```

**For Classroom with Public IP:**
```bash
MY_IP=$(curl -s ifconfig.me)
CORS_ORIGINS=http://$MY_IP docker compose -f docker-compose-native.yml --profile with-nginx up -d
echo "Share this with students: http://$MY_IP"
```

**For Quick Testing:**
```bash
docker compose -f docker-compose-serveo.yml up -d
docker compose logs | grep "Forwarding"
```

That's it! Your Quiz Quest app is ready for deployment. 🚀
