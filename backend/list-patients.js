const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./src/config/database');
const User = require('./models/User');
const Patient = require('./models/Patient');

async function listPatients() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to database\n');

        // Find all patient users
        const patientUsers = await User.find({ role: 'patient' }).sort({ name: 1 });
        
        if (patientUsers.length === 0) {
            console.log('❌ No patients found in database');
            await mongoose.connection.close();
            process.exit(0);
        }

        console.log(`📋 Found ${patientUsers.length} patient(s):\n`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        for (const user of patientUsers) {
            const patient = await Patient.findOne({ userId: user._id });
            console.log(`👤 Name: ${user.name}`);
            console.log(`📧 Email: ${user.email}`);
            if (patient) {
                console.log(`🆔 Patient ID: ${patient.patientId}`);
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

listPatients();

