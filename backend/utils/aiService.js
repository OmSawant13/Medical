// AI Service for report analysis and hereditary pattern summarization
// Supports Google Gemini, OpenAI, Anthropic, or fallback to intelligent pattern matching

// Note: axios not needed for pattern analysis, only for future API integrations

/**
 * Intelligent pattern-based analysis (works without API)
 * Extracts key medical information from text
 */
const intelligentPatternAnalysis = (reportText) => {
  const text = reportText.toLowerCase();
  const findings = [];
  const recommendations = [];
  
  // Detect common medical conditions
  const conditions = {
    'diabetes': { severity: 'high', rec: 'Monitor blood sugar levels regularly' },
    'hypertension': { severity: 'high', rec: 'Monitor blood pressure and follow medication schedule' },
    'fever': { severity: 'medium', rec: 'Rest and stay hydrated. Monitor temperature' },
    'infection': { severity: 'high', rec: 'Complete prescribed antibiotic course' },
    'pain': { severity: 'medium', rec: 'Follow pain management plan' },
    'inflammation': { severity: 'medium', rec: 'Follow anti-inflammatory treatment' },
    'cancer': { severity: 'critical', rec: 'Follow oncology treatment plan strictly' },
    'heart': { severity: 'critical', rec: 'Cardiac monitoring required' },
    'asthma': { severity: 'medium', rec: 'Keep inhaler accessible' },
    'allergy': { severity: 'medium', rec: 'Avoid allergens and keep medication ready' }
  };

  // Extract findings
  Object.keys(conditions).forEach(condition => {
    if (text.includes(condition)) {
      findings.push(`${condition.charAt(0).toUpperCase() + condition.slice(1)} detected in report`);
      recommendations.push(conditions[condition].rec);
    }
  });

  // Extract medications mentioned
  const medicationPattern = /(?:prescribed|medication|medicine|drug|tablet|dose|mg|ml)\s+([a-z\s]+)/gi;
  const medications = [];
  let match;
  while ((match = medicationPattern.exec(reportText)) !== null && medications.length < 5) {
    medications.push(match[1].trim());
  }

  // Generate intelligent summary
  let summary = 'Medical Report Analysis:\n\n';
  
  if (findings.length > 0) {
    summary += `Key Findings:\n${findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n`;
  } else {
    summary += 'Report reviewed. General medical information present.\n\n';
  }

  if (medications.length > 0) {
    summary += `Medications Mentioned: ${medications.join(', ')}\n\n`;
  }

  if (recommendations.length > 0) {
    summary += `Recommendations:\n${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n`;
  } else {
    summary += 'Recommendations:\n1. Follow up with healthcare provider\n2. Monitor symptoms\n3. Adhere to treatment plan\n\n';
  }

  summary += '⚠️ Note: This is an automated analysis. Always consult with your healthcare provider for professional medical advice.';

  return {
    summary,
    keyFindings: findings.length > 0 ? findings : ['Report contains medical information requiring professional review'],
    recommendations: recommendations.length > 0 ? recommendations : ['Follow up with doctor', 'Monitor symptoms'],
    confidence: findings.length > 0 ? 0.75 : 0.60,
    medications: medications,
    isAIGenerated: false
  };
};

/**
 * Analyze medical images using Gemini Vision API
 */
