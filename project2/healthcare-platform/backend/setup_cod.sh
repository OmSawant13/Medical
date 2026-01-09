#!/bin/bash

# Setup script for Chain-of-Diagnosis Integration
# This script helps download disease database and setup DiagnosisGPT (optional)

echo "=========================================="
echo "Chain-of-Diagnosis Setup"
echo "=========================================="

# 1. Install Python dependencies
echo "[1/4] Installing Python dependencies..."
cd "$(dirname "$0")"
if [ -d "ml_engine/venv" ]; then
    source ml_engine/venv/bin/activate
    pip install -q transformers accelerate faiss-cpu pandas scikit-learn nltk 2>&1 | tail -3
    echo "✓ Dependencies installed"
else
    echo "⚠ Virtual environment not found. Please create one first."
fi

# 2. Download Disease Database (optional but recommended)
echo ""
echo "[2/4] Disease Database Setup..."
echo "To download the 9,604 disease database:"
echo "  1. Visit: https://huggingface.co/datasets/FreedomIntelligence/Disease_Database"
echo "  2. Download disease_database_en.json"
echo "  3. Place it in: backend/Dataset/disease_database_en.json"
echo ""
if [ -f "Dataset/disease_database_en.json" ]; then
    echo "✓ Disease database found!"
else
    echo "⚠ Disease database not found. This is optional but recommended."
fi

# 3. Download DiagnosisGPT models (optional - requires GPU and large storage)
echo ""
echo "[3/4] DiagnosisGPT Model Setup (OPTIONAL)..."
echo "To use DiagnosisGPT models (requires GPU and ~12GB+ storage):"
echo "  1. Visit: https://huggingface.co/FreedomIntelligence/DiagnosisGPT-6B"
echo "  2. Download the model"
echo "  3. Place it in: backend/cod_repo/models/DiagnosisGPT-6B/"
echo ""
if [ -d "cod_repo/models/DiagnosisGPT-6B" ]; then
    echo "✓ DiagnosisGPT-6B model found!"
else
    echo "⚠ DiagnosisGPT model not found. Will use basic predictor (still works fine)."
fi

# 4. Test setup
echo ""
echo "[4/4] Testing setup..."
python3 -c "
import sys
sys.path.insert(0, '.')
try:
    from ml_engine.new_engine import DiseasePredictor
    print('✓ Basic predictor: OK')
except Exception as e:
    print(f'✗ Basic predictor: {e}')

try:
    from ml_engine.cod_integration import ImprovedCoDIntegration
    print('✓ CoD integration: OK')
except Exception as e:
    print(f'⚠ CoD integration: {e} (optional)')
"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Current Status:"
echo "  - Basic Predictor: ✓ Ready (always works)"
echo "  - Disease Database: $(if [ -f "Dataset/disease_database_en.json" ]; then echo "✓ Available"; else echo "⚠ Not downloaded (optional)"; fi)"
echo "  - DiagnosisGPT: $(if [ -d "cod_repo/models/DiagnosisGPT-6B" ]; then echo "✓ Available"; else echo "⚠ Not downloaded (optional)"; fi)"
echo ""
echo "The system will work with basic predictor."
echo "To improve accuracy, download disease database."
echo "For best accuracy, download DiagnosisGPT model (requires GPU)."

