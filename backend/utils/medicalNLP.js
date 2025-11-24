/**
 * Medical NLP Service
 * Integrates with existing medical NLP libraries and models
 * Uses Hugging Face Transformers for clinical text analysis
 */

const axios = require('axios');

/**
 * Medical report summarization using Hugging Face models
 * Uses clinical transformer models for better accuracy
 */
const summarizeMedicalReport = async (reportText) => {
  try {
    // Option 1: Use Hugging Face Inference API (Free tier available)
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        // Use BioBERT or ClinicalBERT models via Hugging Face
        // Better models for medical text: 
        // - emilyalsentzer/Bio_ClinicalBERT (good for clinical notes)
        // - microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext (better for abstracts)
        // - dmis-lab/biobert-base-cased-v1.2 (good for biomedical text)
        const modelName = process.env.HF_MEDICAL_MODEL || 'emilyalsentzer/Bio_ClinicalBERT';
        
        const response = await axios.post(
          `https://api-inference.huggingface.co/models/${modelName}`,
          {
            inputs: `Summarize this medical report in clinical language: ${reportText.substring(0, 1000)}`,
            parameters: {
              max_length: 250,
              min_length: 80,
              do_sample: false,
              temperature: 0.3 // Lower temperature for more accurate, deterministic output
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        if (response.data && response.data[0] && response.data[0].summary_text) {
          return {
            summary: response.data[0].summary_text,
            model: 'Bio_ClinicalBERT',
            source: 'huggingface'
          };
        }
      } catch (hfError) {
        console.warn('Hugging Face API error, falling back:', hfError.message);
      }
    }

    // Option 2: Use Gemini with medical-specific prompt
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const medicalPrompt = `You are a medical AI assistant trained on clinical data. Analyze and summarize this medical report:

${reportText.substring(0, 3000)}

Provide a structured summary with:
1. **Clinical Findings**: Key observations and test results
2. **Diagnosis**: Primary and differential diagnoses
3. **Recommendations**: Next steps and follow-up care
4. **Risk Assessment**: Any critical findings or urgent actions needed

Format: Clear, concise, professional medical language.`;

      const result = await model.generateContent(medicalPrompt);
      const response = await result.response;
      
      return {
        summary: response.text(),
        model: 'Gemini-1.5-Flash (Medical)',
        source: 'google'
      };
    }

    // Fallback: Pattern-based analysis
    return null;
  } catch (error) {
    console.error('Medical NLP Summarization Error:', error);
    return null;
  }
};

/**
 * Extract medical entities (diseases, medications, symptoms)
 * Uses pattern matching + AI for entity extraction
 */
const extractMedicalEntities = async (reportText) => {
  const entities = {
    diseases: [],
    medications: [],
    symptoms: [],
    procedures: [],
    labValues: []
  };

  // Common medical patterns
  const diseasePatterns = [
    /\b(diabetes|hypertension|asthma|pneumonia|bronchitis|arthritis|osteoporosis|anemia|thyroid|kidney disease|heart disease|cancer|tumor)\b/gi,
    /\b(COVID-19|SARS-CoV-2|coronavirus)\b/gi
  ];

  const medicationPatterns = [
    /\b(paracetamol|acetaminophen|ibuprofen|aspirin|amoxicillin|penicillin|metformin|insulin|atorvastatin|omeprazole)\b/gi,
    /\b(\d+\s*(mg|ml|g|units?))\s+of\s+([a-z\s]+)/gi
  ];

  const symptomPatterns = [
    /\b(fever|headache|pain|nausea|vomiting|cough|shortness of breath|fatigue|dizziness|chest pain|abdominal pain)\b/gi
  ];

  const labValuePatterns = [
    /\b(Hb|Hemoglobin|WBC|RBC|Platelet|Glucose|Cholesterol|Creatinine|BUN|ALT|AST)\s*[:=]\s*([\d.]+)/gi
  ];

  // Extract entities
  diseasePatterns.forEach(pattern => {
    const matches = reportText.match(pattern);
    if (matches) {
      entities.diseases.push(...matches.map(m => m.toLowerCase()));
    }
  });

  medicationPatterns.forEach(pattern => {
    const matches = reportText.match(pattern);
    if (matches) {
      entities.medications.push(...matches.map(m => m.toLowerCase()));
    }
  });

  symptomPatterns.forEach(pattern => {
    const matches = reportText.match(pattern);
    if (matches) {
      entities.symptoms.push(...matches.map(m => m.toLowerCase()));
    }
  });

  labValuePatterns.forEach(pattern => {
    const matches = [...reportText.matchAll(pattern)];
    if (matches) {
      entities.labValues.push(...matches.map(m => ({
        test: m[1],
        value: parseFloat(m[2])
      })));
    }
  });

  // Remove duplicates
  entities.diseases = [...new Set(entities.diseases)];
  entities.medications = [...new Set(entities.medications)];
  entities.symptoms = [...new Set(entities.symptoms)];

  return entities;
};

