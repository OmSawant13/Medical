const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./src/config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    try {
        // Connect to database
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
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log('✅ User Found!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 Name:', user.name);
        console.log('📧 Email:', user.email);
        console.log('🔑 Role:', user.role);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Set new password
        // You can change this password to whatever you want
        const newPassword = 'omsawant123'; // Change this to your desired password
        console.log('🔐 Setting new password to:', newPassword);
        console.log('🔐 Password length:', newPassword.length);
        
        // Hash the password directly (bypass pre-save hook to avoid double hashing)
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        console.log('🔐 Hashed password length:', hashedPassword.length);
        
        // Update password directly in database (bypass mongoose pre-save hook)
        await User.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword } }
        );
        
        // Verify the password was saved correctly
        const updatedUser = await User.findById(user._id);
        const verifyResult = await updatedUser.comparePassword(newPassword);
        console.log('🔐 Password verification after reset:', verifyResult ? '✅ SUCCESS' : '❌ FAILED');

        console.log('✅ Password reset successful!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', user.email);
        console.log('🔑 New Password:', newPassword);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n💡 You can now login with:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${newPassword}`);
        console.log('\n⚠️  Please change this password after first login!');

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

resetPassword();

