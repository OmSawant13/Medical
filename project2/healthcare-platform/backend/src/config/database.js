const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async() => {
    try {
        // Force local MongoDB - ignore MONGODB_URI if it's set to Atlas
        let mongoUri = process.env.MONGODB_URI;

        // If MONGODB_URI is set but points to Atlas, use local instead
        if (mongoUri && (mongoUri.includes('mongodb.net') || mongoUri.includes('atlas'))) {
            console.log('⚠️  MONGODB_URI points to Atlas, using local MongoDB instead');
            mongoUri = null;
        }

        // Use local MongoDB
        mongoUri = mongoUri || 'mongodb://localhost:27017/healthcare-platform';

        console.log('🔗 Connecting to MongoDB...');
        console.log('📍 Using: Local MongoDB (mongodb://localhost:27017)');

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000, // 5 seconds for local
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

        // Test the connection
        const dbStatus = mongoose.connection.readyState;
        console.log(`🔗 Connection Status: ${dbStatus === 1 ? 'Connected' : 'Disconnected'}`);

        return conn;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
            console.error('💡 Make sure MongoDB is running locally:');
            console.error('   macOS: brew services start mongodb-community');
            console.error('   Or: mongod --dbpath /path/to/data');
            console.error('   Or: docker run -d -p 27017:27017 mongo');
        }
        // Don't throw - let server start without DB for now
        console.warn('⚠️  Server will continue without database connection');
        return null;
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🟡 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async() => {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed through app termination');
    process.exit(0);
});

module.exports = connectDB;