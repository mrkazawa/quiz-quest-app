#!/bin/bash

# Quiz Quest Docker Build Script
# Builds the quiz-quest-app image for Docker Hub

set -e

# Configuration
IMAGE_NAME="quiz-quest-app"
DOCKER_USERNAME="${DOCKER_USERNAME:-yoktian}"  # Change this to your Docker Hub username
VERSION="${VERSION:-latest}"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

echo "🐳 Building Quiz Quest Docker Image"
echo "=================================="
echo "Image: ${FULL_IMAGE_NAME}"
echo "Context: $(pwd)/.."
echo "Dockerfile: $(pwd)/Dockerfile"
echo ""

# Build the image
echo "📦 Building Docker image..."
docker build \
    --file ./Dockerfile \
    --tag "${FULL_IMAGE_NAME}" \
    --tag "${DOCKER_USERNAME}/${IMAGE_NAME}:latest" \
    --progress=plain \
    ..

echo ""
echo "✅ Build completed successfully!"
echo "📋 Image details:"
docker images "${DOCKER_USERNAME}/${IMAGE_NAME}"

echo ""
echo "🚀 Image built and tagged as:"
echo "  - ${FULL_IMAGE_NAME}"
echo "  - ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
echo ""
echo "💡 Next steps:"
echo "  1. Test the image: docker run -p 3000:3000 ${FULL_IMAGE_NAME}"
echo "  2. Push to Docker Hub: ./push.sh"
echo ""