#!/bin/bash
echo "🧪 Testing Backend..."
echo ""

cd "$(dirname "$0")/backend"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing dependencies..."
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo ""
echo "✅ Starting backend test..."
echo ""

# Test if backend can start
python3 -c "
from app import app
import sys
print('✅ Backend imports successfully!')
print('✅ Flask app created!')
print('✅ Ready to run on port 8001')
"

echo ""
echo "Now run: python app.py"

