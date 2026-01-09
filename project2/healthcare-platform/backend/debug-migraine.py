from ml_engine.semantic_mapper import SemanticMapper

mapper = SemanticMapper()
symptoms = [
    "Severe headache on one side since morning", 
    "Light and noise make it worse", 
    "Feeling nauseous but no vomiting", 
    "Need to lie down"
]

print("Input:", symptoms)
print("\n[DEBUG] Dictionary 'light':", mapper.body_parts.get('light'))
print("[DEBUG] Dictionary 'sensitivity':", mapper.sensations.get('sensitivity'))

normalized = mapper.normalize(symptoms)
print("\nNormalized Features:", normalized)
