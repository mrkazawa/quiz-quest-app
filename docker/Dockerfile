# Multi-stage production Dockerfile for Quiz Quest App
# This image will be pushed to Docker Hub as quiz-quest-app

FROM node:20-alpine AS base
WORKDIR /app

# Copy package.json files for dependency caching
COPY package*.json ./
COPY api-ts/package*.json ./api-ts/
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production --omit=dev

# Build stage - install all dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY api-ts/package*.json ./api-ts/
COPY client/package*.json ./client/

# Install all dependencies (including dev)
RUN cd api-ts && npm ci && cd ../client && npm ci

# Copy source code
COPY api-ts/ ./api-ts/
COPY client/ ./client/

# Build both API and client
RUN npm run build

# Production stage - create final lightweight image
FROM node:20-alpine AS production

# Add required packages for tunneling support with OpenSSL compatibility
RUN apk add --no-cache openssh-client curl openssl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S quizquest -u 1001

WORKDIR /app

# Copy package.json files
COPY --chown=quizquest:nodejs package*.json ./
COPY --chown=quizquest:nodejs api-ts/package*.json ./api-ts/

# Install only production dependencies
RUN cd api-ts && npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=quizquest:nodejs /app/api-ts/dist ./api-ts/dist
COPY --from=builder --chown=quizquest:nodejs /app/client/dist ./client/dist

# Copy runtime assets
COPY --chown=quizquest:nodejs questions/ ./questions/
COPY --chown=quizquest:nodejs scripts/ ./scripts/

# Make scripts executable
RUN chmod +x ./scripts/*.sh

# Switch to non-root user
USER quizquest

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Default command runs the production server
CMD ["npm", "start"]