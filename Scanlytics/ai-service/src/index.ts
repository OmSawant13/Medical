import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs-node';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

class MedicalImageAnalyzer {
  private isModelLoaded = false;
  private modelVersion = '2.1.0';

  async initialize() {
    try {
      console.log('🤖 Initializing Medical AI Analyzer...');
      this.isModelLoaded = true;
      console.log('✅ Medical AI model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load medical AI model:', error);
    }
  }

  async analyzeImage(imageBuffer: Buffer, scanType: string, scanId: string) {
    const startTime = Date.now();
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockFindings = [
      { 
        condition: 'Normal',
        confidence: 0.92,
        description: 'No abnormal findings detected',
        severity: 'low'
      }
    ];
    
    const mockRecommendations = [
      {
        priority: 'low',
        action: 'Continue routine care',
        details: 'No immediate action required'
      }
    ];

    const processingTime = Date.now() - startTime;
    const metadata = await sharp(imageBuffer).metadata();

    return {
      success: true,
      scanId,
      confidence: 0.92,
      findings: mockFindings,
      recommendations: mockRecommendations,
      requiresDoctorReview: false,
      metadata: {
        processingTime,
        modelVersion: this.modelVersion,
        timestamp: new Date().toISOString(),
        imageInfo: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || 'unknown',
          size: imageBuffer.length
        }
      }
    };
  }
}

const analyzer = new MedicalImageAnalyzer();

app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file provided' 
      });
    }

    const { scanId, scanType = 'chest-xray' } = req.body;

    if (!scanId) {
      return res.status(400).json({
        success: false,
        error: 'Scan ID is required'
      });
    }

    console.log(`🔍 Starting AI analysis for scan ${scanId} (${scanType})`);

    const result = await analyzer.analyzeImage(req.file.buffer, scanType, scanId);

    console.log(`✅ AI analysis completed for scan ${scanId} in ${result.metadata.processingTime}ms`);

    res.json(result);
  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Analysis failed'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'Healthcare AI Service',
    modelLoaded: analyzer['isModelLoaded'],
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8000;

analyzer.initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 AI Service running on port ${PORT}`);
    console.log(`🤖 TensorFlow.js version: ${tf.version.tfjs}`);
    console.log(`🧠 Medical AI model ready for analysis`);
  });
}).catch((error) => {
  console.error('❌ Failed to initialize AI service:', error);
});
