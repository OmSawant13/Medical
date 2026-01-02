const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');
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
        const appointmentId = 'AMJWKMZH1BB45';
        
        // Find appointment
        const appointment = await Appointment.findOne({ 
            appointmentId: appointmentId
        });
        
        if (!appointment) {
            console.log(`❌ Appointment ${appointmentId} not found`);
            await mongoose.disconnect();
            process.exit(1);
        }
        
        console.log(`✅ Found appointment: ${appointment.appointmentId}`);
        console.log(`   Patient ID: ${appointment.patientId}`);
        console.log(`   Doctor ID: ${appointment.doctorId}`);
        console.log(`   Date: ${appointment.appointmentDate}`);
        console.log(`   Status: ${appointment.status}\n`);
        
        // Find prescription by appointmentId
        const prescription1 = await Prescription.findOne({ 
            appointmentId: appointment.appointmentId 
        });
        
        // Also try finding by string match
        const prescription2 = await Prescription.findOne({ 
            appointmentId: appointment._id.toString() 
        }).catch(() => null);
        
        // Try finding by patientId and date
        const prescription3 = await Prescription.findOne({ 
            patientId: appointment.patientId 
        }).sort({ createdAt: -1 });
        
        const prescription = prescription1 || prescription2 || prescription3;
        
        if (prescription) {
            console.log(`✅ Found prescription: ${prescription.prescriptionId}`);
            console.log(`   Appointment ID in prescription: ${prescription.appointmentId}`);
            console.log(`   Patient ID: ${prescription.patientId}`);
            console.log(`   Doctor ID: ${prescription.doctorId}`);
            console.log(`   Created: ${prescription.createdAt}\n`);
            
            if (prescription.digitalPrescription) {
                console.log('📋 Digital Prescription:');
                console.log(`   Diagnosis: ${prescription.digitalPrescription.diagnosis || 'N/A'}`);
                console.log(`   Medicines: ${prescription.digitalPrescription.medicines?.length || 0}`);
                if (prescription.digitalPrescription.medicines && prescription.digitalPrescription.medicines.length > 0) {
                    prescription.digitalPrescription.medicines.forEach((med, idx) => {
                        console.log(`     ${idx + 1}. ${med.name} - ${med.dosage} (${med.frequency})`);
                    });
                }
                console.log(`   Notes: ${prescription.digitalPrescription.notes || 'N/A'}\n`);
            }
            
            if (prescription.imagePrescription) {
                console.log('📷 Image Prescription:');
                console.log(`   File: ${prescription.imagePrescription.fileName}`);
                console.log(`   Path: ${prescription.imagePrescription.filePath}\n`);
            }
            
            // Check if appointmentId matches
            if (prescription.appointmentId !== appointment.appointmentId && prescription.appointmentId !== appointment._id.toString()) {
                console.log('⚠️  WARNING: Appointment ID mismatch!');
                console.log(`   Appointment ID: ${appointment.appointmentId}`);
                console.log(`   Prescription appointmentId: ${prescription.appointmentId}`);
                console.log('\n💡 Fixing appointmentId in prescription...');
                await Prescription.updateOne(
                    { _id: prescription._id },
                    { $set: { appointmentId: appointment.appointmentId } }
                );
                console.log('✅ Fixed! Prescription now linked to correct appointment.');
            }
        } else {
            console.log('❌ No prescription found for this appointment');
            console.log('\nSearching all prescriptions for this patient...');
            const allPrescriptions = await Prescription.find({ 
                patientId: appointment.patientId 
            }).sort({ createdAt: -1 }).limit(5);
            
            if (allPrescriptions.length > 0) {
                console.log(`Found ${allPrescriptions.length} prescriptions for this patient:`);
                allPrescriptions.forEach((p, idx) => {
                    console.log(`  ${idx + 1}. Prescription ID: ${p.prescriptionId}`);
                    console.log(`     Appointment ID: ${p.appointmentId}`);
                    console.log(`     Created: ${p.createdAt}`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    }
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

