#!/bin/sh

echo "🚀 Deploying Quiz Quest Application"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "✅ Node.js $NODE_VERSION and npm $NPM_VERSION detected"

# Install dependencies for all projects
echo "📦 Installing dependencies..."
echo "   Installing API dependencies..."
cd api && npm ci && cd .. || { echo "❌ Failed to install API dependencies"; exit 1; }

echo "   Installing client dependencies..."
cd client && npm ci && cd .. || { echo "❌ Failed to install client dependencies"; exit 1; }

echo "✅ Dependencies installed successfully"

# Build everything using the modern npm scripts
echo "🔨 Building application..."
if npm run build; then
    echo "✅ Application built successfully"
else
    echo "❌ Failed to build application"
    exit 1
fi

# Test server startup (optional)
echo "🧪 Testing server startup..."
if command -v timeout >/dev/null 2>&1; then
    timeout 5s npm start || echo "✅ Server test completed"
else
    echo "⚠️  timeout command not available, skipping server test"
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "🚀 Production workflow:"
echo "   npm start        # Run production server"
echo ""
echo "🔧 Development workflow:"
echo "   npm run dev      # Start development servers"
echo ""
echo "🌐 External access tunnels:"
echo "   ./scripts/serveo.sh          # Using Serveo.net"
echo "   ./scripts/localhost-run.sh   # Using localhost.run"
echo ""
echo "� Docker deployment:"
echo "   docker compose -f docker/docker-compose-native.yml up -d"
echo "   docker compose -f docker/docker-compose-serveo.yml up -d"
echo ""
echo "📋 URLs:"
echo "   Production: http://localhost:3000"
echo "   Development: http://localhost:5173 (client) + http://localhost:3000 (API)"
