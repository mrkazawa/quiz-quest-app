#!/bin/sh

# localhost.run tunnel script for Quiz Quest
# Usage: ./localhost-run.sh [port]
# Default port is 3000 if not specified

PORT=${1:-3000}

echo "🚀 Starting localhost.run tunnel for Quiz Quest..."
echo "📡 Tunneling localhost:${PORT} to a public URL"
echo ""
echo "🔗 This will create a public URL that tunnels to your local server"
echo "💡 Make sure your Quiz Quest server is running on port ${PORT}"
echo ""
echo "🔄 Connecting to localhost.run..."
echo ""

# Create the tunnel using localhost.run with no-key method
# Use a random subdomain to avoid key requirements
RANDOM_ID=$(date +%s | tail -c 6)
ssh -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=30 \
    -o ConnectTimeout=10 \
    -o UserKnownHostsFile=/dev/null \
    -o LogLevel=ERROR \
    -R ${RANDOM_ID}:80:127.0.0.1:${PORT} \
    nokey@localhost.run 2>&1 | while IFS= read -r line; do
    echo "🌐 LOCALHOST.RUN: $line"
    # Check if the line contains the URL
    if echo "$line" | grep -q "https://.*\.lhr\.life\|https://.*\.localhost\.run"; then
        url=$(echo "$line" | grep -oE "https://[a-zA-Z0-9.-]+\.(lhr\.life|localhost\.run)")
        echo ""
        echo "🎉 =================================="
        echo "🔗 Quiz Quest is now available at:"
        echo "   $url"
        echo "🎉 =================================="
        echo ""
    fi
done