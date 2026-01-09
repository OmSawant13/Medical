// Script to delete all medical history for OM SAWANT
const mongoose = require('mongoose');
require('dotenv').config();

const Patient = require('./models/Patient');
const Prescription = require('./models/Prescription');
const Appointment = require('./models/Appointment');
const MedicalScan = require('./models/MedicalScan');
const User = require('./models/User');
const connectDB = require('./src/config/database');

const deletePatientHistory = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');
    
    console.log('\n🔍 Searching for patient: OM SAWANT...\n');
    
    // Find patient by name
    const user = await User.findOne({ 
      name: { $regex: /om.*sawant/i } 
    });
    
    if (!user) {
      console.log('❌ User "OM SAWANT" not found');
      console.log('Available users:');
      const allUsers = await User.find({}, 'name email role');
      allUsers.forEach(u => console.log(`  - ${u.name} (${u.email}) - ${u.role}`));
      await mongoose.disconnect();
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email}) - ${user._id}`);
    
    // Find patient record
    const patient = await Patient.findOne({ userId: user._id });
    
    if (!patient) {
      console.log('⚠️  Patient record not found, but found user');
      await mongoose.disconnect();
      return;
    }
    
    const patientId = patient.patientId;
    const patientObjectId = patient._id;
    console.log(`✅ Found patient record: ${patientId} (ObjectId: ${patientObjectId})\n`);
    
    // Count records before deletion
    // Note: MedicalScan might use ObjectId or String for patientId - check both
    const prescriptionCount = await Prescription.countDocuments({ patientId });
    const appointmentCount = await Appointment.countDocuments({ patientId });
    const scanCountString = await MedicalScan.countDocuments({ patientId: patientId });
    const scanCountObjectId = await MedicalScan.countDocuments({ patientId: patientObjectId });
    const scanCount = scanCountString + scanCountObjectId;
    
    console.log('📊 Current records:');
    console.log(`  - Prescriptions: ${prescriptionCount}`);
    console.log(`  - Appointments: ${appointmentCount}`);
    console.log(`  - Medical Scans: ${scanCount}\n`);
    
    if (prescriptionCount === 0 && appointmentCount === 0 && scanCount === 0) {
      console.log('✅ No medical history found to delete');
      await mongoose.disconnect();
      return;
    }
    
    // Delete all records
    console.log('🗑️  Deleting medical history...\n');
    
    const prescriptionResult = await Prescription.deleteMany({ patientId });
    console.log(`✅ Deleted ${prescriptionResult.deletedCount} prescriptions`);
    
    const appointmentResult = await Appointment.deleteMany({ patientId });
    console.log(`✅ Deleted ${appointmentResult.deletedCount} appointments`);
    
    const scanResultString = await MedicalScan.deleteMany({ patientId: patientId });
    const scanResultObjectId = await MedicalScan.deleteMany({ patientId: patientObjectId });
    const totalScansDeleted = scanResultString.deletedCount + scanResultObjectId.deletedCount;
    console.log(`✅ Deleted ${totalScansDeleted} medical scans (String: ${scanResultString.deletedCount}, ObjectId: ${scanResultObjectId.deletedCount})`);
    
    console.log('\n✅✅✅ All medical history deleted successfully!\n');
    
    // Verify deletion
    const remainingPrescriptions = await Prescription.countDocuments({ patientId });
    const remainingAppointments = await Appointment.countDocuments({ patientId });
    const remainingScansString = await MedicalScan.countDocuments({ patientId: patientId });
    const remainingScansObjectId = await MedicalScan.countDocuments({ patientId: patientObjectId });
    const remainingScans = remainingScansString + remainingScansObjectId;
    
    console.log('📊 Remaining records:');
    console.log(`  - Prescriptions: ${remainingPrescriptions}`);
    console.log(`  - Appointments: ${remainingAppointments}`);
    console.log(`  - Medical Scans: ${remainingScans}\n`);
    
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

deletePatientHistory();

