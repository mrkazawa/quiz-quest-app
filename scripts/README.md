# Scripts Directory

This directory contains deployment and tunneling scripts for Quiz Quest.

## Files

### `deploy.sh`

Full deployment script that builds both client and API components.

**Usage:**

```bash
./scripts/deploy.sh
```

**What it does:**

- Installs all dependencies (client + API)
- Builds TypeScript API (`api-ts`)
- Builds React client (`client`)
- Tests server startup
- Provides usage instructions

### `serveo.sh`

Creates a public tunnel using Serveo.net to access your local Quiz Quest server.

**Usage:**

```bash
./scripts/serveo.sh
```

**What it does:**

- Tunnels `localhost:3000` to a public `*.serveo.net` URL
- Uses SSH tunneling with keep-alive

### `localhost-run.sh`

Creates a public tunnel using localhost.run to access your local Quiz Quest server.

**Usage:**

```bash
./scripts/localhost-run.sh [port]
```

**Examples:**

```bash
./scripts/localhost-run.sh        # Uses port 3000 (default)
./scripts/localhost-run.sh 5173   # Uses port 5173 (development client)
```

**What it does:**

- Tunnels specified port (default: 3000) to a public localhost.run URL
- Uses SSH tunneling with keep-alive
- Supports custom port specification

## Typical Workflows

### Production Deployment

```bash
./scripts/deploy.sh
npm start
./scripts/localhost-run.sh    # For external access
```

### Development with External Access

```bash
npm run dev:custom
./scripts/localhost-run.sh 5173    # Tunnel the client dev server
```

## Notes

- Both tunnel services require SSH and internet connection
- Tunnels create temporary public URLs that expire when disconnected
- For production use, consider proper hosting services
- Make sure your target port is running before starting tunnels
