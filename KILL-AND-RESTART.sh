#!/bin/bash

echo "🛑 Killing all running processes..."
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
pkill -f "ts-node.*index.ts" 2>/dev/null
pkill -f "nodemon" 2>/dev/null

echo "🧹 Clearing ports..."
lsof -ti :3000 | xargs kill -9 2>/dev/null
lsof -ti :5001 | xargs kill -9 2>/dev/null
lsof -ti :8000 | xargs kill -9 2>/dev/null

sleep 2

echo "✅ All processes killed!"
echo ""
echo "🚀 Starting Backend..."
cd "$(dirname "$0")/backend"
node server.js &

sleep 3

echo "🚀 Starting Frontend..."
cd "$(dirname "$0")/frontend"
npm start &

echo ""
echo "✅ Services starting!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"

wait

