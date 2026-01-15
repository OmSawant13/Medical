#!/bin/bash
cd "$(dirname "$0")/frontend"
echo "🌐 Starting Frontend Server..."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "✅ Starting frontend on http://localhost:5001"
echo "Press Ctrl+C to stop"
echo ""
npm start

