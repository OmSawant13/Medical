const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./src/config/database');
const User = require('./models/User');

async function listAllUsers() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to database\n');

        console.log('🔍 Fetching all users...\n');
        const allUsers = await User.find({}, 'name email role isActive');

        if (allUsers.length === 0) {
            console.log('❌ No users found in the database.');
        } else {
            console.log(`📋 Found ${allUsers.length} user(s):\n`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            allUsers.forEach((user, index) => {
                console.log(`${index + 1}. 👤 Name: ${user.name}`);
                console.log(`   📧 Email: ${user.email}`);
                console.log(`   🔑 Role: ${user.role}`);
                console.log(`   ✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
                console.log('');
            });
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\n📧 All Emails:');
            allUsers.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.email}`);
            });
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error listing users:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

listAllUsers();

