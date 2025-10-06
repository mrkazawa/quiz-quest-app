# Quiz Quest Docker Deployment Guide

This guide will help you deploy Quiz Quest using Docker with the pre-built image from Docker Hub.

## 📋 Prerequisites

- **Docker** installed on your system ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** (usually included with Docker Desktop)
- Basic command line knowledge

## 🚀 Quick Start

### Option 1: Native Deployment (Direct Access)

### Option 2: Serveo.net Deployment (Public HTTPS Tunnel)

### Option 3: localhost.run Deployment (Quick HTTPS Tunnel)

---

## 📦 Deployment Scenarios

Choose the deployment method that best fits your needs:

| Scenario          | Use Case                                    | Best For                        | Public Access           |
| ----------------- | ------------------------------------------- | ------------------------------- | ----------------------- |
| **Native**        | Local network, VPS, or cloud with public IP | Production, stable deployments  | ✅ With port forwarding |
| **Serveo.net**    | Behind firewall/NAT, temporary sharing      | Development, testing, demos     | ✅ Automatic HTTPS      |
| **localhost.run** | Quick testing, one-time demos               | Quick sharing, temporary access | ✅ Automatic HTTPS      |

---

## 🔧 Scenario 1: Native Deployment

**Best for:** Production servers, VPS hosting, or when you have direct network access.

### Step 1: Create Docker Compose File

Create a file named `docker-compose.yml`:

```yaml
services:
  quiz-quest:
    image: yoktian/quiz-quest-app:latest
    container_name: quiz-quest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TEACHER_PASSWORD=your-secure-password-here
      - SESSION_SECRET=generate-random-64-char-hex-string
      - PORT=3000
    volumes:
      - ./questions:/app/questions
    restart: unless-stopped
```

### Step 2: Set Environment Variables

Create a `.env` file in the same directory:

```bash
TEACHER_PASSWORD=your-ultra-secure-password
SESSION_SECRET=your-64-character-random-hex-string-here
NODE_ENV=production
```

**Generate a secure session secret:**

```bash
# Linux/Mac
openssl rand -hex 32

# Or use online generator
# https://www.random.org/strings/
```

### Step 3: Prepare Quiz Questions

Create a `questions` directory with your quiz JSON files:

```bash
mkdir -p questions
```

Example question file (`questions/my-quiz.json`):

```json
{
  "title": "My Quiz Title",
  "questions": [
    {
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1,
      "points": 100,
      "timeLimit": 30
    }
  ]
}
```

### Step 4: Deploy

```bash
# Pull the latest image
docker pull yoktian/quiz-quest-app:latest

# Start the service
docker compose up -d

# Check logs
docker compose logs -f

# Check status
docker compose ps
```

### Step 5: Access Your Quiz

- **Local access:** http://localhost:3000
- **Network access:** http://your-server-ip:3000

---

## 🌐 Scenario 2: Serveo.net Deployment

**Best for:** Sharing from behind NAT/firewall, testing, demos with persistent URLs.

### Features:

- ✅ Automatic HTTPS
- ✅ No port forwarding needed
- ✅ Custom subdomain support (with SSH keys)
- ✅ No registration required

### Step 1: Create Docker Compose File

Create `docker-compose-serveo.yml`:

```yaml
services:
  quiz-quest-serveo:
    image: yoktian/quiz-quest-app:latest
    container_name: quiz-quest-serveo
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TEACHER_PASSWORD=${TEACHER_PASSWORD:-admin}
      - SESSION_SECRET=${SESSION_SECRET:-change-this-in-production}
    volumes:
      - ./questions:/app/questions
    restart: unless-stopped
    # Start app and create Serveo tunnel
    command: >
      sh -c "
        npm start &
        sleep 10 &&
        echo '🌐 Starting Serveo tunnel...' &&
        ssh -o StrictHostKeyChecking=no \
            -o ServerAliveInterval=30 \
            -o ConnectTimeout=10 \
            -o UserKnownHostsFile=/dev/null \
            -R 80:127.0.0.1:3000 \
            serveo.net
      "
```

### Step 2: Deploy with Serveo

```bash
# Start the service
docker compose -f docker-compose-serveo.yml up -d

# Watch logs to see the Serveo URL
docker compose -f docker-compose-serveo.yml logs -f
```

### Step 3: Get Your Public URL

Look for output like:

```
Forwarding HTTP traffic from https://random-subdomain.serveo.net
```

**Your quiz is now accessible at that URL!**

### Stopping the Service

```bash
docker compose -f docker-compose-serveo.yml down
```

---

## ⚡ Scenario 3: localhost.run Deployment

**Best for:** Quick testing, temporary demos, one-time sharing.

### Features:

- ✅ Automatic HTTPS
- ✅ No configuration needed
- ✅ No registration required
- ⚠️ Random URLs (not persistent)

### Step 1: Create Docker Compose File

Create `docker-compose-localhost-run.yml`:

```yaml
services:
  quiz-quest-localhost-run:
    image: yoktian/quiz-quest-app:latest
    container_name: quiz-quest-localhost-run
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TEACHER_PASSWORD=${TEACHER_PASSWORD:-admin}
      - SESSION_SECRET=${SESSION_SECRET:-change-this-in-production}
    volumes:
      - ./questions:/app/questions
    restart: unless-stopped
    # Start app and create localhost.run tunnel
    command: >
      sh -c "
        npm start &
        sleep 10 &&
        echo '🌐 Starting localhost.run tunnel...' &&
        ssh -o StrictHostKeyChecking=no \
            -o ServerAliveInterval=30 \
            -o ConnectTimeout=10 \
            -o UserKnownHostsFile=/dev/null \
            -R 80:127.0.0.1:3000 \
            nokey@localhost.run
      "
```

