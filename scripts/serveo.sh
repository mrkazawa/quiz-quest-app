#!/bin/bash

# Serveo.net tunnel script for Quiz Quest
# Usage: ./serveo.sh [port]
# Default port is 3000 if not specified

PORT=${1:-3000}

echo "🚀 Starting Serveo tunnel for Quiz Quest..."
echo "📡 Tunneling localhost:${PORT} to a public URL"
echo ""
echo "🔗 This will create a public URL that tunnels to your local server"
echo "💡 Make sure your Quiz Quest server is running on port ${PORT}"
echo ""
echo "⚠️  Press Ctrl+C to stop the tunnel"
echo ""

# Create the tunnel using Serveo
# The -R flag forwards the remote port to local port
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:127.0.0.1:${PORT} serveo.net