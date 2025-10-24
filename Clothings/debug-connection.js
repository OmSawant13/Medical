const mongoose = require('mongoose');
require('dotenv').config();

async function debugConnection() {
  console.log('🔍 Debugging MongoDB Atlas connection...');
  console.log('📋 Connection Details:');
  console.log('- URI:', process.env.MONGODB_URI);
  console.log('- Environment:', process.env.NODE_ENV);
  
  // Parse the connection string
  const uri = process.env.MONGODB_URI;
  const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/);
  
  if (match) {
    console.log('📊 Parsed Connection:');
    console.log('- Username:', match[1]);
    console.log('- Password:', match[2].substring(0, 4) + '...');
    console.log('- Host:', match[3]);
    console.log('- Database:', match[4]);
  }

  try {
    console.log('\n⏳ Testing connection with timeout...');
    
    // Set a shorter timeout for testing
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ SUCCESS! Connected to MongoDB Atlas!');
    
    // Test database operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections found:', collections.map(c => c.name));
    
    // Test a simple operation
    const result = await db.admin().ping();
    console.log('🏓 Ping result:', result);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Troubleshooting ECONNREFUSED:');
      console.log('1. Check if your IP is whitelisted in MongoDB Atlas');
      console.log('2. Go to Network Access → Add IP Address → Add Current IP Address');
      console.log('3. Or add 0.0.0.0/0 for development (less secure)');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🔧 Troubleshooting ENOTFOUND:');
      console.log('1. Check if your cluster is running (not paused)');
      console.log('2. Verify the hostname in your connection string');
      console.log('3. Try creating a new cluster if this one has issues');
    } else if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 Troubleshooting Authentication:');
      console.log('1. Double-check your username and password');
      console.log('2. Make sure the user has proper permissions');
      console.log('3. Try creating a new database user');
    }
    
    console.log('\n📞 Next Steps:');
    console.log('1. Go to MongoDB Atlas dashboard');
    console.log('2. Check Network Access settings');
    console.log('3. Verify your cluster is running');
    console.log('4. Try the connection again');
    
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugConnection();
