const mongoose = require('mongoose');
require('dotenv').config();

const Appointment = require('./models/Appointment');
const Doctor = require('./models/Doctor');
const User = require('./models/User');

async function debugAppointments() {
    try {
        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all appointments
        const appointments = await Appointment.find({}).lean();
        console.log(`📊 Total Appointments: ${appointments.length}\n`);

        if (appointments.length > 0) {
            console.log('=== ALL APPOINTMENTS ===');
            for (const apt of appointments) {
                console.log(`\nAppointment ID: ${apt.appointmentId}`);
                console.log(`  Doctor ID: ${apt.doctorId}`);
                console.log(`  Patient ID: ${apt.patientId}`);
                console.log(`  Date: ${apt.appointmentDate}`);
                console.log(`  Status: ${apt.status}`);
                
                // Find the doctor
                const doctor = await Doctor.findOne({ doctorId: apt.doctorId }).populate('userId', 'name email').lean();
                if (doctor) {
                    console.log(`  Doctor Found: ${doctor.userId?.name || doctor.name || 'Unknown'} (${doctor.doctorId})`);
                } else {
                    console.log(`  ❌ Doctor NOT FOUND with doctorId: ${apt.doctorId}`);
                }
            }
        }

        // Get Dr. Deepika Shah specifically
        console.log('\n\n=== DR. DEEPIKA SHAH ===');
        const deepikaUser = await User.findOne({ email: /deepika/i }).lean();
        if (deepikaUser) {
            console.log(`Found user: ${deepikaUser.name} (${deepikaUser.email})`);
            const deepikaDoctor = await Doctor.findOne({ userId: deepikaUser._id }).populate('userId', 'name email').lean();
            if (deepikaDoctor) {
                console.log(`Doctor ID: ${deepikaDoctor.doctorId}`);
                console.log(`Doctor Name: ${deepikaDoctor.userId?.name || deepikaDoctor.name}`);
                
                // Find appointments for this doctor
                const deepikaAppointments = await Appointment.find({ doctorId: deepikaDoctor.doctorId }).lean();
                console.log(`\nAppointments for Dr. Deepika Shah: ${deepikaAppointments.length}`);
                deepikaAppointments.forEach(apt => {
                    console.log(`  - ${apt.appointmentId}: ${apt.appointmentDate} (${apt.status})`);
                });
            } else {
                console.log('❌ Doctor profile not found for this user');
            }
        } else {
            console.log('❌ User not found');
        }

        // Check all doctors
        console.log('\n\n=== ALL DOCTORS ===');
        const doctors = await Doctor.find({}).populate('userId', 'name email').lean();
        console.log(`Total Doctors: ${doctors.length}`);
        doctors.forEach(doc => {
            const appointmentCount = appointments.filter(apt => apt.doctorId === doc.doctorId).length;
            console.log(`  - ${doc.userId?.name || doc.name}: ${doc.doctorId} (${appointmentCount} appointments)`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugAppointments();

