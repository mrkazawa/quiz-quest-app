# Use official Node.js LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy root package.json for orchestration
COPY package*.json ./

# Copy API and client package.json files
COPY api/package*.json ./api/
COPY client/package*.json ./client/

# Install all dependencies using npm scripts
RUN npm run install:all

# Copy the rest of the app
COPY . .

# Build the React app
RUN npm run build:client

# Install openssh-client for SSH forwarding
RUN apk add --no-cache openssh

# Expose port (default 3000)
EXPOSE 3000

# Use inline command without script file
CMD ["sh", "-c", "npm start & sleep 5 && while true; do echo 'Attempting SSH tunnel...'; ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:127.0.0.1:3000 serveo.net; echo 'Tunnel disconnected, retrying...'; sleep 10; done"]
