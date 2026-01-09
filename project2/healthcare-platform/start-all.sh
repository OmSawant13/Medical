#!/bin/bash

echo "🚀 Starting Healthcare Platform Services..."
echo ""

# Kill existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
pkill -f "ts-node.*index.ts" 2>/dev/null
sleep 2

# Start Backend
echo "🔧 Starting Backend (port 5001)..."
cd backend
node server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
cd ..

# Start Frontend
echo "🌐 Starting Frontend (port 3000)..."
cd frontend
BROWSER=none npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
cd ..

# Start AI Service
echo "🤖 Starting AI Service (port 8000)..."
cd ai-service
npx ts-node src/index.ts > ../logs/ai-service.log 2>&1 &
AI_PID=$!
echo "   AI Service PID: $AI_PID"
cd ..

# Start Python ML Engine
echo "🧠 Starting Python ML Engine (port 5002)..."
cd backend
python3 app.py > ../logs/ml-engine.log 2>&1 &
ML_PID=$!
echo "   ML Engine PID: $ML_PID"
cd ..

sleep 5

echo ""
echo "✅ All services started!"
echo ""
echo "🌍 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5001"
echo "   AI Service: http://localhost:8000"
echo ""
echo "🔑 Login Credentials:"
echo "   patient@demo.com / Demo1234!"
echo "   doctor@demo.com / Demo1234!"
echo "   hospital@demo.com / Demo1234!"
echo "   OR admin@test.com / password"
echo ""
echo "📝 View logs:"
echo "   tail -f logs/backend.log"
echo "   tail -f logs/frontend.log"
echo "   tail -f logs/ai-service.log"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID $AI_PID 2>/dev/null; exit" INT TERM
wait

