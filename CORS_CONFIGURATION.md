# CORS Configuration Guide

**File:** `api/src/config/cors.ts`  
**Purpose:** Controls which frontend URLs can access your API and Socket.IO server

---

## 📋 Table of Contents
- [Why Both localhost and 127.0.0.1?](#why-both-localhost-and-127001)
- [Docker Deployment Configuration](#docker-deployment-configuration)
- [Usage Examples](#usage-examples)
- [Security Best Practices](#security-best-practices)

---

## Why Both `localhost` and `127.0.0.1`?

### The Technical Reason
```typescript
origin: [
  'http://localhost:5173',      // Hostname (DNS-resolved)
  'http://127.0.0.1:5173',      // IP Address (direct)
]
```

**Answer:** Browsers treat these as **different origins** for CORS purposes!

### Real-World Scenario
```bash
# User types in browser:
http://localhost:5173
→ Origin header: "http://localhost:5173"

# User types:
http://127.0.0.1:5173
→ Origin header: "http://127.0.0.1:5173"

# Without both configured, one would be blocked! ❌
```

### Why This Matters
- Some tools/extensions use IP addresses instead of hostnames
- Docker containers sometimes resolve differently
- Developer habits vary (some prefer typing IPs)
- Better developer experience - works regardless of how they access it

---

## Docker Deployment Configuration

### Current Implementation

The CORS config now uses **environment variables** for flexibility:

```typescript
// Development origins (always allowed in dev)
const devOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// Production origins from environment variable
const prodOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [];

// Smart combination based on NODE_ENV
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [...prodOrigins]              // Production: only specified origins
  : [...devOrigins, ...prodOrigins]; // Development: both dev + prod
```

---

## Deployment Scenarios

### 1. **Native Deployment (Your Own Server)**

**Setup:** `docker-compose -f docker/docker-compose-native.yml --profile with-nginx up -d`

#### Option A: With Domain Name
**CORS Configuration:**
```bash
# Set environment variable
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com \
  docker-compose -f docker/docker-compose-native.yml --profile with-nginx up -d
```

**What to add:**
- ✅ Your domain name: `https://yourdomain.com`
- ✅ WWW variant (if used): `https://www.yourdomain.com`

**Students access:** `https://yourdomain.com`

---

#### Option B: With Public IP (No Domain)
**CORS Configuration:**
```bash
# For classroom use without domain
CORS_ORIGINS=http://YOUR_PUBLIC_IP \
  docker-compose -f docker/docker-compose-native.yml --profile with-nginx up -d

# Example with actual IP:
CORS_ORIGINS=http://203.0.113.45 \
  docker-compose -f docker/docker-compose-native.yml --profile with-nginx up -d
```

**What to add:**
- ✅ Your public IP: `http://123.45.67.89`
- ✅ With port (if not using Nginx): `http://123.45.67.89:3000`

**Students access:** `http://123.45.67.89`

**Note:** Public IPs work perfectly for classroom scenarios! See `PUBLIC_IP_DEPLOYMENT.md` for details.

---

### 2. **Serveo Tunneling**

**Setup:** `docker-compose -f docker/docker-compose-serveo.yml up -d`

**CORS Configuration:**
```bash
# With specific subdomain
SERVEO_SUBDOMAIN=myquiz \
CORS_ORIGINS=https://myquiz.serveo.net \
  docker-compose -f docker/docker-compose-serveo.yml up -d

# OR use wildcard (less secure, allows any serveo.net subdomain)
CORS_ORIGINS=https://*.serveo.net \
  docker-compose -f docker/docker-compose-serveo.yml up -d
```

**Default:** Already configured with `https://*.serveo.net`

---

### 3. **Localhost.run Tunneling**

**Setup:** `docker-compose -f docker/docker-compose-localhost-run.yml up -d`

**CORS Configuration:**
```bash
# Localhost.run generates random URLs like: https://abc123.lhr.life
# Use wildcard pattern (required because URL changes each time)
CORS_ORIGINS=https://*.lhr.life \
  docker-compose -f docker/docker-compose-localhost-run.yml up -d
```

**Default:** Already configured with `https://*.lhr.life`

**Note:** Localhost.run generates random subdomains each time, so wildcard is necessary.

---

## Usage Examples

### Example 1: Multiple Production Domains
```bash
# Main site + staging + mobile subdomain
CORS_ORIGINS="https://quiz.example.com,https://staging.example.com,https://m.example.com" \
  docker-compose -f docker/docker-compose-native.yml up -d
```

### Example 2: HTTP + HTTPS Support
```bash
# During SSL certificate setup transition
CORS_ORIGINS="http://mysite.com,https://mysite.com" \
  docker-compose -f docker/docker-compose-native.yml up -d
```

### Example 3: Development with Custom Domain
```bash
# Local development but testing with real domain
NODE_ENV=development \
CORS_ORIGINS="https://dev.mysite.com" \
  npm run dev
```

---

## Security Best Practices

### ✅ DO:
1. **Use specific origins** in production
   ```typescript
   CORS_ORIGINS=https://myapp.com,https://www.myapp.com
   ```

2. **Use HTTPS** in production
   ```typescript
   CORS_ORIGINS=https://myapp.com  // Secure ✅
   ```

3. **Enable credentials** (already configured)
   ```typescript
   credentials: true  // Allows cookies/session
   ```

4. **List all legitimate subdomains**
   ```typescript
   CORS_ORIGINS=https://app.mysite.com,https://admin.mysite.com
   ```

### ❌ DON'T:
1. **Use `*` wildcard with credentials**
   ```typescript
   origin: '*'  // ❌ NEVER do this with credentials: true
   ```

2. **Allow HTTP in production** (except during migration)
   ```typescript
   CORS_ORIGINS=http://myapp.com  // ❌ Not secure
   ```

3. **Add public IPs** (users don't access via IP)
   ```typescript
   CORS_ORIGINS=http://123.45.67.89  // ❌ Unnecessary
   ```

4. **Use overly broad wildcards**
   ```typescript
   CORS_ORIGINS=https://*  // ❌ Too permissive
   ```

---

## Where CORS is Used

### 1. Express REST API (`app.ts`)
```typescript
import cors from 'cors';
import corsConfig from './config/cors';

this.app.use(cors(corsConfig));
```

**Handles:** REST API requests (login, get quizzes, etc.)

### 2. Socket.IO Server (`socket/socketConfig.ts`)
```typescript
import corsConfig from '../config/cors';

const io = new SocketIOServer(server, {
  cors: {
    origin: corsConfig.origin,
    methods: corsConfig.methods,
    credentials: corsConfig.credentials,
  }
});
```

**Handles:** WebSocket connections for real-time quiz rooms

---

## Troubleshooting

### Issue: "CORS policy blocked"
```
Access to fetch at 'http://api.example.com' from origin 'http://example.com' 
has been blocked by CORS policy
```

**Solutions:**
1. Check `CORS_ORIGINS` includes the frontend URL
2. Verify protocol matches (http vs https)
3. Check for trailing slashes (shouldn't matter, but some browsers are picky)
4. Restart Docker container after changing environment variables

### Issue: Cookie/Session not working
```
Warning: Cross-origin requests with credentials require CORS to be properly configured
```

**Solution:** Ensure:
- `credentials: true` is set (already configured ✅)
- Frontend uses `credentials: 'include'` in fetch/axios
- Origin is explicitly listed (not a wildcard)

### Issue: Socket.IO connection failed
```
WebSocket connection to 'ws://api.example.com/socket.io/' failed
```

**Solutions:**
1. Verify Socket.IO CORS config matches REST API CORS
2. Check WebSocket protocol (ws vs wss for https)
3. Ensure Nginx (if used) proxies WebSocket correctly

---

## Quick Reference

| Deployment Type | CORS_ORIGINS Value | Notes |
|----------------|-------------------|-------|
| Local Dev | *(automatic)* | Uses localhost:5173, 127.0.0.1:5173 |
| Your Domain | `https://yourdomain.com` | Add www variant if needed |
| Serveo | `https://myquiz.serveo.net` | Or use `https://*.serveo.net` |
| Localhost.run | `https://*.lhr.life` | Wildcard required (random URLs) |
| Multiple Sites | `https://site1.com,https://site2.com` | Comma-separated |
| Testing SSL | `http://site.com,https://site.com` | Temporary during migration |

---

## Environment Variable Format

```bash
# Single origin
CORS_ORIGINS=https://myapp.com

# Multiple origins (comma-separated)
CORS_ORIGINS=https://myapp.com,https://www.myapp.com,https://m.myapp.com

# Wildcard subdomain (use with caution)
CORS_ORIGINS=https://*.myapp.com

# Mixed protocols (only during SSL setup)
CORS_ORIGINS=http://myapp.com,https://myapp.com
```

**Important:** No spaces around commas in comma-separated lists!

---

## Testing CORS Configuration

### Test 1: Browser DevTools
```javascript
// Open browser console on your frontend
fetch('http://your-api.com/health', {
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
```

**Expected:** Response data  
**If blocked:** CORS not configured correctly

### Test 2: cURL
```bash
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://your-api.com/api/login
```

**Expected:** Response with `Access-Control-Allow-Origin` header

---

## Summary

### Key Concepts:
1. **localhost ≠ 127.0.0.1** (browsers see them as different origins)
2. **Use domain names, not IPs** for production CORS
3. **Environment variables** provide deployment flexibility
4. **CORS applies to both REST API and Socket.IO**

### Configuration Checklist:
- [ ] Set `CORS_ORIGINS` environment variable
- [ ] Use HTTPS in production
- [ ] List all legitimate frontend domains
- [ ] Test with browser DevTools
- [ ] Restart Docker after config changes
- [ ] Verify both REST and WebSocket connections work

---

**Need Help?** Check the Docker logs to see which origins are configured:
```bash
docker-compose logs quiz-quest-native | grep CORS
```
