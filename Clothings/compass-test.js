const mongoose = require('mongoose');
require('dotenv').config();

async function testWithCompass() {
    console.log('🔍 Testing MongoDB connection (Compass-style)...');

    try {
        // Try different connection options that work well with Compass
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 30000,
            maxPoolSize: 10,
            serverSelectionRetryDelayMS: 5000,
        };

        console.log('⏳ Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI, options);

        console.log('✅ SUCCESS! Connected to MongoDB Atlas!');
        console.log('📊 Connection Info:');
        console.log('- Host:', mongoose.connection.host);
        console.log('- Port:', mongoose.connection.port);
        console.log('- Database:', mongoose.connection.name);
        console.log('- Ready State:', mongoose.connection.readyState);

        // Test database operations
        const db = mongoose.connection.db;

        // List databases
        const adminDb = db.admin();
        const dbs = await adminDb.listDatabases();
        console.log('📁 Available databases:', dbs.databases.map(db => db.name));

        // List collections in current database
        const collections = await db.listCollections().toArray();
        console.log('📄 Collections in 8eenstore:', collections.map(c => c.name));

        // Test a simple operation
        const result = await db.admin().ping();
        console.log('🏓 Ping successful:', result);

        console.log('\n🎉 Your MongoDB Atlas connection is working perfectly!');
        console.log('🚀 You can now run: node seed-products.js');

    } catch (error) {
        console.error('❌ Connection failed:', error.message);

        console.log('\n🔧 If this fails, try these steps:');
        console.log('1. Open MongoDB Compass');
        console.log('2. Connect using: mongodb+srv://8eenstore_db_user:qFm0e3zWpF03a6Vt@8een.csgumuq.mongodb.net/8eenstore');
        console.log('3. If Compass connects, the issue is with Node.js configuration');
        console.log('4. If Compass fails, you need to whitelist your IP in MongoDB Atlas');

        console.log('\n📋 MongoDB Atlas Setup Checklist:');
        console.log('✅ Cluster created');
        console.log('✅ Database user created');
        console.log('❓ IP address whitelisted (Network Access)');
        console.log('❓ Cluster is running (not paused)');

    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

