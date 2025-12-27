#!/bin/bash

echo "Starting Healthcare AI Platform..."

# Kill existing processes
echo "Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true  
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Start MongoDB
echo "Starting MongoDB..."
brew services start mongodb/brew/mongodb-community
sleep 3

# Start AI service in background
echo "Starting AI Service on port 8000..."
cd ai-service && npm run dev > ../logs/ai-service.log 2>&1 &
AI_PID=$!

sleep 3

# Start backend in background
echo "Starting Backend on port 5001..."
cd ../backend && npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

sleep 3

# Start frontend in background
echo "Starting Frontend on port 3000..."
cd ../frontend && npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "Services started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5001"
echo "AI Service: http://localhost:8000"
echo ""
echo "PIDs: AI=$AI_PID, Backend=$BACKEND_PID, Frontend=$FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo 'Stopping services...'; kill $AI_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
