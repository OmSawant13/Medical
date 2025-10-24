const mongoose = require('mongoose');
require('dotenv').config();

async function simpleTest() {
    console.log('🔍 Simple MongoDB Atlas Test');
    console.log('📋 Connection String:', process.env.MONGODB_URI);

    try {
        // Simple connection without complex options
        console.log('⏳ Connecting...');
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('✅ SUCCESS! Connected to MongoDB Atlas!');
        console.log('🎉 Your 8een.store database is ready!');

        // Test basic operations
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('📄 Collections:', collections.map(c => c.name));

        console.log('\n🚀 Next steps:');
        console.log('1. Run: node seed-products.js');
        console.log('2. Start server: npm start');
        console.log('3. Test API: curl http://localhost:3000/api/health');

    } catch (error) {
        console.error('❌ Connection failed:', error.message);

        console.log('\n🔧 Quick Fix Steps:');
        console.log('1. Go to MongoDB Atlas Dashboard');
        console.log('2. Click "Network Access" in left sidebar');
        console.log('3. Click "Add IP Address"');
        console.log('4. Click "Add Current IP Address"');
        console.log('5. Click "Confirm"');
        console.log('6. Try again: node simple-test.js');

        console.log('\n📱 Alternative: Use MongoDB Compass');
        console.log('1. Download MongoDB Compass');
        console.log('2. Connect with: mongodb+srv://8eenstore_db_user:qFm0e3zWpF03a6Vt@8een.csgumuq.mongodb.net/8eenstore');
        console.log('3. If Compass works, your connection is fine');

    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected');
    }
}

