#!/bin/bash

# Run Quiz Quest with Native Deployment (Direct Access)
# Use this for: Production servers, VPS, cloud instances

set -e

echo "🚀 Quiz Quest - Native Deployment"
echo "=================================="
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

if [ -z "$CORS_ORIGINS" ]; then
    echo ""
    echo "🌐 Getting your public IP..."
    PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "localhost")
    echo "Your public IP: $PUBLIC_IP"
    echo ""
    read -p "Enter CORS_ORIGINS (default: http://$PUBLIC_IP:3000): " CORS_ORIGINS
    CORS_ORIGINS=${CORS_ORIGINS:-http://$PUBLIC_IP:3000}
fi

# Ask about Nginx
echo ""
read -p "Use Nginx reverse proxy? (y/N): " USE_NGINX
if [[ $USE_NGINX =~ ^[Yy]$ ]]; then
    PROFILE_FLAG="--profile with-nginx"
    ACCESS_URL="http://localhost (or http://$PUBLIC_IP)"
else
    PROFILE_FLAG=""
    ACCESS_URL="http://localhost:3000 (or http://$PUBLIC_IP:3000)"
fi

echo ""
echo "📋 Configuration:"
echo "  TEACHER_PASSWORD: ${TEACHER_PASSWORD:0:3}***"
echo "  SESSION_SECRET: ${SESSION_SECRET:0:10}..."
echo "  CORS_ORIGINS: $CORS_ORIGINS"
echo "  USE_NGINX: ${USE_NGINX:-No}"
echo ""

# Export variables
export TEACHER_PASSWORD
export SESSION_SECRET
export CORS_ORIGINS
export NODE_ENV=production

# Start the containers
echo "🐳 Starting Docker containers..."
docker compose -f docker-compose-native.yml $PROFILE_FLAG $USE_ENV_FILE up -d

echo ""
echo "✅ Quiz Quest is now running!"
echo ""
echo "🌐 Access the app at:"
echo "  $ACCESS_URL"
echo ""
echo "📊 Useful commands:"
if [[ $USE_NGINX =~ ^[Yy]$ ]]; then
echo "  docker compose -f docker-compose-native.yml --profile with-nginx logs -f    # View logs"
echo "  docker compose -f docker-compose-native.yml --profile with-nginx ps         # Check status"
echo "  docker compose -f docker-compose-native.yml --profile with-nginx down       # Stop (including Nginx)"
else
echo "  docker compose -f docker-compose-native.yml logs -f    # View logs"
echo "  docker compose -f docker-compose-native.yml ps         # Check status"
echo "  docker compose -f docker-compose-native.yml down       # Stop"
fi
echo ""
echo "💡 Or use: ./manage.sh → Option 7 (Stop all)"
echo ""
echo "💡 Share this URL with students: $ACCESS_URL"
echo ""