/**
 * Analyze lab test results
 * Extracts abnormal values and interprets them
 */
const analyzeLabResults = async (reportText) => {
  const analysis = {
    normal: [],
    abnormal: [],
    critical: [],
    recommendations: []
  };

  // Common lab reference ranges
  const labRanges = {
    'glucose': { min: 70, max: 100, unit: 'mg/dL', critical: { min: 40, max: 400 } },
    'hemoglobin': { min: 12, max: 16, unit: 'g/dL', critical: { min: 7, max: 20 } },
    'wbc': { min: 4000, max: 11000, unit: '/μL', critical: { min: 2000, max: 30000 } },
    'creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL', critical: { min: 0.3, max: 5.0 } }
  };

  // Extract lab values
  const labPattern = /\b(glucose|hemoglobin|hb|wbc|rbc|creatinine|cholesterol|alt|ast)\s*[:=]\s*([\d.]+)/gi;
  const matches = [...reportText.matchAll(labPattern)];

  matches.forEach(match => {
    const testName = match[1].toLowerCase();
    const value = parseFloat(match[2]);
    const range = labRanges[testName];

    if (range) {
      const result = {
        test: testName,
        value: value,
        unit: range.unit,
        status: 'normal'
      };

      if (value < range.critical.min || value > range.critical.max) {
        result.status = 'critical';
        analysis.critical.push(result);
        analysis.recommendations.push(`Critical ${testName} value: ${value} ${range.unit}. Immediate medical attention required.`);
      } else if (value < range.min || value > range.max) {
        result.status = 'abnormal';
        analysis.abnormal.push(result);
        analysis.recommendations.push(`Abnormal ${testName} value: ${value} ${range.unit}. Follow up with doctor.`);
      } else {
        analysis.normal.push(result);
      }
    }
  });

  return analysis;
};

/**
 * Generate diagnosis suggestions based on symptoms and findings
 */
const suggestDiagnosis = async (symptoms, findings) => {
  // Medical knowledge base (simplified)
  const diagnosisMap = {
    'fever + cough + shortness of breath': ['Pneumonia', 'Bronchitis', 'COVID-19'],
    'chest pain + shortness of breath': ['Heart Attack', 'Angina', 'Pulmonary Embolism'],
    'headache + nausea + vision changes': ['Migraine', 'Hypertension', 'Brain Tumor'],
    'joint pain + stiffness': ['Arthritis', 'Rheumatoid Arthritis', 'Osteoarthritis'],
    'fatigue + weight loss': ['Diabetes', 'Thyroid Disorder', 'Anemia']
  };

  const symptomKey = symptoms.join(' + ').toLowerCase();
  
  // Find matching patterns
  for (const [pattern, diagnoses] of Object.entries(diagnosisMap)) {
    if (symptomKey.includes(pattern.toLowerCase())) {
      return {
        possibleDiagnoses: diagnoses,
        confidence: 'medium',
        note: 'Based on symptom patterns. Clinical evaluation required.'
      };
    }
  }

  return {
    possibleDiagnoses: [],
    confidence: 'low',
    note: 'Insufficient information for diagnosis suggestion.'
  };
};

module.exports = {
  summarizeMedicalReport,
  extractMedicalEntities,
  analyzeLabResults,
  suggestDiagnosis
};

