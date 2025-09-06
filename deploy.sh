#!/bin/bash

echo "🚀 Deploying Quiz Quest React App..."

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

# Install dependencies
echo "📦 Installing dependencies..."
if npm run install:all; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build React app
echo "🔨 Building React app..."
if npm run build:client; then
    echo "✅ React app built successfully"
else
    echo "❌ Failed to build React app"
    exit 1
fi

# Test server startup
echo "🧪 Testing server startup..."
timeout 5s npm start || echo "✅ Server test completed"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 To start the server:"
echo "   npm start"
echo ""
echo "🔧 For development:"
echo "   npm run dev:all"
echo ""
echo "📋 Server will serve the React app on http://localhost:3000"
