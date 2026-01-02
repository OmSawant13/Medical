const mongoose = require('mongoose');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');
const MedicalScan = require('./models/MedicalScan');
require('dotenv').config();

// Connect to MongoDB - use local MongoDB
let mongoUri = process.env.MONGODB_URI;

if (mongoUri && (mongoUri.includes('mongodb.net') || mongoUri.includes('atlas'))) {
    mongoUri = 'mongodb://localhost:27017/healthcare-platform';
}

mongoUri = mongoUri || 'mongodb://localhost:27017/healthcare-platform';

mongoose.connect(mongoUri).then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
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
        
        console.log(`✅ Found patient: ${patient.patientId}\n`);
        
        // Count and delete appointments
        const appointmentCount = await Appointment.countDocuments({ patientId: patient.patientId });
        console.log(`📊 Appointments found: ${appointmentCount}`);
        if (appointmentCount > 0) {
            const appointmentResult = await Appointment.deleteMany({ patientId: patient.patientId });
            console.log(`✅ Deleted ${appointmentResult.deletedCount} appointment(s)`);
        }
        
        // Count and delete prescriptions
        const prescriptionCount = await Prescription.countDocuments({ patientId: patient.patientId });
        console.log(`📊 Prescriptions found: ${prescriptionCount}`);
        if (prescriptionCount > 0) {
            const prescriptionResult = await Prescription.deleteMany({ patientId: patient.patientId });
            console.log(`✅ Deleted ${prescriptionResult.deletedCount} prescription(s)`);
        }
        
        // Count and delete medical scans
        const scanCount = await MedicalScan.countDocuments({ patientId: patient.patientId });
        console.log(`📊 Medical scans found: ${scanCount}`);
        if (scanCount > 0) {
            const scanResult = await MedicalScan.deleteMany({ patientId: patient.patientId });
            console.log(`✅ Deleted ${scanResult.deletedCount} medical scan(s)`);
        }
        
        // Verify deletion
        const remainingAppointments = await Appointment.countDocuments({ patientId: patient.patientId });
        const remainingPrescriptions = await Prescription.countDocuments({ patientId: patient.patientId });
        const remainingScans = await MedicalScan.countDocuments({ patientId: patient.patientId });
        
        console.log('\n📊 Final Status:');
        console.log(`   Remaining Appointments: ${remainingAppointments}`);
        console.log(`   Remaining Prescriptions: ${remainingPrescriptions}`);
        console.log(`   Remaining Scans: ${remainingScans}`);
        
        if (remainingAppointments === 0 && remainingPrescriptions === 0 && remainingScans === 0) {
            console.log('\n✅ All medical data cleared successfully!');
        } else {
            console.log('\n⚠️  Some data may still remain');
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

