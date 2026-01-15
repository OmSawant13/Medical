#!/bin/bash
echo " [AI-SETUP] Checking Python Environment..."

if [ ! -d "venv" ]; then
    echo " [AI-SETUP] Creating Virtual Environment..."
    python3 -m venv venv
    echo " [AI-SETUP] Activating venv..."
    source venv/bin/activate
    echo " [AI-SETUP] Installing Dependencies (This may take a while for Torch/XRayVision)..."
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo " [AI-SETUP] Starting AI Server..."
echo " [AI-INFO] Note: First run will download ~100MB model weights."
python app_improved.py
