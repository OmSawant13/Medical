const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB Atlas connection...');
    console.log('Connection string:', process.env.MONGODB_URI);
    
    // Set connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds
      connectTimeoutMS: 10000, // 10 seconds
    };

    console.log('⏳ Attempting to connect...');
    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Database info:');
    console.log('- Host:', mongoose.connection.host);
    console.log('- Port:', mongoose.connection.port);
    console.log('- Database:', mongoose.connection.name);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔧 Troubleshooting tips:');
    console.error('1. Check if your MongoDB Atlas cluster is running');
    console.error('2. Verify your IP address is whitelisted');
    console.error('3. Check your username and password');
    console.error('4. Ensure the database name is correct');
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

testConnection();
