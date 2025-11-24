// Quick test script to show AI functionality
const { analyzeReport, summarizeHereditaryPatterns } = require('./utils/aiService');

async function testAI() {
  console.log('🧪 Testing AI Analysis...\n');
  
  // Test 1: Medical Report Analysis
  console.log('📋 Test 1: Medical Report Analysis');
  console.log('Input: "Patient has diabetes and hypertension. Prescribed Metformin 500mg twice daily and Lisinopril 10mg once daily."\n');
  
  const result1 = await analyzeReport('Patient has diabetes and hypertension. Prescribed Metformin 500mg twice daily and Lisinopril 10mg once daily.');
  console.log('Output:');
  console.log(JSON.stringify(result1, null, 2));
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: Complex Report
  console.log('📋 Test 2: Complex Medical Report');
  console.log('Input: "Lab results show elevated blood sugar levels indicating type 2 diabetes. Patient also has high blood pressure. Infection detected in wound. Prescribed antibiotic Amoxicillin 500mg three times daily."\n');
  
  const result2 = await analyzeReport('Lab results show elevated blood sugar levels indicating type 2 diabetes. Patient also has high blood pressure. Infection detected in wound. Prescribed antibiotic Amoxicillin 500mg three times daily.');
  console.log('Output:');
  console.log(JSON.stringify(result2, null, 2));
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 3: Hereditary Patterns
  console.log('📋 Test 3: Hereditary Pattern Analysis');
  const familyRecords = [
    { summary: 'Grandfather had diabetes and heart disease' },
    { summary: 'Father has hypertension and diabetes' },
    { summary: 'Uncle had cancer' }
  ];
  console.log('Input:', JSON.stringify(familyRecords, null, 2), '\n');
  
  const result3 = await summarizeHereditaryPatterns(familyRecords);
  console.log('Output:');
  console.log(JSON.stringify(result3, null, 2));
  
  console.log('\n✅ AI Analysis Test Complete!');
  console.log('\n📝 Summary:');
  console.log(`- Pattern Analysis: ${result1.isAIGenerated ? '❌ Using Real AI' : '✅ Working (Pattern Matching)'}`);
  console.log(`- Confidence: ${result1.confidence * 100}%`);
  console.log(`- Findings Detected: ${result1.keyFindings.length}`);
  console.log(`- Recommendations: ${result1.recommendations.length}`);
}

testAI().catch(console.error);

