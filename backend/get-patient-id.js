const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./src/config/database');
const User = require('./models/User');
const Patient = require('./models/Patient');

async function getPatientId() {
    try {
        // Connect to database
        console.log('🔗 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to database\n');

        // Find user by email or name (case insensitive)
        const searchTerm = 'omsawant'; // Search by email or name
        console.log(`🔍 Searching for user: "${searchTerm}"...\n`);
        
        const user = await User.findOne({ 
            $or: [
                { email: { $regex: new RegExp(searchTerm, 'i') } },
                { name: { $regex: new RegExp(searchTerm, 'i') } }
            ]
        });

        if (!user) {
            console.log(`❌ User not found with email/name containing: "${searchTerm}"`);
            console.log('\n📋 All users in database:');
            const allUsers = await User.find({}, 'name email role').sort({ name: 1 });
            if (allUsers.length === 0) {
                console.log('  (No users found in database)');
            } else {
                allUsers.forEach(u => {
                    console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
                });
            }
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log('✅ User Found!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 Name:', user.name);
        console.log('📧 Email:', user.email);
        console.log('🔑 Role:', user.role);
        console.log('👤 User ID:', user._id.toString());

        // Find patient for this user
        const patient = await Patient.findOne({ userId: user._id });
        
        if (patient) {
            console.log('🆔 Patient ID:', patient.patientId);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\n📋 Summary:');
            console.log(`   Patient ID: ${patient.patientId}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log('\n💡 You can use this Patient ID in your requests!');
        } else {
            console.log('❌ Patient record not found for this user');
            console.log('   User might not be registered as a patient');
            console.log('   Role:', user.role);
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

getPatientId();
