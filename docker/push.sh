#!/bin/bash

# Quiz Quest Docker Push Script
# Pushes the quiz-quest-app image to Docker Hub

set -e

# Configuration
IMAGE_NAME="quiz-quest-app"
DOCKER_USERNAME="${DOCKER_USERNAME:-yoktian}"  # Change this to your Docker Hub username
VERSION="${VERSION:-latest}"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

echo "🚀 Pushing Quiz Quest to Docker Hub"
echo "=================================="
echo "Image: ${FULL_IMAGE_NAME}"
echo "Registry: Docker Hub"
echo ""

# Check if image exists locally
if ! docker images "${DOCKER_USERNAME}/${IMAGE_NAME}" --format "table {{.Repository}}:{{.Tag}}" | grep -q "${IMAGE_NAME}"; then
    echo "❌ Error: Image ${DOCKER_USERNAME}/${IMAGE_NAME} not found locally"
    echo "💡 Run ./build.sh first to build the image"
    exit 1
fi

echo "📋 Local images found:"
docker images "${DOCKER_USERNAME}/${IMAGE_NAME}"
echo ""

# Login to Docker Hub (if not already logged in)
echo "🔐 Checking Docker Hub authentication..."
if ! docker info | grep -q "Username: ${DOCKER_USERNAME}"; then
    echo "🔑 Please log in to Docker Hub:"
    docker login
else
    echo "✅ Already logged in to Docker Hub as ${DOCKER_USERNAME}"
fi

echo ""
echo "📤 Pushing images to Docker Hub..."

# Push versioned tag
echo "  → Pushing ${FULL_IMAGE_NAME}..."
docker push "${FULL_IMAGE_NAME}"

# Push latest tag
echo "  → Pushing ${DOCKER_USERNAME}/${IMAGE_NAME}:latest..."
docker push "${DOCKER_USERNAME}/${IMAGE_NAME}:latest"

echo ""
echo "✅ Push completed successfully!"
echo ""
echo "🌐 Your image is now available on Docker Hub:"
echo "  https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}"
echo ""
echo "💡 Users can now run your app with:"
echo "  docker run -p 3000:3000 ${DOCKER_USERNAME}/${IMAGE_NAME}"
echo ""
echo "🐳 Or use the provided docker compose files:"
echo "  docker compose -f docker-compose-native.yml up -d"
echo "  docker compose -f docker-compose-serveo.yml up -d"
echo "  docker compose -f docker-compose-localhost-run.yml up -d"
echo ""