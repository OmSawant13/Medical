#!/bin/bash

# Start ML Engine Server
cd "$(dirname "$0")"

echo "🚀 Starting ML Engine Server..."

# Kill any existing processes
pkill -f "python.*app.py" 2>/dev/null
sleep 2

# Create logs directory
mkdir -p ../logs

# Start server
if [ -d "ml_engine/venv" ]; then
    source ml_engine/venv/bin/activate
    echo "✅ Using virtual environment"
    python app.py > ../logs/ml-engine.log 2>&1 &
    SERVER_PID=$!
    echo "✅ Server started with PID: $SERVER_PID"
    echo "📝 Logs: ../logs/ml-engine.log"
    
    # Wait a bit and check
    sleep 5
    if ps -p $SERVER_PID > /dev/null; then
        echo "✅ Server is running!"
        echo "🌐 Health check: http://localhost:5002/health"
    else
        echo "❌ Server failed to start. Check logs:"
        tail -20 ../logs/ml-engine.log
    fi
else
    echo "⚠️ No virtual environment found. Using system Python..."
    python3 app.py > ../logs/ml-engine.log 2>&1 &
    SERVER_PID=$!
    echo "✅ Server started with PID: $SERVER_PID"
fi

echo ""
echo "To stop: pkill -f 'python.*app.py'"
echo "To view logs: tail -f ../logs/ml-engine.log"