### Step 2: Deploy with localhost.run

```bash
# Start the service
docker compose -f docker-compose-localhost-run.yml up -d

# Watch logs to see the generated URL
docker compose -f docker-compose-localhost-run.yml logs -f
```

### Step 3: Get Your Public URL

Look for output like:

```
** your connection id is XXXXX-XXXX-XXXX **
https://abc123.lhr.life
```

**Your quiz is now accessible at that URL!**

### Stopping the Service

```bash
docker compose -f docker-compose-localhost-run.yml down
```

---

## 🔒 Security Best Practices

### 1. Change Default Passwords

**Never use the default password in production!**

```bash
# Generate a strong password
openssl rand -base64 32
```

Set it in your `.env` file or docker-compose.yml:

```bash
TEACHER_PASSWORD=your-generated-strong-password
```

### 2. Use Session Secrets

Generate a random session secret:

```bash
openssl rand -hex 32
```

Add to your environment:

```bash
SESSION_SECRET=your-64-character-hex-string
```

### 3. Enable HTTPS

For native deployments:

- Use Let's Encrypt with Certbot
- Configure Nginx with SSL certificates
- Force HTTPS redirects

### 4. Limit Access

Add IP restrictions in Nginx:

```nginx
location / {
    allow 192.168.1.0/24;  # Your network
    deny all;
    proxy_pass http://quiz-quest:3000;
}
```

### 5. Monitor Logs

```bash
# Check application logs
docker logs quiz-quest -f

# Check for errors
docker logs quiz-quest 2>&1 | grep -i error
```

---

## 📊 Managing Your Deployment

### View Logs

```bash
# Follow logs in real-time
docker compose logs -f

# View last 100 lines
docker compose logs --tail=100

# Logs for specific service
docker logs quiz-quest
```

### Restart Service

```bash
# Restart
docker compose restart

# Restart specific service
docker restart quiz-quest
```

### Update to Latest Version

```bash
# Pull latest image
docker pull yoktian/quiz-quest-app:latest

# Restart with new image
docker compose down
docker compose up -d
```

### Backup Your Data

```bash
# Backup questions directory
tar -czf quiz-questions-backup.tar.gz questions/

# Backup Docker volumes
docker run --rm -v quiz-quest-data:/data -v $(pwd):/backup alpine \
  tar -czf /backup/quiz-data-backup.tar.gz -C /data .
```

### Clean Up

```bash
# Stop and remove containers
docker compose down

# Remove volumes (WARNING: deletes data)
docker compose down -v

# Remove old images
docker image prune -a
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or use a different port in docker-compose.yml
ports:
  - "3001:3000"  # Host:Container
```

### Container Keeps Restarting

```bash
# Check logs for errors
docker logs quiz-quest

# Check container status
docker ps -a

# Restart with fresh state
docker compose down
docker compose up -d
```

### Tunnel Connection Failed (Serveo/localhost.run)

**Possible causes:**

1. Serveo.net or localhost.run service is down
2. Firewall blocking SSH connections
3. Network connectivity issues

**Solutions:**

```bash
# Test SSH connectivity
ssh serveo.net  # For Serveo
ssh localhost.run  # For localhost.run

# Try alternative tunnel service
docker compose -f docker-compose-localhost-run.yml up -d

# Or use native deployment
docker compose -f docker-compose.yml up -d
```

### Cannot Access Quiz

**Check these:**

1. Is the container running? `docker ps`
2. Is the port accessible? `curl http://localhost:3000`
3. Is firewall blocking? `sudo ufw status`
4. Check logs: `docker logs quiz-quest`

### Permission Denied for Questions

```bash
# Fix file permissions
chmod -R 755 questions/

# Or run with proper ownership
sudo chown -R 1001:1001 questions/
```

---

## 📚 Additional Resources

- **Docker Documentation:** https://docs.docker.com/
- **Docker Compose Reference:** https://docs.docker.com/compose/
- **Quiz Quest GitHub:** https://github.com/mrkazawa/quiz-quest-app
- **Serveo.net Documentation:** https://serveo.net/
- **localhost.run Documentation:** https://localhost.run/docs/

---

## 🎓 Quick Reference Commands

```bash
# Native Deployment
docker pull yoktian/quiz-quest-app:latest
docker compose up -d
docker compose logs -f

# Serveo Deployment
docker compose -f docker-compose-serveo.yml up -d
docker compose -f docker-compose-serveo.yml logs -f

# localhost.run Deployment
docker compose -f docker-compose-localhost-run.yml up -d
docker compose -f docker-compose-localhost-run.yml logs -f

# Stop Services
docker compose down

# Update Image
docker pull yoktian/quiz-quest-app:latest && docker compose up -d

# View Logs
docker logs quiz-quest -f

# Restart
docker restart quiz-quest
```

---

## 💡 Tips and Best Practices

1. **Use .env files** for sensitive data (don't commit to git!)
2. **Mount questions directory** to easily update quiz content without rebuilding
3. **Set resource limits** in production to prevent resource exhaustion
4. **Use health checks** to ensure service availability
5. **Regular backups** of your questions and data volumes
6. **Monitor logs** for errors and suspicious activity
7. **Update regularly** to get latest security patches and features
8. **Test locally** before deploying to production
9. **Use HTTPS** in production (via Nginx + Let's Encrypt)
10. **Document your setup** for team members or future reference

---

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review container logs: `docker logs quiz-quest`
3. Check GitHub Issues: https://github.com/mrkazawa/quiz-quest-app/issues
4. Create a new issue with:
   - Your docker-compose.yml (without passwords!)
   - Error messages from logs
   - Docker version: `docker --version`
   - OS and version

---

**Happy Quizzing! 🎉**
