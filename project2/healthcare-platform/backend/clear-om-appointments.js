const mongoose = require('mongoose');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
require('dotenv').config();

// Connect to MongoDB - use local MongoDB
let mongoUri = process.env.MONGODB_URI;

// If MONGODB_URI points to Atlas, use local instead
if (mongoUri && (mongoUri.includes('mongodb.net') || mongoUri.includes('atlas'))) {
    console.log('⚠️  MONGODB_URI points to Atlas, using local MongoDB instead');
    mongoUri = 'mongodb://localhost:27017/healthcare-platform';
}

// Use local MongoDB
mongoUri = mongoUri || 'mongodb://localhost:27017/healthcare-platform';

mongoose.connect(mongoUri).then(async () => {
    console.log('✅ Connected to MongoDB');
    
    try {
        // Find Om Sawant user
        const user = await User.findOne({ 
            $or: [
                { name: /Om.*Sawant/i },
                { name: /Sawant/i },
                { email: /om.*sawant/i }
            ]
        });
        
        if (!user) {
            console.log('❌ User "Om Sawant" not found');
            console.log('Available users:');
            const allUsers = await User.find({}, 'name email');
            allUsers.forEach(u => console.log(`  - ${u.name} (${u.email})`));
            await mongoose.disconnect();
            process.exit(1);
        }
        
        console.log(`✅ Found user: ${user.name} (${user.email})`);
        
        // Find patient profile
        const patient = await Patient.findOne({ userId: user._id });
        
        if (!patient) {
            console.log('❌ Patient profile not found for this user');
            await mongoose.disconnect();
            process.exit(1);
        }
        
        console.log(`✅ Found patient: ${patient.patientId}`);
        
        // Count appointments
        const count = await Appointment.countDocuments({ patientId: patient.patientId });
        console.log(`📊 Total appointments found: ${count}`);
        
        if (count === 0) {
            console.log('✅ No appointments to delete');
            await mongoose.disconnect();
            process.exit(0);
        }
        
        // Delete all appointments
        const result = await Appointment.deleteMany({ patientId: patient.patientId });
        
        console.log(`✅ Successfully deleted ${result.deletedCount} appointment(s)`);
        
        // Verify deletion
        const remaining = await Appointment.countDocuments({ patientId: patient.patientId });
        console.log(`✅ Remaining appointments: ${remaining}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Database connection closed');
        process.exit(0);
    }
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

