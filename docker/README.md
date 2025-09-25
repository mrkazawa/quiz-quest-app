# Quiz Quest Docker Hub Deployments

This directory contains Docker configurations for deploying Quiz Quest using a pre-built image from Docker Hub. The image `mrkazawa/quiz-quest-app` is built once and pushed to Docker Hub, then used across multiple deployment scenarios.

## 📁 Directory Structure

```
docker/
├── README.md                       # This documentation
├── Dockerfile                      # Production Dockerfile for building the image
├── build.sh                       # Script to build the Docker image
├── push.sh                        # Script to push image to Docker Hub
├── nginx.conf                     # Nginx configuration for native deployment
├── docker-compose-native.yml      # Native deployment (no tunneling)
├── docker-compose-serveo.yml      # Serveo.net tunneling deployment
└── docker-compose-localhost-run.yml # localhost.run tunneling deployment
```

## 🏗️ Building and Publishing

### Build the Image Locally

```bash
cd docker/
./build.sh
```

### Push to Docker Hub

```bash
cd docker/
./push.sh
```

**Note:** Update `DOCKER_USERNAME` in the scripts to match your Docker Hub username.

## 🚀 Deployment Options

### 1. Native Deployment (Recommended for Production)

**Use case:** Production servers with proper domain/IP access, cloud deployments, VPS hosting.

```bash
# Standard deployment
docker-compose -f docker-compose-native.yml up -d

# With Nginx reverse proxy (recommended for production)
docker-compose -f docker-compose-native.yml --profile with-nginx up -d

# With custom password
TEACHER_PASSWORD=your-secret-password docker-compose -f docker-compose-native.yml up -d
```

**Features:**

- ✅ Uses pre-built Docker Hub image
- ✅ Non-root user for security
- ✅ Health checks and resource limits
- ✅ Optional Nginx reverse proxy with SSL ready
- ✅ Production-grade configuration
- ✅ Fast deployment (no build time)

### 2. Serveo.net Tunneling

**Use case:** Development, testing, sharing from local machines or servers behind NAT/firewall.

```bash
# Basic Serveo deployment
docker-compose -f docker-compose-serveo.yml up -d

# With custom subdomain (requires SSH key setup)
SERVEO_SUBDOMAIN=myquiz docker-compose -f docker-compose-serveo.yml up -d

# View logs to see the generated URL
docker-compose -f docker-compose-serveo.yml logs -f
```

**Features:**

- ✅ Uses pre-built Docker Hub image
- ✅ Automatic HTTPS via Serveo.net
- ✅ No firewall/NAT configuration needed
- ✅ Custom subdomain support (with SSH keys)
- ✅ Persistent tunnel with auto-reconnect

### 3. localhost.run Tunneling

**Use case:** Quick testing, temporary sharing, one-time demonstrations.

```bash
# Deploy with localhost.run
docker-compose -f docker-compose-localhost-run.yml up -d

# View logs to get the generated URL
docker-compose -f docker-compose-localhost-run.yml logs -f
```

**Features:**

- ✅ Uses pre-built Docker Hub image
- ✅ Quick setup, no configuration needed
- ✅ Automatic HTTPS
- ✅ No account required
- ⚠️ Random URLs (not persistent)

## 🔧 Environment Variables

All deployments support these environment variables:

| Variable             | Default      | Description                   |
| -------------------- | ------------ | ----------------------------- |
| `NODE_ENV`           | `production` | Node.js environment           |
| `TEACHER_PASSWORD`   | `admin`      | Password for teacher login    |
| `PORT`               | `3000`       | Application port              |
| `SERVEO_SUBDOMAIN`   | _(empty)_    | Custom Serveo subdomain       |
| `SERVEO_PORT`        | `3000`       | Port for Serveo tunnel        |
| `LOCALHOST_RUN_PORT` | `3000`       | Port for localhost.run tunnel |

## 📊 Comparison Table

| Feature              | Native          | Serveo               | localhost.run |
| -------------------- | --------------- | -------------------- | ------------- |
| **Production Ready** | ✅ Best         | ⚠️ Dev/Test          | ⚠️ Demo only  |
| **Setup Complexity** | Medium          | Low                  | Minimal       |
| **Custom Domain**    | ✅ Full control | ⚠️ Subdomain         | ❌ Random     |
| **HTTPS/SSL**        | ✅ Your certs   | ✅ Automatic         | ✅ Automatic  |
| **Performance**      | ✅ Direct       | ⚠️ Tunneled          | ⚠️ Tunneled   |
| **Reliability**      | ✅ High         | ⚠️ Depends on tunnel | ⚠️ Limited    |
| **Behind Firewall**  | ❌ Needs config | ✅ Works             | ✅ Works      |
| **Cost**             | Server cost     | Free                 | Free          |

## 🛠️ Advanced Usage

### Using Your Own Docker Hub Repository