const analyzeMedicalImage = async (imageData, mimeType, recordType, reportText = '') => {
  try {
    if (!process.env.GEMINI_API_KEY && !process.env.AI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (!apiKey.startsWith('AIza')) {
      throw new Error('Invalid Gemini API key');
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-1.5-pro-vision or gemini-1.5-flash for vision tasks
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create prompt based on record type
    let prompt = '';
    if (recordType === 'xray') {
      prompt = `You are a medical AI assistant specializing in radiology. Analyze this chest X-ray image and provide:

1. **Findings**: Describe what you observe in the X-ray (lungs, heart, bones, any abnormalities)
2. **Potential Conditions**: List possible conditions or abnormalities detected
3. **Severity Assessment**: Rate severity (Normal/Mild/Moderate/Severe/Critical)
4. **Recommendations**: Suggest next steps (follow-up, additional tests, specialist consultation)

${reportText ? `Additional Context: ${reportText}` : ''}

IMPORTANT: This is an AI-assisted analysis. Always consult with a qualified radiologist or healthcare provider for definitive diagnosis.`;
    } else if (recordType === 'lab_test') {
      prompt = `You are a medical AI assistant. Analyze this lab test report image and provide:

1. **Test Results**: Extract and summarize key test values
2. **Abnormal Values**: Highlight any values outside normal ranges
3. **Interpretation**: Explain what these results might indicate
4. **Recommendations**: Suggest follow-up actions

${reportText ? `Additional Context: ${reportText}` : ''}

IMPORTANT: This is an AI-assisted analysis. Always consult with a qualified healthcare provider for proper interpretation.`;
    } else {
      prompt = `You are a medical AI assistant. Analyze this medical image and provide:

1. **Observations**: Describe what you see in the image
2. **Key Findings**: Highlight important findings
3. **Recommendations**: Suggest next steps

${reportText ? `Additional Context: ${reportText}` : ''}

IMPORTANT: This is an AI-assisted analysis. Always consult with a qualified healthcare provider for professional medical advice.`;
    }

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const analysis = response.text();

    return {
      summary: analysis,
      keyFindings: extractFindings(analysis),
      recommendations: extractRecommendations(analysis),
      confidence: 0.85,
      isAIGenerated: true,
      model: 'Google Gemini 1.5 Flash Vision',
      hasImageAnalysis: true
    };
  } catch (error) {
    console.error('Medical Image Analysis Error:', error);
    throw error;
  }
};

/**
 * Analyze medical report using AI (OpenAI/Anthropic) or fallback
 * Now supports both text and image analysis
 */
const analyzeReport = async (reportText, files = [], recordType = 'other') => {
  try {
    // If files are provided and contain images, analyze them first
    if (files && files.length > 0) {
      const { processImagesForAI, isImageFile } = require('./imageProcessor');
      const path = require('path');
      const fs = require('fs');
      
      const imageFiles = files.filter(file => {
        const filePath = typeof file === 'string' 
          ? path.join(__dirname, '../../uploads', path.basename(file))
          : file.path || file;
        return isImageFile(filePath);
      });

      if (imageFiles.length > 0 && (process.env.GEMINI_API_KEY || process.env.AI_API_KEY)) {
        try {
          // Process first image (can be extended to handle multiple)
          const imageFile = imageFiles[0];
          const imagePath = typeof imageFile === 'string'
            ? path.join(__dirname, '../../uploads', path.basename(imageFile))
            : imageFile.path || imageFile;
          
          if (fs.existsSync(imagePath)) {
            const { imageToBase64 } = require('./imageProcessor');
            const imageData = imageToBase64(imagePath);
            
            const imageAnalysis = await analyzeMedicalImage(
              imageData.data,
              imageData.mimeType,
              recordType,
              reportText
            );
            
            // Combine text and image analysis
            if (reportText && reportText.trim().length > 0) {
              const textAnalysis = await analyzeReportText(reportText);
              return {
                ...imageAnalysis,
                summary: `${imageAnalysis.summary}\n\n--- Text Analysis ---\n${textAnalysis.summary}`,
                keyFindings: [...imageAnalysis.keyFindings, ...textAnalysis.keyFindings],
                recommendations: [...imageAnalysis.recommendations, ...textAnalysis.recommendations],
                hasImageAnalysis: true,
                hasTextAnalysis: true
              };
            }
            
            return imageAnalysis;
          }
        } catch (imageError) {
          console.warn('Image analysis failed, falling back to text:', imageError.message);
          // Fall through to text analysis
        }
      }
    }

    // Text-only analysis
    return await analyzeReportText(reportText);
    
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      summary: 'Unable to analyze report at this time. Please consult with your healthcare provider.',
      keyFindings: ['Analysis temporarily unavailable'],
      recommendations: ['Consult with healthcare provider'],
      confidence: 0,
      isAIGenerated: false
    };
  }
};

/**
 * Analyze report text only (internal function)
 * Now uses medical NLP libraries for better analysis
 */
const analyzeReportText = async (reportText) => {
  try {
    // Try medical NLP summarization first (if available)
    try {
      const { summarizeMedicalReport, extractMedicalEntities, analyzeLabResults } = require('./medicalNLP');
      
      // Get medical summary
      const medicalSummary = await summarizeMedicalReport(reportText);
      if (medicalSummary && medicalSummary.summary) {
        // Extract entities
        const entities = await extractMedicalEntities(reportText);
        
        // Analyze lab results if present
        const labAnalysis = reportText.toLowerCase().includes('lab') || reportText.toLowerCase().includes('test') 
          ? await analyzeLabResults(reportText)
          : null;

        return {
          summary: medicalSummary.summary,
          keyFindings: extractFindings(medicalSummary.summary),
          recommendations: extractRecommendations(medicalSummary.summary),
          entities: entities,
          labAnalysis: labAnalysis,
          confidence: 0.92,
          isAIGenerated: true,
          model: medicalSummary.model || 'Medical NLP',
          source: medicalSummary.source || 'hybrid'
        };
      }
    } catch (nlpError) {
      console.warn('Medical NLP not available, using standard AI:', nlpError.message);
    }

    // Fallback to standard AI analysis
    if (process.env.AI_API_KEY && process.env.AI_API_KEY !== 'your_ai_api_key_here') {
      try {
        // Try Google Gemini first (API keys start with AIza)
        if (process.env.AI_API_KEY.startsWith('AIza') || process.env.GEMINI_API_KEY) {
          let { GoogleGenerativeAI } = require('@google/generative-ai');
          const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          
          // Enhanced medical prompt
          const prompt = `You are a medical AI assistant trained on clinical data. Analyze this medical report and provide structured insights. Always emphasize consulting healthcare professionals. 

Report: ${reportText.substring(0, 3000)}

Provide:
1. **Clinical Findings**: Key observations and test results
2. **Diagnosis**: Primary and differential diagnoses  
3. **Recommendations**: Next steps and follow-up care
4. **Risk Assessment**: Any critical findings

Format your response clearly with sections.`;
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const aiSummary = response.text();
          
          return {
            summary: aiSummary,
            keyFindings: extractFindings(aiSummary),
            recommendations: extractRecommendations(aiSummary),
            confidence: 0.90,
            isAIGenerated: true,
            model: 'Google Gemini 1.5 Flash (Medical)'
          };
        }
        // Try OpenAI
        else if (process.env.AI_API_KEY.startsWith('sk-')) {
          let OpenAI;
          try {
            OpenAI = require('openai');
          } catch (e) {
            throw new Error('OpenAI package not installed. Run: npm install openai');
          }
          const openai = new OpenAI({ apiKey: process.env.AI_API_KEY });
          
          const response = await openai.chat.completions.create({
            model: process.env.AI_MODEL || 'gpt-4',
            messages: [
              {
                role: "system",
                content: "You are a medical AI assistant. Analyze medical reports and provide structured insights. Always emphasize consulting healthcare professionals. Return findings in clear, structured format."
              },
              {
                role: "user",
                content: `Analyze this medical report and provide:\n1. Key findings\n2. Recommendations\n3. Important notes\n\nReport: ${reportText.substring(0, 3000)}`
              }
            ],
            temperature: 0.3,
            max_tokens: 500
          });
          
          const aiSummary = response.choices[0].message.content;
          
          return {
            summary: aiSummary,
            keyFindings: extractFindings(aiSummary),
            recommendations: extractRecommendations(aiSummary),
            confidence: 0.90,
            isAIGenerated: true,
            model: 'OpenAI GPT-4'
          };
        }
        // Try Anthropic Claude
        else if (process.env.AI_API_KEY.startsWith('sk-ant-')) {
          let Anthropic;
          try {
            Anthropic = require('@anthropic-ai/sdk');
          } catch (e) {
            throw new Error('Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk');
          }
          const anthropic = new Anthropic({ apiKey: process.env.AI_API_KEY });
          
          const response = await anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 500,
            messages: [{
              role: 'user',
              content: `Analyze this medical report: ${reportText.substring(0, 3000)}`
            }]
          });
          
          const aiSummary = response.content[0].text;
          
          return {
            summary: aiSummary,
            keyFindings: extractFindings(aiSummary),
            recommendations: extractRecommendations(aiSummary),
            confidence: 0.90,
            isAIGenerated: true,
            model: 'Anthropic Claude'
          };
        }
      } catch (aiError) {
        console.warn('AI API Error, falling back to pattern analysis:', aiError.message);
        // Fall through to pattern analysis
      }
    }

    // Fallback: Intelligent pattern-based analysis (works without API)
    return intelligentPatternAnalysis(reportText);
    
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      summary: 'Unable to analyze report at this time. Please consult with your healthcare provider.',
      keyFindings: ['Analysis temporarily unavailable'],
      recommendations: ['Consult with healthcare provider'],
      confidence: 0,
      isAIGenerated: false
    };
  }
};

