const mongoose = require('mongoose');
const Appointment = require('./backend/models/Appointment');
const Doctor = require('./backend/models/Doctor');
const Patient = require('./backend/models/Patient');

require('dotenv').config({ path: './backend/.env' });

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
        console.log('Connected to MongoDB');

        const doctors = await Doctor.find({});
        console.log('--- DOCTORS ---');
        doctors.forEach(d => {
            console.log(`Name: ${d.name} | DoctorID: ${d.doctorId} | UserID: ${d.userId}`);
        });

        const appointments = await Appointment.find({});
        console.log('\n--- APPOINTMENTS ---');
        appointments.forEach(a => {
            console.log(`ApptID: ${a.appointmentId} | PatientID: ${a.patientId} | DoctorID: ${a.doctorId} | Date: ${a.appointmentDate} | Status: ${a.status}`);
        });

        const patients = await Patient.find({});
        console.log('\n--- PATIENTS ---');
        patients.forEach(p => {
            console.log(`Name: ${p.personalInfo.name} | PatientID: ${p.patientId} | UserID: ${p.userId}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
