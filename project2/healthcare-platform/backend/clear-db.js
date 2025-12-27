const mongoose = require('mongoose');
require('dotenv').config();

const clearDatabase = async () => {
  try {
    // Use local MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform';
    
    // If MONGODB_URI points to Atlas, use local instead
    let finalUri = mongoUri;
    if (mongoUri && (mongoUri.includes('mongodb.net') || mongoUri.includes('atlas'))) {
      finalUri = 'mongodb://localhost:27017/healthcare-platform';
    }

    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 URI:', finalUri.includes('localhost') ? 'Local MongoDB' : 'MongoDB Atlas');
    
    await mongoose.connect(finalUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Connected to MongoDB');

    // Get database name
    const dbName = mongoose.connection.name;
    console.log(`📊 Database: ${dbName}`);

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📋 Found ${collections.length} collection(s):`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    if (collections.length === 0) {
      console.log('\n✅ Database is already empty!');
      await mongoose.connection.close();
      return;
    }

    // Delete all collections
    console.log('\n🗑️  Deleting all collections...');
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
      console.log(`   ✅ Cleared: ${collection.name}`);
    }

    // Drop all collections
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection.name).drop();
        console.log(`   🗑️  Dropped: ${collection.name}`);
      } catch (error) {
        // Collection might already be dropped
        if (error.code !== 26) {
          console.log(`   ⚠️  Could not drop ${collection.name}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Database cleared successfully!');
    console.log(`📊 Database "${dbName}" is now empty.`);

    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Make sure MongoDB is running:');
      console.error('   macOS: brew services start mongodb-community');
      console.error('   Or: mongod --dbpath /path/to/data');
    }
    process.exit(1);
  }
};

// Run the script
clearDatabase();

