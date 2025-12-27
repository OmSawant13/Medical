const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./src/config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function testLogin() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to database\n');

        const email = 'omsawant@example.com';
        const testPassword = 'omsawant123';
        
        console.log(`🔍 Testing login for: ${email}`);
        console.log(`🔑 Testing password: ${testPassword}\n`);

        // Find user
        const user = await User.findOne({ 
            email: email.toLowerCase().trim()
        });

        if (!user) {
            console.log('❌ User not found!');
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log('✅ User found!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 Name:', user.name);
        console.log('📧 Email:', user.email);
        console.log('🔑 Role:', user.role);
        console.log('✅ Active:', user.isActive);
        console.log('🔐 Password hash (first 20 chars):', user.password.substring(0, 20) + '...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Test password comparison
        console.log('🔐 Testing password comparison...');
        console.log('   Method 1: Using comparePassword method');
        const method1Result = await user.comparePassword(testPassword);
        console.log(`   Result: ${method1Result ? '✅ MATCH' : '❌ NO MATCH'}\n`);

        console.log('   Method 2: Direct bcrypt.compare');
        const method2Result = await bcrypt.compare(testPassword, user.password);
        console.log(`   Result: ${method2Result ? '✅ MATCH' : '❌ NO MATCH'}\n`);

        // Test with different variations
        console.log('🔍 Testing password variations...');
        const variations = [
            testPassword,
            testPassword.trim(),
            testPassword + ' ',
            ' ' + testPassword,
            testPassword.toLowerCase(),
            testPassword.toUpperCase()
        ];

        for (const variant of variations) {
            const result = await bcrypt.compare(variant, user.password);
            console.log(`   "${variant}" => ${result ? '✅' : '❌'}`);
        }

        // If password doesn't match, reset it properly
        if (!method1Result && !method2Result) {
            console.log('\n❌ Password does NOT match!');
            console.log('🔧 Resetting password...');
            
            // Hash new password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(testPassword, salt);
            
            // Update user password directly (bypass pre-save hook to avoid double hashing)
            await User.updateOne(
                { _id: user._id },
                { $set: { password: hashedPassword } }
            );
            
            console.log('✅ Password reset complete!');
            
            // Verify it works now
            const updatedUser = await User.findById(user._id);
            const verifyResult = await updatedUser.comparePassword(testPassword);
            console.log(`✅ Verification: ${verifyResult ? 'PASSWORD WORKS!' : 'STILL FAILED'}`);
        } else {
            console.log('\n✅ Password matches! Login should work.');
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

testLogin();

