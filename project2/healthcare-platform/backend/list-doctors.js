require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const User = require('./models/User');

async function listDoctors() {
    console.log('Using shared DB config...');
    await connectDB();
    console.log('Connected.');

    try {
        const doctors = await User.find({ role: 'doctor' });
        console.log('Found Doctors:', doctors.length);
        doctors.forEach(doc => {
            console.log(`- ${doc.name} (ID: ${doc._id})`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
listDoctors();
