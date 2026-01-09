
from flask import Flask, request, jsonify
from flask_cors import CORS
import re
from ml_engine.new_engine import DiseasePredictor

app = Flask(__name__)
CORS(app) # Enable CORS for frontend

# Initialize AI Engine
print(" [SERVER] Initializing AI Engine...")
predictor = DiseasePredictor()
print(" [SERVER] AI Engine Ready.")

def filter_negations(symptoms):
    """
    Removes symptoms that are explicitly negated.
    e.g. "no vomiting" -> remove "vomiting" from consideration.
    """
    # 1. First, normalize and split
    # If the frontend sends ["Headache. No vomiting."], we want to split this.
    
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
        # Pattern 1: Prefix "no X", "not X", "without X"
        # We check if the ENTIRE symptom string starts with variable negation or contains it
        # Actually, simpler: if the string ITSELF contains "no <word>", we should probably just drop the whole string 
        # or remove the negated part.
        
        # If the user explicitly wrote "no vomiting" as a symptom entry,
        # we should NOT pass "vomiting" to the engine.
        # The engine uses "vomiting" as a keyword. 
        # So we just EXCLUDE this string from the list if it has negation.
        
        # Broad check: does it contain negation words?
        if re.search(r'\b(no|not|without)\b', clean_sym):
            print(f" [NLP] Negation Detected in '{sym}' -> Excluded.")
            continue
            
        # Postfix check: "vomiting no"
        if re.search(r'\bno\b$', clean_sym):
             print(f" [NLP] Postfix Negation Detected in '{sym}' -> Excluded.")
             continue
             
        kept_symptoms.append(sym)
        
    return kept_symptoms

@app.route('/predict_symptoms', methods=['POST'])
def predict():
    try:
        data = request.json
        raw_symptoms = data.get('symptoms', [])
        
        # ROOT CAUSE FIX: Handle String Input
        # If frontend sends "Headache, nausea" (String), we must convert to List.
        if isinstance(raw_symptoms, str):
             print(f" [Normalization] Detected String Input. converting to list.")
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

        # 2. Predict
        result = predictor.predict(filtered_symptoms)
        
        if result:
            print(f" [AI] Result: {result}")
            return jsonify(result)
        else:
            return jsonify({
                "diagnosis": "Undiagnosed",
                "confidence": 0,
                "reasoning": "AI could not match symptoms to any known pathology."
            })

    except Exception as e:
        print(f" [ERROR] {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print(" [SERVER] Starting AI Server on Port 5002...")
    app.run(host='0.0.0.0', port=5002, debug=False)
