const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const User = require('./models/User');

require('dotenv').config();

const run = async () => {
    try {
        // Use local MongoDB as per .env fallback
        await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
        console.log('Connected to MongoDB');

        const doctors = await Doctor.find({});
        console.log('--- DOCTORS ---');
        for (const d of doctors) {
            const u = await User.findById(d.userId);
            console.log(`Name: ${u ? u.name : 'Unknown'} | DoctorID: ${d.doctorId} | UserID: ${d.userId} | ID: ${d._id}`);
        }

        const appointments = await Appointment.find({});
        console.log('\n--- APPOINTMENTS ---');
        for (const a of appointments) {
            console.log(`ApptID: ${a.appointmentId} | PatientID: ${a.patientId} | DoctorID: ${a.doctorId} | Date: ${a.appointmentDate} | Status: ${a.status}`);
        }

        // Check specifically for Deepkia Shah
        const users = await User.find({ name: /Deepika/i });
        console.log('\n--- USERS (Deepika) ---');
        console.log(users);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
