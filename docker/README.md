# Docker Deployment

> **👉 To get started: `./manage.sh`**

Complete Docker deployment configurations for Quiz Quest using pre-built images from Docker Hub.

## Quick Start

Run the interactive menu:

```bash
./manage.sh
```

This provides all Docker operations:
- Build & push Docker images
- Run deployments (native, localhost.run, serveo)
- View logs and check status
- Generate secrets and manage environment
- Stop and cleanup deployments

## Deployment Options

Quiz Quest supports three deployment modes:

### 1. Native Deployment

Direct deployment without tunneling. Use when you have:
- Public IP address
- Port forwarding configured
- Domain name pointed to your server

```bash
./run-native.sh
# or via menu: option 4
```

**Access:** `http://your-ip:3000`

### 2. localhost.run Tunnel

Automatic HTTPS tunnel without configuration.

```bash
./run-localhost-run.sh
# or via menu: option 5
```

**Access:** `https://random-subdomain.lhr.life` (provided in logs)

### 3. Serveo.net Tunnel

SSH-based tunnel with custom subdomain support.

```bash
./run-serveo.sh
# or via menu: option 6
```

**Access:** `https://your-subdomain.serveo.net`

## Directory Structure

```
docker/
├── README.md                          # This file
├── NOTES.md                           # Technical notes
│
├── manage.sh                          # Interactive management menu
├── build.sh                           # Build Docker image
├── push.sh                            # Push to Docker Hub
│
├── run-native.sh                      # Native deployment script
├── run-localhost-run.sh               # localhost.run deployment
├── run-serveo.sh                      # Serveo.net deployment
│
├── Dockerfile                         # Production image definition
├── nginx.conf                         # Nginx reverse proxy config
│
├── docker-compose-native.yml          # Native config
├── docker-compose-localhost-run.yml   # localhost.run config
└── docker-compose-serveo.yml          # Serveo.net config
```

## Environment Variables

Required:

```bash
TEACHER_PASSWORD=your_password      # Teacher login password
SESSION_SECRET=random_64_hex        # Session encryption key
NODE_ENV=production                 # Environment mode
```

Optional:

```bash
BEHIND_PROXY=true                   # Set for tunneling deployments
CORS_ORIGINS=https://*.lhr.life     # CORS allowed origins
```

Generate SESSION_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Common Tasks

### View Logs

```bash
./manage.sh  # Option 8
# or
docker compose -f docker-compose-native.yml logs -f
```

### Check Status

```bash
./manage.sh  # Option 9
# or
docker compose -f docker-compose-native.yml ps
```

### Stop Deployment

```bash
./manage.sh  # Option 7
# or
docker compose -f docker-compose-native.yml down
```

### Full Cleanup

```bash
./manage.sh  # Option 10
```

## Troubleshooting

### Session/Login Issues

1. Ensure `SESSION_SECRET` is set (64+ hex chars)
2. For tunneling, set `BEHIND_PROXY=true`
3. Check CORS origins match your URL

See `NOTES.md` for detailed fixes.

### Network Errors

```bash
./manage.sh  # Option 10 (cleanup), then redeploy
```

### Port In Use

```bash
sudo lsof -i :3000
./manage.sh  # Option 7 (stop all)
```

## Docker Compose v2

This project uses Docker Compose v2:

```bash
docker compose up -d    # Correct (v2)
docker-compose up -d    # Old (v1)
```

## Production Checklist

- [ ] Set strong `TEACHER_PASSWORD`
- [ ] Generate secure `SESSION_SECRET`
- [ ] Configure `CORS_ORIGINS`
- [ ] Set `NODE_ENV=production`
- [ ] Test deployment
- [ ] Configure firewall
- [ ] Set up SSL/TLS
- [ ] Verify sessions work

## Resources

- Technical details: `NOTES.md`
- Main project: `../README.md`
- API docs: `../api/README.md`
- User guide: `../docs/USER_GUIDE.md`
