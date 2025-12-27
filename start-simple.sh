#!/bin/bash

echo "🚀 Starting Healthcare AI Platform (Simple Version)..."

# Kill existing processes
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
sleep 2

# Create logs directory
mkdir -p logs

echo "🤖 Starting AI Service..."
cd ai-service
npm run dev > ../logs/ai-service.log 2>&1 &
AI_PID=$!
echo "AI Service started with PID: $AI_PID"

echo "🔧 Starting Backend..."
cd ../backend  
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

echo "🌐 Starting Frontend..."
cd ../frontend
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

sleep 5

echo ""
echo "✅ All services started!"
echo ""
echo "🌍 URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5001"
echo "  AI Service: http://localhost:8000"
echo ""
echo "🔑 Login: admin@test.com / password"
echo ""
echo "📝 View logs:"
echo "  tail -f logs/frontend.log"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/ai-service.log"
echo ""
echo "Press Ctrl+C to stop all services"

cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $FRONTEND_PID $BACKEND_PID $AI_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

while true; do
    sleep 1
done
