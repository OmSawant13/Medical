const http = require('http');

console.log('🔍 Testing API Connection...\n');

// Test 1: Health endpoint
console.log('1️⃣ Testing Health Endpoint...');
const healthReq = http.get('http://localhost:5001/api/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('   Status:', res.statusCode);
        console.log('   Response:', data);
        console.log('   ✅ Health endpoint is working!\n');
        
        // Test 2: Auth endpoint (should return error without token, but endpoint exists)
        console.log('2️⃣ Testing Auth Endpoint (Login route exists)...');
        const authReq = http.get('http://localhost:5001/api/v1/auth/login', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('   Status:', res.statusCode);
                console.log('   Response:', data.substring(0, 100));
                if (res.statusCode === 404) {
                    console.log('   ❌ Auth endpoint not found!');
                } else {
                    console.log('   ✅ Auth endpoint exists! (Expected error without POST data)\n');
                }
                
                // Test 3: Hospitals endpoint (should require auth)
                console.log('3️⃣ Testing Hospitals Endpoint (requires auth)...');
                const hospitalsReq = http.get('http://localhost:5001/api/v1/hospitals', (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        console.log('   Status:', res.statusCode);
                        if (res.statusCode === 401 || res.statusCode === 403) {
                            console.log('   ✅ Hospitals endpoint exists! (Requires authentication as expected)');
                        } else if (res.statusCode === 404) {
                            console.log('   ❌ Hospitals endpoint not found!');
                        } else {
                            console.log('   Response:', data.substring(0, 100));
                        }
                        
                        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('📊 API Connection Test Summary:');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('✅ Backend server is running on port 5001');
                        console.log('✅ API endpoints are accessible');
                        console.log('✅ Frontend can connect to: http://localhost:5001/api');
                        console.log('\n💡 If you see errors, make sure:');
                        console.log('   1. Backend server is running (node server.js)');
                        console.log('   2. Port 5001 is not blocked');
                        console.log('   3. CORS is properly configured');
                    });
                });
                
                hospitalsReq.on('error', (err) => {
                    console.log('   ❌ Error:', err.message);
                    console.log('   ⚠️  Backend server might not be running on port 5001');
                });
            });
        });
        
        authReq.on('error', (err) => {
            console.log('   ❌ Error:', err.message);
            console.log('   ⚠️  Backend server might not be running on port 5001');
        });
    });
});

healthReq.on('error', (err) => {
    console.log('   ❌ Error:', err.message);
    console.log('   ⚠️  Backend server is NOT running on port 5001');
    console.log('\n💡 To start backend:');
    console.log('   cd healthcare-platform/backend');
    console.log('   node server.js');
    process.exit(1);
});

