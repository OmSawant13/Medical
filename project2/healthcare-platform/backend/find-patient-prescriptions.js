const mongoose = require('mongoose');
const Prescription = require('./models/Prescription');
require('dotenv').config();

let mongoUri = process.env.MONGODB_URI;
if (mongoUri && (mongoUri.includes('mongodb.net') || mongoUri.includes('atlas'))) {
    mongoUri = 'mongodb://localhost:27017/healthcare-platform';
}
mongoUri = mongoUri || 'mongodb://localhost:27017/healthcare-platform';

mongoose.connect(mongoUri).then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    try {
        const patientId = 'PMJMFZ8K62CE0';
        const appointmentId = 'AMJWKMZH1BB45';
        
        // Find all prescriptions for this patient
        const allPrescriptions = await Prescription.find({ 
            patientId: patientId 
        }).sort({ createdAt: -1 });
        
        console.log(`📊 Total prescriptions for patient ${patientId}: ${allPrescriptions.length}\n`);
        
        if (allPrescriptions.length > 0) {
            allPrescriptions.forEach((pres, idx) => {
                console.log(`${idx + 1}. Prescription ID: ${pres.prescriptionId}`);
                console.log(`   Appointment ID: ${pres.appointmentId}`);
                console.log(`   Doctor ID: ${pres.doctorId}`);
                console.log(`   Created: ${pres.createdAt}`);
                
                if (pres.digitalPrescription) {
                    console.log(`   ✅ Has Digital Prescription`);
                    console.log(`      Diagnosis: ${pres.digitalPrescription.diagnosis || 'N/A'}`);
                    console.log(`      Medicines: ${pres.digitalPrescription.medicines?.length || 0}`);
                    if (pres.digitalPrescription.medicines && pres.digitalPrescription.medicines.length > 0) {
                        pres.digitalPrescription.medicines.forEach((med, i) => {
                            console.log(`        ${i + 1}. ${med.name} - ${med.dosage}`);
                        });
                    }
                }
                
                if (pres.imagePrescription) {
                    console.log(`   ✅ Has Image Prescription`);
                    console.log(`      File: ${pres.imagePrescription.fileName}`);
                }
                
                // Check if this might be the right prescription
                if (pres.appointmentId === appointmentId || 
                    pres.appointmentId?.toString() === appointmentId ||
                    pres.appointmentId?.includes(appointmentId) ||
                    appointmentId.includes(pres.appointmentId)) {
                    console.log(`   ⚠️  POSSIBLE MATCH!`);
                }
                
                console.log('');
            });
            
            // Try to find prescription by doctor and date
            console.log('\n🔍 Searching by doctor ID and recent date...');
            const recentPrescriptions = await Prescription.find({
                patientId: patientId,
                createdAt: { $gte: new Date('2026-01-01') }
            }).sort({ createdAt: -1 });
            
            console.log(`Found ${recentPrescriptions.length} recent prescriptions`);
            
        } else {
            console.log('❌ No prescriptions found for this patient');
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

