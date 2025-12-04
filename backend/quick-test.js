// Quick test script - runs in <5 seconds
const axios = require('axios');
const BASE_URL = 'http://localhost:5001/api';

async function quickTest() {
  console.log('\n🧪 QUICK SYSTEM TEST\n');
  
  const tests = [
    { name: 'Health Check', url: `${BASE_URL}/health` },
    { name: 'MongoDB Metrics', url: `${BASE_URL}/analytics/hospital-metrics` },
    { name: 'Patient Search', url: `${BASE_URL}/search/patients/P001` },
    { name: 'Firebase Status', url: `${BASE_URL}/firebase/status` },
    { name: 'AI Metrics', url: `${BASE_URL}/ai/metrics` }
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    try {
      await axios.get(test.url, { timeout: 3000 });
      console.log('✅', test.name);
      passed++;
    } catch (err) {
      console.log('❌', test.name);
    }
  }
  
  console.log(`\n📊 Result: ${passed}/${tests.length} tests passed\n`);
  
  if (passed === tests.length) {
    console.log('🎉 ALL SYSTEMS OPERATIONAL!\n');
  }
}

quickTest().catch(err => console.error('Error:', err.message));
