import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

export interface AnalysisResult {
  success: boolean;
  analysis: {
    findings: string;
    detailedAnalysis: string;
    recommendations: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    confidence: string;
  };
  metadata: {
    imageType: string;
    uploadedBy: string;
    timestamp: string;
    processingTime: number;
  };
  error?: string;
}

export class MedicalImageAI {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async analyzeImage(
    imagePath: string,
    imageType: 'ct-scan' | 'xray',
    uploadedBy: 'patient' | 'hospital-doctor' | 'clinic-doctor'
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString('base64');

      let prompt = '';
      
      if (uploadedBy === 'patient') {
        // Simple, patient-friendly summary
        prompt = `You are a medical AI assistant helping patients understand their ${imageType === 'ct-scan' ? 'CT scan' : 'X-ray'}.

Analyze this image and provide a SIMPLE, EASY-TO-UNDERSTAND summary for a patient with NO medical background.

CRITICAL INSTRUCTIONS:
1. Use simple, everyday language (avoid complex medical terms)
2. Be clear and direct
3. Keep it brief and focused on what matters
4. If you must use medical terms, explain them simply
5. Be reassuring but honest

Provide your analysis in this format:

FINDINGS:
[In 2-3 simple sentences, explain what you see. Use everyday language like "broken bone" instead of "fracture"]

DETAILED ANALYSIS:
[In 3-4 sentences, explain the condition in simple terms. What does this mean for the patient?]

RECOMMENDATIONS:
[In simple language, what should the patient do next? Keep it practical and clear]

URGENCY LEVEL:
[State: LOW, MEDIUM, HIGH, or CRITICAL]

CONFIDENCE:
[Simply state: High, Medium, or Low]

IMPORTANT: This is an AI analysis. Please see a doctor for proper medical advice.`;
      } else {
        // Detailed medical analysis for doctors
        prompt = `You are an expert medical AI assistant specializing in radiology image analysis for healthcare professionals.

Analyze this ${imageType === 'ct-scan' ? 'CT scan' : 'X-ray'} image with medical precision.

CRITICAL INSTRUCTIONS:
1. Examine the image systematically for abnormalities, fractures, lesions, masses, or pathologies
2. Use proper medical terminology
3. Identify specific anatomical locations
4. Assess severity and clinical significance
5. Provide actionable clinical recommendations

Provide your analysis in this structured format:

FINDINGS:
[List key findings with anatomical locations and medical terminology. Be specific but concise - 3-5 key points]

DETAILED ANALYSIS:
[Provide clinical analysis of the findings, including severity, displacement patterns, complications, and clinical significance. Keep it focused and relevant - 4-6 sentences]

RECOMMENDATIONS:
[Suggest specific clinical actions: imaging studies, specialist referrals, treatment approaches, or monitoring. Be practical and actionable]

URGENCY LEVEL:
[State: LOW, MEDIUM, HIGH, or CRITICAL based on clinical severity]

CONFIDENCE:
[State: High, Medium, or Low with brief reasoning]

DISCLAIMER: AI-generated analysis for clinical review. Correlate with patient history and physical examination.`;
      }

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: this.getMimeType(imagePath),
            data: base64Image,
          },
        },
        { text: prompt },
      ]);

      const response = await result.response;
      const analysisText = response.text();

      const parsedAnalysis = this.parseAnalysis(analysisText);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        analysis: parsedAnalysis,
        metadata: {
          imageType,
          uploadedBy,
          timestamp: new Date().toISOString(),
          processingTime,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        analysis: {
          findings: '',
          detailedAnalysis: '',
          recommendations: '',
          urgencyLevel: 'low',
          confidence: '',
        },
        metadata: {
          imageType,
          uploadedBy,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
        error: error.message,
      };
    }
  }

  private parseAnalysis(text: string) {
    const findings = this.extractSection(text, 'FINDINGS');
    const detailedAnalysis = this.extractSection(text, 'DETAILED ANALYSIS');
    const recommendations = this.extractSection(text, 'RECOMMENDATIONS');
    const urgencyText = this.extractSection(text, 'URGENCY LEVEL').toLowerCase();
    const confidence = this.extractSection(text, 'CONFIDENCE');

    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (urgencyText.includes('critical')) urgencyLevel = 'critical';
    else if (urgencyText.includes('high')) urgencyLevel = 'high';
    else if (urgencyText.includes('medium')) urgencyLevel = 'medium';

    return {
      findings,
      detailedAnalysis,
      recommendations,
      urgencyLevel,
      confidence,
    };
  }

  private extractSection(text: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}:?\\s*([\\s\\S]*?)(?=\\n\\n[A-Z]+:|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return mimeTypes[ext || 'jpeg'] || 'image/jpeg';
  }
}
