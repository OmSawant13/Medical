#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Starting Medical Diagnosis Backend..."

# Create venv if it doesn't exist
if [ ! -d "venv_new" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv_new
fi

# Activate venv
echo "Activating virtual environment..."
source venv_new/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q Flask flask-cors openai python-dotenv

# Start server
echo "✅ Starting backend on http://localhost:8001"
echo "Press Ctrl+C to stop"
echo ""
python app.py

