const mongoose = require('mongoose');
const Prescription = require('./models/Prescription');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
require('dotenv').config();

let mongoUri = process.env.MONGODB_URI;
if (mongoUri && (mongoUri.includes('mongodb.net') || mongoUri.includes('atlas'))) {
    mongoUri = 'mongodb://localhost:27017/healthcare-platform';
}
mongoUri = mongoUri || 'mongodb://localhost:27017/healthcare-platform';

mongoose.connect(mongoUri).then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    try {
        // Find Dr. Ajay Tiwari
        const user = await User.findOne({ name: /Ajay.*Tiwari/i });
        if (!user) {
            console.log('❌ Dr. Ajay Tiwari not found');
            await mongoose.disconnect();
            process.exit(1);
        }
        
        const doctor = await Doctor.findOne({ userId: user._id });
        if (!doctor) {
            console.log('❌ Doctor profile not found');
            await mongoose.disconnect();
            process.exit(1);
        }
        
        console.log(`✅ Found Dr. Ajay Tiwari: ${doctor.doctorId}\n`);
        
        // Find all prescriptions by this doctor
        const prescriptions = await Prescription.find({
            doctorId: doctor.doctorId
        }).sort({ createdAt: -1 }).limit(10);
        
        console.log(`📊 Total prescriptions by Dr. Ajay Tiwari: ${prescriptions.length}\n`);
        
        if (prescriptions.length > 0) {
            prescriptions.forEach((pres, idx) => {
                console.log(`${idx + 1}. Prescription ID: ${pres.prescriptionId}`);
                console.log(`   Appointment ID: ${pres.appointmentId}`);
                console.log(`   Patient ID: ${pres.patientId}`);
                console.log(`   Created: ${pres.createdAt}`);
                
                if (pres.digitalPrescription) {
                    console.log(`   ✅ Digital Prescription:`);
                    console.log(`      Diagnosis: ${pres.digitalPrescription.diagnosis || 'N/A'}`);
                    if (pres.digitalPrescription.medicines && pres.digitalPrescription.medicines.length > 0) {
                        console.log(`      Medicines: ${pres.digitalPrescription.medicines.length}`);
                        pres.digitalPrescription.medicines.forEach((med, i) => {
                            console.log(`        ${i + 1}. ${med.name} - ${med.dosage} (${med.frequency})`);
                        });
                    }
                }
                console.log('');
            });
        } else {
            console.log('❌ No prescriptions found for Dr. Ajay Tiwari');
        }
        
        // Check all prescriptions in database
        const allPrescriptions = await Prescription.countDocuments();
        console.log(`\n📊 Total prescriptions in database: ${allPrescriptions}`);
        
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