1. **Update the scripts:**

   ```bash
   # Edit build.sh and push.sh
   export DOCKER_USERNAME="your-dockerhub-username"
   ```

2. **Update docker-compose files:**

   ```bash
   # Replace 'mrkazawa/quiz-quest-app' with 'your-username/quiz-quest-app'
   sed -i 's/mrkazawa\/quiz-quest-app/your-username\/quiz-quest-app/g' docker-compose-*.yml
   ```

3. **Build and push your image:**
   ```bash
   ./build.sh
   ./push.sh
   ```

### Production Deployment with Custom Settings

```bash
# Create environment file
cat > .env << EOF
NODE_ENV=production
TEACHER_PASSWORD=your-ultra-secure-password
PORT=3000
EOF

# Deploy with environment file
docker-compose -f docker-compose-native.yml --env-file .env up -d
```

### SSL/HTTPS Setup (Native Deployment)

1. **Obtain SSL certificates** (Let's Encrypt, CloudFlare, etc.)
2. **Update nginx.conf** with your domain and certificate paths
3. **Mount certificate volumes** in docker-compose.yml:
   ```yaml
   volumes:
     - ./ssl-certs:/etc/ssl/certs:ro
   ```
4. **Uncomment HTTPS server block** in nginx.conf

### Monitoring and Logs

```bash
# View application logs
docker-compose -f docker-compose-native.yml logs -f quiz-quest-native

# View all logs including Nginx (with nginx profile)
docker-compose -f docker-compose-native.yml logs -f

# Monitor resource usage
docker stats $(docker-compose -f docker-compose-native.yml ps -q)

# View tunnel logs (for Serveo/localhost.run)
docker-compose -f docker-compose-serveo.yml logs -f
docker-compose -f docker-compose-localhost-run.yml logs -f
```

## 🔒 Security Considerations

### Native Deployment

- ✅ Run as non-root user
- ✅ Resource limits configured
- ✅ Rate limiting via Nginx
- ✅ Security headers
- ⚠️ Update TEACHER_PASSWORD
- ⚠️ Use HTTPS in production

### Tunnel Deployments

- ⚠️ Publicly accessible URLs
- ⚠️ No rate limiting by default
- ⚠️ Consider IP restrictions
- ✅ HTTPS provided by tunnel service

## 🚨 Troubleshooting

### Common Issues

**Image not found on Docker Hub:**

```bash
# Verify image exists
docker pull mrkazawa/quiz-quest-app:latest

# Or build locally if needed
./build.sh
```

**Tunnel not connecting:**

```bash
# Check logs for tunnel services
docker-compose -f docker-compose-serveo.yml logs -f
docker-compose -f docker-compose-localhost-run.yml logs -f

# Restart with fresh container
docker-compose -f docker-compose-serveo.yml down && docker-compose -f docker-compose-serveo.yml up -d
```

**Health check failing:**

```bash
# Check if app is starting properly
docker-compose -f docker-compose-native.yml exec quiz-quest-native npm start

# View detailed health check logs
docker inspect quiz-quest-native | grep -A 10 Health
```

**Permission denied errors:**

```bash
# Ensure proper file ownership for questions directory
sudo chown -R 1001:1001 ../questions/

# Check if scripts are executable in the image
docker-compose -f docker-compose-native.yml exec quiz-quest-native ls -la scripts/
```

**Docker Hub authentication issues:**

```bash
# Login to Docker Hub
docker login

# Verify credentials
docker info | grep Username
```

## 📝 Migration from Legacy Docker Setup

If upgrading from the root-level Dockerfile:

1. **Pull the pre-built image** (no need to build locally):

   ```bash
   docker pull mrkazawa/quiz-quest-app:latest
   ```

2. **Choose your deployment type** (native recommended)

3. **Use new compose commands**:

   ```bash
   # Old way
   docker-compose up -d

   # New way (choose one)
   docker-compose -f docker/docker-compose-native.yml up -d
   docker-compose -f docker/docker-compose-serveo.yml up -d
   docker-compose -f docker/docker-compose-localhost-run.yml up -d
   ```

## ⚡ Quick Start

```bash
# 1. Pull the latest image
docker pull mrkazawa/quiz-quest-app:latest

# 2. Choose your deployment method:

# Native (production)
docker-compose -f docker/docker-compose-native.yml up -d

# Serveo tunneling (development/testing)
docker-compose -f docker/docker-compose-serveo.yml up -d

# localhost.run tunneling (demos)
docker-compose -f docker/docker-compose-localhost-run.yml up -d
```

## 🎯 Recommendations

- **Development/Testing:** Use `serveo` or `localhost-run`
- **Production:** Use `native` with Nginx proxy
- **Quick Demo:** Use `localhost-run`
- **Persistent Public Access:** Use `native` with proper domain
- **Behind Corporate Firewall:** Use tunneling options

---

For more information, see the main [README.md](../README.md) and [scripts/README.md](../scripts/README.md).
