// Quick API test script
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Set default timeout for all requests
axios.defaults.timeout = 5000;

async function testAPI() {
  console.log('🧪 Testing Scanlytics Healthcare API v2.0\n');

  try {
    // Test 1: Health check
    console.log('1️⃣  Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/health`, { timeout: 3000 });
    console.log('   ✅ Health:', health.data.status);

    // Test 2: Hospital Metrics (MongoDB Aggregation)
    console.log('\n2️⃣  Testing Hospital Metrics (Aggregation)...');
    const metrics = await axios.get(`${BASE_URL}/analytics/hospital-metrics`, { timeout: 3000 });
    console.log('   ✅ Total Patients:', metrics.data.metrics.totalPatients);
    console.log('   ✅ Total Appointments:', metrics.data.metrics.appointments.total);

    // Test 3: Medical Code Search (Binary Search)
    console.log('\n3️⃣  Testing Medical Code Search (Binary Search)...');
    const code = await axios.get(`${BASE_URL}/search/medical-codes/E11`, { timeout: 3000 });
    console.log('   ✅ Found:', code.data.code.description);
    console.log('   📊 Comparisons:', code.data.comparisons);
    console.log('   ⚡ Complexity:', code.data.complexity);

    // Test 4: Drug Lookup (Hash Map)
    console.log('\n4️⃣  Testing Drug Lookup (Hash Map O(1))...');
    const drug = await axios.get(`${BASE_URL}/search/drugs/aspirin`, { timeout: 3000 });
    console.log('   ✅ Drug:', drug.data.drug.name);
    console.log('   ⚡ Complexity:', drug.data.complexity);
    console.log('   🕐 Search Time:', drug.data.searchTime);

    // Test 5: ER Triage Queue (Priority Queue)
    console.log('\n5️⃣  Testing ER Triage (Priority Queue)...');
    
    // Add critical patient
    const critical = await axios.post(`${BASE_URL}/triage/er/add-patient`, {
      patientId: 'P001',
      patientName: 'John Critical',
      condition: 'Heart attack',
      severity: 'critical',
      vitalSigns: { systolic: 190, diastolic: 120, heartRate: 150 }
    }, { timeout: 3000 });
    console.log('   ✅ Added critical patient, Queue position:', critical.data.queuePosition);

    // Add low priority patient
    const low = await axios.post(`${BASE_URL}/triage/er/add-patient`, {
      patientId: 'P002',
      patientName: 'Jane Minor',
      condition: 'Minor cut',
      severity: 'low',
      vitalSigns: { systolic: 120, diastolic: 80, heartRate: 75 }
    }, { timeout: 3000 });
    console.log('   ✅ Added low priority patient, Queue position:', low.data.queuePosition);

    // View queue
    const queue = await axios.get(`${BASE_URL}/triage/er/queue`, { timeout: 3000 });
    console.log('   📋 Queue (sorted by priority):');
    queue.data.queue.forEach((p, i) => {
      console.log(`      ${i + 1}. ${p.patientName} - ${p.severity} (Priority: ${p.priority})`);
    });

    // Test 6: OR Scheduling (Dynamic Programming)
    console.log('\n6️⃣  Testing OR Scheduling (Dynamic Programming)...');
    const schedule = await axios.get(`${BASE_URL}/scheduling/sample-or-schedule`, { timeout: 3000 });
    console.log('   ✅ Max Revenue:', `$${schedule.data.optimization.maxRevenue}`);
    console.log('   📊 Surgeries Selected:', schedule.data.optimization.totalSurgeries);
    console.log('   ⏱️  Utilization Rate:', schedule.data.optimization.utilizationRate + '%');
    console.log('   🧮 Algorithm:', schedule.data.algorithm);

    // Test 7: AI Metrics
    console.log('\n7️⃣  Testing AI Metrics...');
    const aiMetrics = await axios.get(`${BASE_URL}/ai/metrics`, { timeout: 3000 });
    console.log('   ✅ Total Scans:', aiMetrics.data.metrics.totalScans);
    console.log('   ✅ AI Accuracy:', aiMetrics.data.metrics.aiAccuracy);

    console.log('\n✅ All tests passed! API is working correctly.\n');
    process.exit(0);

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Error: Server not running!');
      console.error('   Please start the server with: npm start\n');
    } else if (error.code === 'ECONNABORTED') {
      console.error('\n❌ Test timeout! Server is too slow or not responding.\n');
    } else {
      console.error('\n❌ Test failed:', error.message);
      if (error.response) {
        console.error('   Response:', error.response.data);
      }
    }
    process.exit(1);
  }
}

// Run tests
testAPI();
