# Use official Node.js LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy root package.json for orchestration
COPY package*.json ./

# Copy API package.json and install API dependencies
COPY api/package*.json ./api/
RUN cd api && npm install --production

# Copy app-react package.json and install frontend dependencies
COPY app-react/package*.json ./app-react/
RUN cd app-react && npm install

# Copy the rest of the app
COPY . .

# Build the React app
RUN cd app-react && npm run build

# Install openssh-client for SSH forwarding
RUN apk add --no-cache openssh

# Expose port (default 3000)
EXPOSE 3000

# Use inline command without script file
CMD ["sh", "-c", "npm start & sleep 5 && while true; do echo 'Attempting SSH tunnel...'; ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:127.0.0.1:3000 serveo.net; echo 'Tunnel disconnected, retrying...'; sleep 10; done"]
