#!/bin/bash

echo "🏥 Starting Healthcare AI Platform..."

# Function to kill processes on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start MongoDB
echo "🍃 Starting MongoDB..."
brew services start mongodb-community 2>/dev/null || echo "MongoDB service not available via brew"

# Start Backend
echo "🔧 Starting Backend Server..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

mkdir -p uploads
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 5

# Start Frontend
echo "⚛️  Starting Frontend Server..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

npm start &
FRONTEND_PID=$!

echo "✅ Platform started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:5000"
echo "📊 Demo Credentials:"
echo "   Patient: patient@demo.com / demo123"
echo "   Doctor: doctor@demo.com / demo123"
echo "   Hospital: hospital@demo.com / demo123"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for processes
wait
