// Quick script to check MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

const checkConnection = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.log('❌ MONGODB_URI not found in .env file');
      console.log('📝 Add this to backend/.env:');
      console.log('   MONGODB_URI=your_mongodb_connection_string');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🔗 Host:', mongoose.connection.host);
    
    // Test a simple query
    const User = require('./models/User');
    const count = await User.countDocuments();
    console.log('👤 Users in database:', count);

    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('💡 Check your MONGODB_URI in .env file');
    process.exit(1);
  }
};

checkConnection();

