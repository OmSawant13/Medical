const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-ai');

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Create indexes for optimized queries
    await createIndexes();
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const User = require('../models/User');
    const Appointment = require('../models/Appointment');
    const MedicalScan = require('../models/MedicalScan');
    
    // Hash index for O(1) patient lookup
    await User.collection.createIndex({ roleSpecificId: 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    
    // Compound indexes for appointment queries
    await Appointment.collection.createIndex({ doctorId: 1, date: 1, status: 1 });
    await Appointment.collection.createIndex({ patientId: 1, date: -1 });
    
    // Indexes for medical scan queries
    await MedicalScan.collection.createIndex({ patientId: 1, createdAt: -1 });
    await MedicalScan.collection.createIndex({ status: 1, assignedDoctor: 1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.log('⚠️  Index creation warning:', error.message);
  }
};

module.exports = connectDB;
