
class DiseasePredictor:
    def __init__(self):
        print(" [ML] Basic Disease Predictor Initialized (Fallback Mode)")
    
    def predict(self, symptoms):
        # Basic keyword matching fallback
        symptoms_str = " ".join(symptoms).lower()
        
        if "fever" in symptoms_str and "cough" in symptoms_str:
            return {
                "diagnosis": "Viral Infection",
                "confidence": 85,
                "reasoning": "Combination of fever and cough typically indicates viral upper respiratory infection.",
                "precautions": ["Rest", "Hydration", "Monitor temperature"],
                "specialist": "General Physician"
            }
        elif "chest pain" in symptoms_str:
             return {
                "diagnosis": "Potential Cardiac Issue",
                "confidence": 90,
                "reasoning": "Chest pain is a critical symptom requiring immediate attention.",
                "precautions": ["Avoid exertion", "Seek immediate medical help"],
                "specialist": "Cardiologist"
            }
        elif "headache" in symptoms_str:
             return {
                "diagnosis": "Mirgraine / Tension Headache",
                "confidence": 75,
                "reasoning": "Common presentation of stress or migraine triggers.",
                "precautions": ["Rest in dark room", "Hydration"],
                "specialist": "Neurologist"
            }
            
        return {
            "diagnosis": "General Symptoms",
            "confidence": 50,
            "reasoning": "Symptoms are non-specific. Consultation recommended.",
             "precautions": ["Monitor symptoms"],
             "specialist": "General Physician"
        }
