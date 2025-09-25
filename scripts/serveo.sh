#!/bin/sh

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
echo "🔄 Connecting to Serveo.net..."
echo ""

# Create the tunnel using Serveo with better error handling
# The -R flag forwards the remote port to local port
ssh -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=30 \
    -o ConnectTimeout=10 \
    -o UserKnownHostsFile=/dev/null \
    -o LogLevel=ERROR \
    -R 80:127.0.0.1:${PORT} \
    serveo.net 2>&1 | while IFS= read -r line; do
    echo "🌐 SERVEO: $line"
    # Check if the line contains the URL
    if echo "$line" | grep -q "https://.*\.serveo\.net"; then
        url=$(echo "$line" | grep -o "https://.*\.serveo\.net")
        echo ""
        echo "🎉 =================================="
        echo "🔗 Quiz Quest is now available at:"
        echo "   $url"
        echo "🎉 =================================="
        echo ""
    fi
done