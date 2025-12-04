import dotenv from 'dotenv';
import { MedicalImageAI } from './services/medicalImageAI';
import * as path from 'path';

dotenv.config();

async function testCLI() {
  console.log('🧪 Medical Image AI - CLI Test\n');

  const API_KEY = process.env.GOOGLE_AI_API_KEY;

  if (!API_KEY) {
    console.error('❌ ERROR: GOOGLE_AI_API_KEY not found in .env file');
    console.log('\n📝 Steps to fix:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Add your Google AI Studio API key');
    console.log('3. Get your key from: https://makersuite.google.com/app/apikey\n');
    process.exit(1);
  }

  const imagePath = process.argv[2];

  if (!imagePath) {
    console.log('❌ ERROR: No image path provided\n');
    console.log('Usage: npm run test <path-to-image>\n');
    console.log('Example: npm run test ./test-xray.jpg\n');
    process.exit(1);
  }

  const fullPath = path.resolve(imagePath);
  console.log(`📁 Image: ${fullPath}`);
  console.log(`🔍 Analyzing image with pixel-level precision...\n`);

  const medicalAI = new MedicalImageAI(API_KEY);

  try {
    const result = await medicalAI.analyzeImage(fullPath, 'xray', 'patient');

    if (result.success) {
      console.log('✅ Analysis Complete!\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📋 FINDINGS:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(result.analysis.findings);
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('🔬 DETAILED ANALYSIS:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(result.analysis.detailedAnalysis);
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('💡 RECOMMENDATIONS:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(result.analysis.recommendations);
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('⚠️  URGENCY LEVEL:', result.analysis.urgencyLevel.toUpperCase());
      console.log('📊 CONFIDENCE:', result.analysis.confidence);
      console.log('⏱️  Processing Time:', result.metadata.processingTime, 'ms');
      console.log('═══════════════════════════════════════════════════════════\n');
    } else {
      console.error('❌ Analysis failed:', result.error);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testCLI();
