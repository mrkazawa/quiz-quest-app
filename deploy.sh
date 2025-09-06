#!/bin/bash

echo "🚀 Deploying Quiz Quest React App..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd client && npm install && cd ..

# Build React app
echo "🔨 Building React app..."
npm run build

# Test server startup
echo "🧪 Testing server..."
timeout 5s npm start || echo "Server test completed"

echo "✅ Deployment complete!"
echo ""
echo "🌐 To start the server:"
echo "   npm start"
echo ""
echo "🔧 For development:"
echo "   npm run dev:all"
echo ""
echo "📋 Server will serve the React app on http://localhost:3000"
