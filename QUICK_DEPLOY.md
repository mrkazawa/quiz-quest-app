# Quick Deployment Guide - CORS Setup

## 🚀 Choose Your Deployment Type:

### Option 1: Own Server with Domain Name
```bash
# 1. Set your domain in CORS
export CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# 2. Deploy with Nginx
cd docker
docker-compose -f docker-compose-native.yml --profile with-nginx up -d

# 3. Configure DNS to point to your server
# 4. Configure SSL certificate (Let's Encrypt recommended)
```

**You'll need:**
- A domain name (e.g., myquiz.com)
- Server with public IP
- SSL certificate

---

### Option 2: Serveo Tunneling (Quick & Free)
```bash
# 1. Deploy
cd docker
docker-compose -f docker-compose-serveo.yml up -d

# 2. Check logs for your URL
docker-compose -f docker-compose-serveo.yml logs -f

# You'll see: "Forwarding HTTP traffic from https://yoursubdomain.serveo.net"
```

**Default CORS:** Already configured for `*.serveo.net`

**Custom subdomain:**
```bash
SERVEO_SUBDOMAIN=myquiz \
CORS_ORIGINS=https://myquiz.serveo.net \
  docker-compose -f docker-compose-serveo.yml up -d
```

---

### Option 3: Localhost.run Tunneling (Quick & Free)
```bash
# 1. Deploy
cd docker
docker-compose -f docker-compose-localhost-run.yml up -d

# 2. Check logs for your URL
docker-compose -f docker-compose-localhost-run.yml logs -f

# You'll see: "Your site is available at https://abc123.lhr.life"
```

**Default CORS:** Already configured for `*.lhr.life`

---

## ⚙️ Testing Your Deployment

### 1. Check if API is running
```bash
curl http://localhost:3000/health
# Expected: {"status":"OK","timestamp":"..."}
```

### 2. Check CORS from browser
Open your frontend URL in browser, then in DevTools console:
```javascript
fetch('https://your-api-url/health')
  .then(r => r.json())
  .then(console.log)
```

### 3. Check Socket.IO connection
Look at browser DevTools Network tab, filter by "WS" (WebSocket)
- Should see successful WebSocket connection
- Status: 101 Switching Protocols

---

## 🔧 Troubleshooting

### Problem: "CORS policy blocked"
**Solution:**
```bash
# Check current CORS config
docker exec quiz-quest-native env | grep CORS

# Update CORS origins
docker-compose down
CORS_ORIGINS=https://your-real-frontend-url.com docker-compose up -d
```

### Problem: Connection works but login fails
**Cause:** Missing `credentials: include` in frontend requests

**Solution:** Update frontend fetch/axios calls:
```javascript
// Fetch API
fetch('https://api-url/api/login', {
  credentials: 'include',  // ← Add this!
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
})

// Axios
axios.post('https://api-url/api/login', data, {
  withCredentials: true  // ← Add this!
})
```

### Problem: Different behavior on HTTP vs HTTPS
**Cause:** Browsers enforce stricter rules on HTTPS

**Solution:** Always use HTTPS in production:
```bash
CORS_ORIGINS=https://mysite.com  # Not http://
```

---

## 📋 Pre-Deployment Checklist

**Before deploying:**
- [ ] Decide on deployment method (own domain, Serveo, localhost.run)
- [ ] Set `CORS_ORIGINS` environment variable if using own domain
- [ ] Set `TEACHER_PASSWORD` environment variable
- [ ] Test locally first with `npm run dev:all`
- [ ] Build Docker image or pull from Docker Hub

**After deploying:**
- [ ] Verify API health endpoint responds
- [ ] Test CORS from browser DevTools
- [ ] Test login flow end-to-end
- [ ] Test Socket.IO WebSocket connection
- [ ] Verify quiz room creation and joining works

---

## 📚 Full Documentation

For detailed explanations, see:
- **CORS_CONFIGURATION.md** - Complete CORS guide
- **docker/README.md** - Docker deployment details
- **docs/SETUP.md** - Full setup instructions
