#!/bin/bash

# Run Quiz Quest with localhost.run Tunneling
# Use this for: Quick demos, temporary access, testing

set -e

echo "🌐 Quiz Quest - localhost.run Tunneling"
echo "========================================"
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

# Set defaults for localhost.run
CORS_ORIGINS=${CORS_ORIGINS:-https://*.lhr.life}
BEHIND_PROXY=${BEHIND_PROXY:-true}

echo ""
echo "📋 Configuration:"
echo "  TEACHER_PASSWORD: ${TEACHER_PASSWORD:0:3}***"
echo "  SESSION_SECRET: ${SESSION_SECRET:0:10}..."
echo "  CORS_ORIGINS: $CORS_ORIGINS"
echo "  BEHIND_PROXY: $BEHIND_PROXY"
echo ""

# Export variables
export TEACHER_PASSWORD
export SESSION_SECRET
export CORS_ORIGINS
export BEHIND_PROXY
export LOCALHOST_RUN_ENABLED=true
export LOCALHOST_RUN_PORT=3000
export NODE_ENV=production

# Start the containers
echo "🐳 Starting Docker containers with localhost.run..."
docker compose -f docker-compose-localhost-run.yml $USE_ENV_FILE up -d

echo ""
echo "✅ Quiz Quest is starting up..."
echo ""
echo "⏳ Waiting for localhost.run tunnel to establish (10 seconds)..."
sleep 10

echo ""
echo "📝 Check logs for your public URL:"
echo ""
docker compose -f docker-compose-localhost-run.yml logs | grep -A 5 "localhost.run" || true

echo ""
echo "🔍 To see the full URL, run:"
echo "  docker compose -f docker-compose-localhost-run.yml logs -f"
echo ""
echo "Look for a line like:"
echo "  'Your site is available at https://abc123.lhr.life'"
echo ""
echo "📊 Useful commands:"
echo "  docker compose -f docker-compose-localhost-run.yml logs -f    # View logs"
echo "  docker compose -f docker-compose-localhost-run.yml ps         # Check status"
echo "  docker compose -f docker-compose-localhost-run.yml down       # Stop"
echo ""
echo "💡 Share the localhost.run URL with your students!"
echo ""
