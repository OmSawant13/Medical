"""
Improved Flask API with Chain-of-Diagnosis Integration
Supports both DiagnosisGPT (if available) and fallback to current system
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import os
import sys

# Import current predictor as fallback
from ml_engine.new_engine import DiseasePredictor

# Try to import CoD integration
try:
    from ml_engine.cod_integration import ImprovedCoDIntegration, load_disease_database
    COD_INTEGRATION_AVAILABLE = True
except ImportError:
    COD_INTEGRATION_AVAILABLE = False
    print(" [INFO] CoD integration not available. Using basic predictor only.")

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize AI Engines
print(" [SERVER] Initializing AI Engines...")

# 1. Always initialize basic predictor (fallback)
basic_predictor = DiseasePredictor()
print(" [SERVER] Basic AI Engine Ready.")

# 2. Try to initialize DiagnosisGPT (optional, requires model)
cod_predictor = None
disease_database = {}

# Check if DiagnosisGPT model directory exists
model_dir = os.path.join(os.path.dirname(__file__), 'cod_repo', 'models', 'DiagnosisGPT-6B')
if COD_INTEGRATION_AVAILABLE:
    # Try to load DiagnosisGPT if model exists
    if os.path.exists(model_dir):
        try:
            cod_predictor = ImprovedCoDIntegration(
                model_dir=model_dir,
                use_gpu=False,  # Set to True if GPU available
                confidence_threshold=0.5
            )
            if cod_predictor.is_loaded:
                print(" [SERVER] DiagnosisGPT Ready!")
        except Exception as e:
            print(f" [WARNING] Could not load DiagnosisGPT: {e}")
    
    # Try to load disease database
    db_path = os.path.join(os.path.dirname(__file__), 'cod_repo', 'disease_database_en.json')
    if not os.path.exists(db_path):
        # Try alternative paths
        db_path = os.path.join(os.path.dirname(__file__), 'Dataset', 'disease_database_en.json')
    
    disease_database = load_disease_database(db_path)

print(" [SERVER] All AI Engines Initialized.")

def filter_negations(symptoms):
    """
    Removes symptoms that are explicitly negated.
    e.g. "no vomiting" -> remove "vomiting" from consideration.
    """
    kept_symptoms = []
    
    # Flatten and split input list
    flattened_symptoms = []
    for raw in symptoms:
        # Split by comma or period
        parts = re.split(r'[.,]\s*', raw)
        for p in parts:
            if p.strip():
                flattened_symptoms.append(p.strip())
    
    print(f" [NLP] Split Symptoms: {flattened_symptoms}")
    
    for sym in flattened_symptoms:
        clean_sym = sym.lower()
        
        # Check for negation patterns
        if re.search(r'\b(no|not|without)\b', clean_sym):
            print(f" [NLP] Negation Detected in '{sym}' -> Excluded.")
            continue
        
        if re.search(r'\bno\b$', clean_sym):
            print(f" [NLP] Postfix Negation Detected in '{sym}' -> Excluded.")
            continue
        
        kept_symptoms.append(sym)
    
    return kept_symptoms

@app.route('/predict_symptoms', methods=['POST'])
def predict():
    """
    Main prediction endpoint.
    Uses DiagnosisGPT if available, otherwise falls back to basic predictor.
    """
    try:
        data = request.json
        raw_symptoms = data.get('symptoms', [])
        
        # Handle String Input
        if isinstance(raw_symptoms, str):
            print(f" [Normalization] Detected String Input. Converting to list.")
            raw_symptoms = [raw_symptoms]
        
        print(f" [REQUEST] Raw Symptoms: {raw_symptoms}")
        
        # 1. Apply Negation Logic
        filtered_symptoms = filter_negations(raw_symptoms)
        print(f" [NLP] Filtered Symptoms: {filtered_symptoms}")
        
        if not filtered_symptoms:
            return jsonify({
                "diagnosis": "Healthy / No Symptoms",
                "confidence": 0,
                "reasoning": "All symptoms were negated or none provided."
            })
        
        # 2. Try DiagnosisGPT first (if available)
        if cod_predictor and cod_predictor.is_loaded:
            try:
                print(" [AI] Using DiagnosisGPT (Chain-of-Diagnosis)...")
                result = cod_predictor.predict(filtered_symptoms)
                
                # Enhance with disease database if available
                if disease_database and result.get('confidence', 0) < 80:
                    from ml_engine.cod_integration import enhance_predictions_with_database
                    enhanced = enhance_predictions_with_database(
                        basic_predictor,
                        disease_database,
                        filtered_symptoms,
                        top_k=3
                    )
                    if enhanced:
                        result['differential_diagnosis'] = [d['disease'] for d in enhanced]
                
                if result:
                    print(f" [AI] DiagnosisGPT Result: {result}")
                    return jsonify(result)
            except Exception as e:
                print(f" [WARNING] DiagnosisGPT failed: {e}. Falling back to basic predictor.")
        
        # 3. Fallback to basic predictor
        print(" [AI] Using Basic Predictor...")
        result = basic_predictor.predict(filtered_symptoms)
        
        # Enhance with disease database if available
        if disease_database and result.get('confidence', 0) < 80:
            try:
                from ml_engine.cod_integration import enhance_predictions_with_database
                enhanced = enhance_predictions_with_database(
                    basic_predictor,
                    disease_database,
                    filtered_symptoms,
                    top_k=3
                )
                if enhanced:
                    result['differential_diagnosis'] = [d['disease'] for d in enhanced]
            except Exception as e:
                print(f" [WARNING] Database enhancement failed: {e}")
        
        if result:
            print(f" [AI] Basic Predictor Result: {result}")
            return jsonify(result)
        else:
            return jsonify({
                "diagnosis": "Undiagnosed",
                "confidence": 0,
                "reasoning": "AI could not match symptoms to any known pathology."
            })
    
    except Exception as e:
        print(f" [ERROR] {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "basic_predictor": "ready",
        "diagnosisgpt": "ready" if (cod_predictor and cod_predictor.is_loaded) else "not_available",
        "disease_database": "loaded" if disease_database else "not_loaded"
    })

if __name__ == '__main__':
    print(" [SERVER] Starting Improved AI Server on Port 5002...")
    app.run(host='0.0.0.0', port=5002, debug=False)

