const mongoose = require('mongoose');
require('dotenv').config();

const Prescription = require('./models/Prescription');
const Appointment = require('./models/Appointment');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();

    try {
        console.log('🔍 Fetching one prescription WITHOUT populate...');
        const pRaw = await Prescription.findOne();
        if (!pRaw) {
            console.log('❌ No prescriptions found in DB.');
            process.exit(0);
        }
        console.log('📄 Raw Prescription appointmentId:', pRaw.appointmentId, '(Type:', typeof pRaw.appointmentId, ')');

        console.log('\n🔍 Fetching SAME prescription WITHOUT populate (SIMULATING FIX)...');
        // This is what the code does now
        const pPop = await Prescription.findById(pRaw._id);

        console.log('📄 Prescription appointmentId:', pPop.appointmentId);

        if (pPop.appointmentId) {
            console.log('✅ Fix verified! We got the ID back: ', pPop.appointmentId);
        } else {
            console.log('❌ Still null? That would be weird.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
