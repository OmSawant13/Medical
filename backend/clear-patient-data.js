const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./src/config/database');
const User = require('./models/User');
const Patient = require('./models/Patient');
const MedicalScan = require('./models/MedicalScan');
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');

async function clearPatientData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get all patient users
    const patientUsers = await User.find({ role: 'patient' });
    console.log(`📋 Found ${patientUsers.length} patient user(s)`);

    if (patientUsers.length === 0) {
      console.log('✅ No patient users found. Database is already clean!');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Show patients before deletion
    console.log('\n👥 Patients to be deleted:');
    patientUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    // Get patient IDs
    const patientIds = [];
    for (const user of patientUsers) {
      const patient = await Patient.findOne({ userId: user._id });
      if (patient) {
        patientIds.push(patient.patientId);
      }
    }

    console.log(`\n🆔 Found ${patientIds.length} patient ID(s): ${patientIds.join(', ')}`);

    // Delete patient-related data
    console.log('\n🗑️  Deleting patient-related data...\n');

    // 1. Delete Medical Scans
    const scansDeleted = await MedicalScan.deleteMany({ 
      patientId: { $in: patientIds } 
    });
    console.log(`   ✅ Deleted ${scansDeleted.deletedCount} medical scan(s)`);

    // 2. Delete Appointments
    const appointmentsDeleted = await Appointment.deleteMany({ 
      patientId: { $in: patientIds } 
    });
    console.log(`   ✅ Deleted ${appointmentsDeleted.deletedCount} appointment(s)`);

    // 3. Delete Prescriptions
    let prescriptionsDeleted = 0;
    try {
      const result = await Prescription.deleteMany({ 
        patientId: { $in: patientIds } 
      });
      prescriptionsDeleted = result.deletedCount;
      console.log(`   ✅ Deleted ${prescriptionsDeleted} prescription(s)`);
    } catch (error) {
      console.log(`   ⚠️  Prescriptions collection not found or error: ${error.message}`);
    }

    // 4. Delete Patient profiles
    const patientsDeleted = await Patient.deleteMany({ 
      userId: { $in: patientUsers.map(u => u._id) } 
    });
    console.log(`   ✅ Deleted ${patientsDeleted.deletedCount} patient profile(s)`);

    // 5. Delete Patient Users
    const usersDeleted = await User.deleteMany({ role: 'patient' });
    console.log(`   ✅ Deleted ${usersDeleted.deletedCount} patient user(s)`);

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Patient Data Cleared Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Summary:`);
    console.log(`   - Users deleted: ${usersDeleted.deletedCount}`);
    console.log(`   - Patient profiles deleted: ${patientsDeleted.deletedCount}`);
    console.log(`   - Medical scans deleted: ${scansDeleted.deletedCount}`);
    console.log(`   - Appointments deleted: ${appointmentsDeleted.deletedCount}`);
    console.log(`   - Prescriptions deleted: ${prescriptionsDeleted}`);
    console.log('\n💡 Doctors and Hospitals data are preserved!');

    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing patient data:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

clearPatientData();

