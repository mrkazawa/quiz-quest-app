#!/bin/bash

# Run Quiz Quest with Serveo.net Tunneling
# Use this for: Testing, temporary access, behind NAT/firewall

set -e

echo "🌐 Quiz Quest - Serveo.net Tunneling"
echo "====================================="
echo ""

# Check if .env exists
if [ -f "../.env" ]; then
    echo "📋 Found .env file, loading configuration..."
    source ../.env
    USE_ENV_FILE="--env-file ../.env"
else
    echo "⚠️  No .env file found"
    USE_ENV_FILE=""
fi

# Prompt for required variables if not set
if [ -z "$TEACHER_PASSWORD" ]; then
    echo ""
    read -p "Enter TEACHER_PASSWORD (default: admin): " TEACHER_PASSWORD
    TEACHER_PASSWORD=${TEACHER_PASSWORD:-admin}
fi

if [ -z "$SESSION_SECRET" ]; then
    echo ""
    echo "⚠️  SESSION_SECRET not set. Generating one..."
    SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" 2>/dev/null || openssl rand -hex 64)
    echo "✅ Generated SESSION_SECRET"
    echo ""
    echo "💡 Save this in your .env file for persistent sessions:"
    echo "SESSION_SECRET=$SESSION_SECRET"
fi

# Ask about custom subdomain
echo ""
read -p "Use custom Serveo subdomain? (leave empty for random): " SERVEO_SUBDOMAIN

# Set defaults for Serveo
if [ -n "$SERVEO_SUBDOMAIN" ]; then
    CORS_ORIGINS=${CORS_ORIGINS:-https://$SERVEO_SUBDOMAIN.serveo.net}
else
    CORS_ORIGINS=${CORS_ORIGINS:-https://*.serveo.net}
fi
BEHIND_PROXY=${BEHIND_PROXY:-true}

echo ""
echo "📋 Configuration:"
echo "  TEACHER_PASSWORD: ${TEACHER_PASSWORD:0:3}***"
echo "  SESSION_SECRET: ${SESSION_SECRET:0:10}..."
echo "  SERVEO_SUBDOMAIN: ${SERVEO_SUBDOMAIN:-random}"
echo "  CORS_ORIGINS: $CORS_ORIGINS"
echo "  BEHIND_PROXY: $BEHIND_PROXY"
echo ""

# Export variables
export TEACHER_PASSWORD
export SESSION_SECRET
export SERVEO_SUBDOMAIN
export CORS_ORIGINS
export BEHIND_PROXY
export SERVEO_ENABLED=true
export SERVEO_PORT=3000
export NODE_ENV=production

# Start the containers
echo "🐳 Starting Docker containers with Serveo..."
docker compose -f docker-compose-serveo.yml $USE_ENV_FILE up -d

echo ""
echo "✅ Quiz Quest is starting up..."
echo ""
echo "⏳ Waiting for Serveo tunnel to establish (10 seconds)..."
sleep 10

echo ""
echo "📝 Check logs for your public URL:"
echo ""
docker compose -f docker-compose-serveo.yml logs | grep -A 5 -i "serveo\|forwarding" || true

echo ""
echo "🔍 To see the full URL, run:"
echo "  docker compose -f docker-compose-serveo.yml logs -f"
echo ""
echo "Look for a line like:"
echo "  'Forwarding HTTP traffic from https://yourname.serveo.net'"
echo ""
echo "📊 Useful commands:"
echo "  docker compose -f docker-compose-serveo.yml logs -f    # View logs"
echo "  docker compose -f docker-compose-serveo.yml ps         # Check status"
echo "  docker compose -f docker-compose-serveo.yml down       # Stop"
echo ""
echo "💡 Share the Serveo URL with your students!"
echo ""
