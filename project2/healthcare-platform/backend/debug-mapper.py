from ml_engine.semantic_mapper import SemanticMapper

mapper = SemanticMapper()
symptoms = ["pain and burning while urinating", "discomfort in lower abdomen", "need to go many times"]

print("Input:", symptoms)
normalized = mapper.normalize(symptoms)
print("Normalized Features:", normalized)
