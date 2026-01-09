from ml_engine.semantic_mapper import SemanticMapper

mapper = SemanticMapper()
symptoms = ["pain and burning while urinating", "discomfort in lower abdomen", "need to go many times"]

print("Input:", symptoms)

# Manually verify dictionary
print("\n[DEBUG] 'abdomen' synonyms:", mapper.body_parts.get('abdomen'))
print("[DEBUG] 'stomach' synonyms:", mapper.body_parts.get('stomach'))

# Trace normalization
normalized = mapper.normalize(symptoms)
print("\nFinal Normalized Features:", normalized)

# Check if stomach_pain is present
if 'stomach_pain' in normalized:
    print("\n❌ FAILURE: 'stomach_pain' is still present!")
else:
    print("\n✅ SUCCESS: 'stomach_pain' was successfully removed/avoided.")