/**
 * Extract findings from AI response
 */
const extractFindings = (text) => {
  const findings = [];
  const lines = text.split('\n');
  let inFindings = false;
  
  lines.forEach(line => {
    if (line.toLowerCase().includes('finding') || line.toLowerCase().includes('key point')) {
      inFindings = true;
    }
    if (inFindings && (line.match(/^\d+\./) || line.match(/^[-•]/))) {
      findings.push(line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim());
    }
  });
  
  return findings.length > 0 ? findings : ['Report analyzed successfully'];
};

/**
 * Extract recommendations from AI response
 */
const extractRecommendations = (text) => {
  const recommendations = [];
  const lines = text.split('\n');
  let inRecommendations = false;
  
  lines.forEach(line => {
    if (line.toLowerCase().includes('recommend') || line.toLowerCase().includes('suggest')) {
      inRecommendations = true;
    }
    if (inRecommendations && (line.match(/^\d+\./) || line.match(/^[-•]/))) {
      recommendations.push(line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim());
    }
  });
  
  return recommendations.length > 0 ? recommendations : ['Follow up with healthcare provider'];
};

/**
 * Analyze hereditary patterns from family medical records
 */
const summarizeHereditaryPatterns = async (familyRecords) => {
  try {
    if (!familyRecords || familyRecords.length === 0) {
      return {
        summary: 'No family medical records available for analysis.',
        hereditary_diseases: [],
        risk_factors: [],
        generations_analyzed: 0
      };
    }

    // Intelligent pattern detection
    const diseases = new Map();
    const riskFactors = new Set();
    
    const commonDiseases = {
      'diabetes': { type: 'metabolic', risk: 'high' },
      'hypertension': { type: 'cardiovascular', risk: 'high' },
      'heart disease': { type: 'cardiovascular', risk: 'critical' },
      'cancer': { type: 'oncological', risk: 'critical' },
      'asthma': { type: 'respiratory', risk: 'medium' },
      'arthritis': { type: 'musculoskeletal', risk: 'medium' },
      'depression': { type: 'mental health', risk: 'medium' },
      'alzheimer': { type: 'neurological', risk: 'high' },
      'osteoporosis': { type: 'musculoskeletal', risk: 'medium' },
      'thyroid': { type: 'endocrine', risk: 'medium' }
    };

    // Analyze each record
    familyRecords.forEach(record => {
      if (record.summary) {
        const text = record.summary.toLowerCase();
        Object.keys(commonDiseases).forEach(disease => {
          if (text.includes(disease)) {
            if (!diseases.has(disease)) {
              diseases.set(disease, { count: 0, risk: commonDiseases[disease].risk });
            }
            diseases.get(disease).count++;
            
            // Add risk factors
            if (commonDiseases[disease].risk === 'high' || commonDiseases[disease].risk === 'critical') {
              riskFactors.add(`${disease} appears in family history`);
            }
          }
        });
      }
    });

    const generations = Math.ceil(familyRecords.length / 3);
    const diseaseList = Array.from(diseases.keys());
    const diseaseCounts = Array.from(diseases.entries()).map(([disease, data]) => 
      `${disease} (${data.count} occurrence${data.count > 1 ? 's' : ''})`
    );

    // Generate summary
    let summary = `Hereditary Pattern Analysis:\n\n`;
    summary += `Analyzed ${familyRecords.length} family medical records across approximately ${generations} generation(s).\n\n`;
    
    if (diseaseList.length > 0) {
      summary += `Identified Patterns:\n${diseaseCounts.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\n`;
      summary += `Risk Assessment: ${diseaseList.length} hereditary pattern(s) identified. `;
      
      const highRiskDiseases = Array.from(diseases.entries())
        .filter(([_, data]) => data.risk === 'high' || data.risk === 'critical')
        .map(([disease, _]) => disease);
      
      if (highRiskDiseases.length > 0) {
        summary += `High-risk patterns: ${highRiskDiseases.join(', ')}. `;
      }
      
      summary += `These patterns should be discussed with healthcare providers for preventive care.\n\n`;
    } else {
      summary += `No clear hereditary patterns identified in available records.\n\n`;
    }

    summary += `⚠️ Note: This analysis is based on available records. Consult with a genetic counselor or healthcare provider for comprehensive hereditary risk assessment.`;

    // If AI_API_KEY is configured, enhance with AI
    if (process.env.AI_API_KEY && process.env.AI_API_KEY !== 'your_ai_api_key_here') {
      try {
        const recordsText = familyRecords.map(r => r.summary || '').join('\n').substring(0, 3000);
        
        // Try Google Gemini first
        if (process.env.AI_API_KEY.startsWith('AIza') || process.env.GEMINI_API_KEY) {
          let { GoogleGenerativeAI } = require('@google/generative-ai');
          const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          
          const prompt = `You are a medical AI assistant specializing in hereditary pattern analysis. Analyze these family medical records and identify patterns, risks, and recommendations.

Family Records:
${recordsText}

Provide a comprehensive analysis of hereditary patterns, risk factors, and recommendations.`;
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          summary = response.text();
        }
        // Try OpenAI
        else if (process.env.AI_API_KEY.startsWith('sk-')) {
          let OpenAI;
          try {
            OpenAI = require('openai');
          } catch (e) {
            throw new Error('OpenAI package not installed. Run: npm install openai');
          }
          const openai = new OpenAI({ apiKey: process.env.AI_API_KEY });
          
          const response = await openai.chat.completions.create({
            model: process.env.AI_MODEL || 'gpt-4',
            messages: [
              {
                role: "system",
                content: "You are a medical AI assistant specializing in hereditary pattern analysis. Analyze family medical history and identify patterns, risks, and recommendations."
              },
              {
                role: "user",
                content: `Analyze these family medical records for hereditary patterns:\n\n${recordsText}`
              }
            ],
            temperature: 0.3,
            max_tokens: 400
          });
          
          summary = response.choices[0].message.content;
        }
      } catch (aiError) {
        console.warn('AI enhancement failed, using pattern analysis:', aiError.message);
        // Use pattern-based summary
      }
    }

    return {
      summary,
      hereditary_diseases: diseaseList,
      risk_factors: Array.from(riskFactors),
      generations_analyzed: generations,
      isAIGenerated: process.env.AI_API_KEY && process.env.AI_API_KEY !== 'your_ai_api_key_here'
    };
  } catch (error) {
    console.error('Hereditary Pattern Analysis Error:', error);
    return {
      summary: 'Unable to analyze hereditary patterns at this time.',
      hereditary_diseases: [],
      risk_factors: [],
      generations_analyzed: 0,
      isAIGenerated: false
    };
  }
};

module.exports = { analyzeReport, summarizeHereditaryPatterns };

