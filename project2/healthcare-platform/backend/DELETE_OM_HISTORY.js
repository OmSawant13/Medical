const mongoose = require('mongoose');
const fs = require('fs');

const log = (msg) => {
  console.log(msg);
  fs.appendFileSync('/tmp/om_delete.log', msg + '\n');
};

(async () => {
  try {
    log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform', {
      serverSelectionTimeoutMS: 5000
    });
    log('✅ Connected!\n');

    const User = require('./models/User');
    const Patient = require('./models/Patient');
    const Prescription = require('./models/Prescription');
    const Appointment = require('./models/Appointment');
    const MedicalScan = require('./models/MedicalScan');

    log('🔍 Searching for OM SAWANT...');
    const user = await User.findOne({ name: { $regex: /om.*sawant/i } });
    
    if (!user) {
      log('❌ OM SAWANT not found!');
      const allUsers = await User.find({}, 'name');
      log('Available users: ' + allUsers.map(u => u.name).join(', '));
      process.exit(1);
    }

    log(`✅ Found user: ${user.name} (${user.email})`);

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      log('❌ Patient record not found!');
      process.exit(1);
    }

    const pid = patient.patientId;
    log(`✅ Patient ID: ${pid}\n`);

    const pCount = await Prescription.countDocuments({ patientId: pid });
    const aCount = await Appointment.countDocuments({ patientId: pid });
    const sCount1 = await MedicalScan.countDocuments({ patientId: pid });
    const sCount2 = await MedicalScan.countDocuments({ patientId: patient._id });

    log(`📊 Current records:`);
    log(`   Prescriptions: ${pCount}`);
    log(`   Appointments: ${aCount}`);
    log(`   Scans: ${sCount1 + sCount2}\n`);

    if (pCount === 0 && aCount === 0 && sCount1 === 0 && sCount2 === 0) {
      log('✅ No records to delete!');
      await mongoose.disconnect();
      process.exit(0);
    }

    log('🗑️  DELETING ALL MEDICAL HISTORY...\n');

    const pDel = await Prescription.deleteMany({ patientId: pid });
    log(`✅ Deleted ${pDel.deletedCount} prescriptions`);

    const aDel = await Appointment.deleteMany({ patientId: pid });
    log(`✅ Deleted ${aDel.deletedCount} appointments`);

    const sDel1 = await MedicalScan.deleteMany({ patientId: pid });
    const sDel2 = await MedicalScan.deleteMany({ patientId: patient._id });
    log(`✅ Deleted ${sDel1.deletedCount + sDel2.deletedCount} scans\n`);

    log('✅✅✅ ALL MEDICAL HISTORY DELETED SUCCESSFULLY!\n');
    
    await mongoose.disconnect();
    log('✅ Database disconnected');
    process.exit(0);

  } catch (error) {
    log('❌ ERROR: ' + error.message);
    if (error.message.includes('ECONNREFUSED')) {
      log('💡 MongoDB is not running!');
      log('   Start it with: mongod');
      log('   Or: brew services start mongodb-community');
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
})();

