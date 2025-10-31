const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    phone: '9876543210',
    dateOfBirth: '1995-01-01',
    gender: 'male',
    location: {
        latitude: 19.0760,
        longitude: 72.8777,
        address: 'Mumbai, Maharashtra, India',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India'
    },
    interests: ['travel', 'music', 'movies'],
    photos: ['https://example.com/photo1.jpg'],
    bio: 'Test user bio'
};

let authToken = '';

// Helper function to make API calls
const apiCall = async(method, endpoint, data = null, headers = {}) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response ? error.response.data : error.message,
            status: error.response ? error.response.status : 500
        };
    }
};

// Test functions
const testHealthCheck = async() => {
    console.log('🏥 Testing health check...');
    const result = await apiCall('GET', '/health');

    if (result.success) {
        console.log('✅ Health check passed');
        console.log('Response:', result.data);
    } else {
        console.log('❌ Health check failed');
        console.log('Error:', result.error);
    }
    console.log('---');
};

const testUserRegistration = async() => {
    console.log('👤 Testing user registration...');
    const result = await apiCall('POST', '/auth/register', TEST_USER);

    if (result.success) {
        console.log('✅ User registration successful');
        authToken = result.data.data.token;
        console.log('Auth token received');
    } else {
        console.log('❌ User registration failed');
        console.log('Error:', result.error);
    }
    console.log('---');
};

const testUserLogin = async() => {
    console.log('🔐 Testing user login...');
    const result = await apiCall('POST', '/auth/login', {
        email: TEST_USER.email,
        password: TEST_USER.password
    });

    if (result.success) {
        console.log('✅ User login successful');
        authToken = result.data.data.token;
        console.log('Auth token received');
    } else {
        console.log('❌ User login failed');
        console.log('Error:', result.error);
    }
    console.log('---');
};

const testGetProfile = async() => {
    console.log('📋 Testing get profile...');
    const result = await apiCall('GET', '/profile', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (result.success) {
        console.log('✅ Get profile successful');
        console.log('Profile data:', result.data.data);
    } else {
        console.log('❌ Get profile failed');
        console.log('Error:', result.error);
    }
    console.log('---');
};

const testUpdateProfile = async() => {
    console.log('✏️ Testing update profile...');
    const result = await apiCall('PUT', '/profile', {
        bio: 'Updated bio for testing',
        height: 175,
        education: 'Bachelor\'s Degree',
        occupation: 'Software Engineer'
    }, {
        'Authorization': `Bearer ${authToken}`
    });

    if (result.success) {
        console.log('✅ Update profile successful');
    } else {
        console.log('❌ Update profile failed');
        console.log('Error:', result.error);
    }
    console.log('---');
};

const testSearchProfiles = async() => {
    console.log('🔍 Testing search profiles...');
    const result = await apiCall('GET', '/profile/search?limit=5', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (result.success) {
        console.log('✅ Search profiles successful');
        console.log('Found profiles:', result.data.data.profiles.length);
    } else {
        console.log('❌ Search profiles failed');
        console.log('Error:', result.error);
    }
    console.log('---');
};

const testGetMatchSuggestions = async() => {
    console.log('💕 Testing get match suggestions...');
    const result = await apiCall('GET', '/matching/suggestions?limit=5', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (result.success) {
        console.log('✅ Get match suggestions successful');
        console.log('Suggestions:', result.data.data.length);
    } else {
        console.log('❌ Get match suggestions failed');
        console.log('Error:', result.error);
    }
    console.log('---');
};

const testGetPremiumPlans = async() => {
    console.log('💎 Testing get premium plans...');
    const result = await apiCall('GET', '/premium/plans');

    if (result.success) {
        console.log('✅ Get premium plans successful');
        console.log('Available plans:', result.data.data.length);
    } else {
        console.log('❌ Get premium plans failed');
        console.log('Error:', result.error);
    }
    console.log('---');
};

const testGetLeaderboard = async() => {
    console.log('🏆 Testing get leaderboard...');
    const result = await apiCall('GET', '/gamification/leaderboard?limit=10');

    if (result.success) {
        console.log('✅ Get leaderboard successful');
        console.log('Leaderboard entries:', result.data.data.leaderboard.length);
    } else {
        console.log('❌ Get leaderboard failed');
        console.log('Error:', result.error);
    }
    console.log('---');
};

const testDailyCheckIn = async() => {
    console.log('📅 Testing daily check-in...');
    const result = await apiCall('POST', '/gamification/check-in', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (result.success) {
        console.log('✅ Daily check-in successful');
        console.log('Points earned:', result.data.data.points);
        console.log('Streak:', result.data.data.streak);
    } else {
        console.log('❌ Daily check-in failed');
        console.log('Error:', result.error);
    }
    console.log('---');
};

const testGetUserPoints = async() => {
    console.log('⭐ Testing get user points...');
    const result = await apiCall('GET', '/gamification/points', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (result.success) {
        console.log('✅ Get user points successful');
        console.log('Points:', result.data.data.points);
        console.log('Level:', result.data.data.level);
    } else {
        console.log('❌ Get user points failed');
        console.log('Error:', result.error);
    }
    console.log('---');
};

// Main test runner
const runTests = async() => {
    console.log('🚀 Starting API Tests for Desi Dating Backend\n');

    try {
        // Basic tests
        await testHealthCheck();

        // Authentication tests
        await testUserRegistration();
        if (!authToken) {
            await testUserLogin();
        }

        if (authToken) {
            // Profile tests
            await testGetProfile();
            await testUpdateProfile();
            await testSearchProfiles();

            // Matching tests
            await testGetMatchSuggestions();

            // Premium tests
            await testGetPremiumPlans();

            // Gamification tests
            await testGetLeaderboard();
            await testDailyCheckIn();
            await testGetUserPoints();
        }

        console.log('🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test runner error:', error);
    }
};

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    runTests,
    apiCall,
    BASE_URL,
    TEST_USER
};