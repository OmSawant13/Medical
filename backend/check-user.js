const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./src/config/database');
const User = require('./models/User');
const Patient = require('./models/Patient');
const bcrypt = require('bcryptjs');

async function checkUser() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to database\n');

        // Find user
        const searchTerm = 'omsawant';
        console.log(`🔍 Searching for user: "${searchTerm}"...\n`);
        
        const user = await User.findOne({ 
            $or: [
                { email: { $regex: new RegExp(searchTerm, 'i') } },
                { name: { $regex: new RegExp(searchTerm, 'i') } }
            ]
        });

        if (!user) {
            console.log(`❌ User not found: "${searchTerm}"`);
            console.log('\n📋 All users in database:');
            const allUsers = await User.find({}, 'name email role isActive').sort({ name: 1 });
            if (allUsers.length === 0) {
                console.log('  (No users found in database)');
            } else {
                allUsers.forEach(u => {
                    console.log(`  - ${u.name} (${u.email}) - ${u.role} - Active: ${u.isActive}`);
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
        console.log('✅ Active:', user.isActive);
        console.log('👤 User ID:', user._id.toString());
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Find patient
        const patient = await Patient.findOne({ userId: user._id });
        if (patient) {
            console.log('🆔 Patient ID:', patient.patientId);
        }

        // Test password
        console.log('\n🔐 Testing password...');
        const testPasswords = ['omsawant123', 'password', 'omsawant', '123456'];
        let passwordFound = false;
        
        for (const testPwd of testPasswords) {
            const isValid = await user.comparePassword(testPwd);
            if (isValid) {
                console.log(`✅ Password match found: "${testPwd}"`);
                passwordFound = true;
                break;
            }
        }
        
        if (!passwordFound) {
            console.log('❌ None of the test passwords matched');
            console.log('💡 You need to reset the password');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Login Credentials:');
        console.log(`   Email: ${user.email}`);
        if (passwordFound) {
            console.log(`   Password: (matched one of test passwords)`);
        } else {
            console.log(`   Password: (unknown - need to reset)`);
        }
        console.log(`   Role: ${user.role}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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

checkUser();

