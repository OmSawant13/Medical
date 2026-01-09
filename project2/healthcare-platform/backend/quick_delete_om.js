#!/usr/bin/env node
const mongoose = require('mongoose');
require('dotenv').config();

const Patient = require('./models/Patient');
const Prescription = require('./models/Prescription');
const Appointment = require('./models/Appointment');
const MedicalScan = require('./models/MedicalScan');
const User = require('./models/User');

async function deleteOmHistory() {
  try {
    console.log('🔗 Connecting...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected\n');

    const user = await User.findOne({ name: { $regex: /om.*sawant/i } });
    if (!user) {
      console.log('❌ OM SAWANT not found');
      const users = await User.find({}, 'name');
      console.log('Available users:', users.map(u => u.name).join(', '));
      process.exit(1);
    }

    console.log(`✅ Found: ${user.name} (${user.email})`);

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      console.log('❌ Patient record not found');
      process.exit(1);
    }

    const pid = patient.patientId;
    const pidObj = patient._id;
    console.log(`✅ Patient ID: ${pid}\n`);

    const pCount = await Prescription.countDocuments({ patientId: pid });
    const aCount = await Appointment.countDocuments({ patientId: pid });
    const sCount1 = await MedicalScan.countDocuments({ patientId: pid });
    const sCount2 = await MedicalScan.countDocuments({ patientId: pidObj });

    console.log(`📊 Found:`);
    console.log(`   Prescriptions: ${pCount}`);
    console.log(`   Appointments: ${aCount}`);
    console.log(`   Scans: ${sCount1 + sCount2}\n`);

    if (pCount === 0 && aCount === 0 && sCount1 === 0 && sCount2 === 0) {
      console.log('✅ No records to delete');
      await mongoose.disconnect();
      return;
    }

    console.log('🗑️  Deleting...\n');

    const pDel = await Prescription.deleteMany({ patientId: pid });
    console.log(`✅ Deleted ${pDel.deletedCount} prescriptions`);

    const aDel = await Appointment.deleteMany({ patientId: pid });
    console.log(`✅ Deleted ${aDel.deletedCount} appointments`);

    const sDel1 = await MedicalScan.deleteMany({ patientId: pid });
    const sDel2 = await MedicalScan.deleteMany({ patientId: pidObj });
    console.log(`✅ Deleted ${sDel1.deletedCount + sDel2.deletedCount} scans\n`);

    console.log('✅✅✅ All medical history deleted!\n');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 MongoDB not running! Start it with: mongod');
    }
    process.exit(1);
  }
}

deleteOmHistory();

