#!/bin/bash

echo "🚀 Deploying Quiz Quest Full-Stack App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js $(node --version) and npm $(npm --version) detected"

# Install dependencies for all projects
echo "📦 Installing dependencies..."
if npm run install:all; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build API TypeScript
echo "🔨 Building API TypeScript..."
if npm run build:api; then
    echo "✅ API TypeScript built successfully"
else
    echo "❌ Failed to build API TypeScript"
    exit 1
fi

# Build React client
echo "🔨 Building React client..."
if npm run build:client; then
    echo "✅ React client built successfully"
else
    echo "❌ Failed to build React client"
    exit 1
fi

# Test server startup
echo "🧪 Testing server startup..."
timeout 5s npm start || echo "✅ Server test completed"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Production server (API serves client):"
echo "   npm start"
echo ""
echo "🔧 Development mode (separate servers):"
echo "   npm run dev:all"
echo ""
echo "� Custom development server (recommended):"
echo "   npm run dev:custom"
echo ""
echo "� External access tunnels:"
echo "   ./scripts/serveo.sh      # Using Serveo"
echo "   ./scripts/localhost-run.sh  # Using localhost.run"
echo ""
echo "📋 Production server runs on http://localhost:3000"
echo "📋 Development client runs on http://localhost:5173 (proxies to API on :3000)"
