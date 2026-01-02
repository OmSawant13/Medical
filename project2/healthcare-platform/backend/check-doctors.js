const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB - use local MongoDB
let mongoUri = process.env.MONGODB_URI;

// If MONGODB_URI points to Atlas, use local instead
if (mongoUri && (mongoUri.includes('mongodb.net') || mongoUri.includes('atlas'))) {
    mongoUri = 'mongodb://localhost:27017/healthcare-platform';
}

// Use local MongoDB
mongoUri = mongoUri || 'mongodb://localhost:27017/healthcare-platform';

mongoose.connect(mongoUri).then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    try {
        const totalDoctors = await Doctor.countDocuments();
        console.log(`📊 Total doctors in database: ${totalDoctors}\n`);
        
        const assignedDoctors = await Doctor.countDocuments({ hospitalAffiliation: { $ne: null } });
        const unassignedDoctors = await Doctor.countDocuments({ hospitalAffiliation: null });
        
        console.log(`✅ Assigned to hospitals: ${assignedDoctors}`);
        console.log(`⚠️  Unassigned doctors: ${unassignedDoctors}\n`);
        
        if (unassignedDoctors > 0) {
            console.log('Unassigned doctors:');
            const unassigned = await Doctor.find({ hospitalAffiliation: null })
                .populate('userId', 'name email')
                .limit(10);
            unassigned.forEach(d => {
                console.log(`  - ${d.userId?.name || 'N/A'} (${d.doctorId})`);
            });
        }
        
        // Show sample assigned doctors
        const assigned = await Doctor.find({ hospitalAffiliation: { $ne: null } })
            .populate('userId', 'name email')
            .limit(5);
        
        if (assigned.length > 0) {
            console.log('\nSample assigned doctors:');
            assigned.forEach(d => {
                console.log(`  - ${d.userId?.name || 'N/A'} (${d.doctorId}) -> Hospital: ${d.hospitalAffiliation}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    }
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

