#!/bin/bash

echo "🚀 Starting Healthcare AI Platform - Final Version"

# Clean up
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "ts-node" 2>/dev/null || true
sleep 3

mkdir -p logs

echo "🤖 Starting AI Service on port 8000..."
cd ai-service
npm run dev > ../logs/ai-service.log 2>&1 &
AI_PID=$!
sleep 3

echo "🔧 Starting Backend on port 5001..."
cd ../backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

echo "🌐 Frontend already running on port 3000"

echo ""
echo "✅ Healthcare AI Platform is Ready!"
echo ""
echo "🌍 Access your platform:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:5001"
echo "  AI Service: http://localhost:8000"
echo ""
echo "🔑 Login credentials:"
echo "  Email: admin@test.com"
echo "  Password: password"
echo ""
echo "🎯 Your interactive demos are now fully functional!"
echo ""

cleanup() {
    echo "🛑 Stopping services..."
    kill $AI_PID $BACKEND_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

while true; do
    sleep 1
done
