const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import Models
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');
const MedicalScan = require('./models/MedicalScan');
const Notification = require('./models/Notification');
// We do NOT clear User/Patient models to keep accounts active

const clearData = async () => {
    try {
        // Connect to MongoDB - Force Local to avoid Atlas Auth issues
        const mongoUri = 'mongodb://localhost:27017/healthcare-platform';
        console.log('🔗 Connecting to Local MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected');

        // Clear Collections
        console.log('🧹 Clearing clinical data...');

        const deleteAppointments = await Appointment.deleteMany({});
        console.log(`❌ Deleted ${deleteAppointments.deletedCount} Appointments`);

        const deletePrescriptions = await Prescription.deleteMany({});
        console.log(`❌ Deleted ${deletePrescriptions.deletedCount} Prescriptions`);

        const deleteScans = await MedicalScan.deleteMany({});
        console.log(`❌ Deleted ${deleteScans.deletedCount} Medical Scans`);

        const deleteNotifications = await Notification.deleteMany({});
        console.log(`❌ Deleted ${deleteNotifications.deletedCount} Notifications`);

        console.log('✨ Data clearing complete! User accounts are preserved.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
