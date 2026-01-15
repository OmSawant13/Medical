#!/bin/bash
cd "$(dirname "$0")/backend"
echo "🏥 Starting Backend Server..."
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.installed" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

echo "✅ Starting backend on http://localhost:8001"
echo "Press Ctrl+C to stop"
echo ""
python app.py

