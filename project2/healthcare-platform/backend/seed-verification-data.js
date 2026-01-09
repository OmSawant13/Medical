const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { v4: uuidv4 } = require('uuid');

// Import Models
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');
const Patient = require('./models/Patient');

const seedVerificationData = async () => {
    try {
        // Connect to MongoDB (Force Local)
        const mongoUri = 'mongodb://localhost:27017/healthcare-platform';
        console.log('🔗 Connecting to Local MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected');

        // 1. Create Patient
        const patientId = 'P-' + uuidv4().substring(0, 8).toUpperCase();
        const patientName = 'DeepCheck User';
        console.log(`👤 Creating Patient: ${patientName} (${patientId})`);

        const newPatient = new Patient({
            patientId: patientId,
            userId: new mongoose.Types.ObjectId(),
            name: patientName,
            age: 35,
            gender: 'Male',
            contact: '555-0199',
            password: 'hashed_password_placeholder', // Not needed for this test
            medicalHistory: {
                chronicConditions: [],
                allergies: [],
                pastSurgeries: []
            }
        });
        await newPatient.save();

        // 2. Create Past History (3 Weeks Ago - Acute Gastritis)
        // This appointment is COMPLETED and has a prescription
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 21); // 3 weeks ago
        const pastApptId = 'APT-' + uuidv4().substring(0, 8);

        const pastAppointment = new Appointment({
            appointmentId: pastApptId,
            patientId: patientId,
            doctorId: 'DOC-001', // Assuming a generic doctor ID
            doctorName: 'Dr. Verifier',
            patientName: patientName,
            patientAge: 35,
            appointmentDate: pastDate,
            appointmentTime: '10:00',
            status: 'completed',
            type: 'consultation',
            symptoms: ['stomach pain', 'nausea', 'vomiting'],
            diagnosis: 'Acute Gastritis'
        });
        await pastAppointment.save();

        const pastPrescription = new Prescription({
            prescriptionId: 'RX-' + uuidv4().substring(0, 8),
            appointmentId: pastApptId,
            patientId: patientId,
            doctorId: 'DOC-001',
            hospitalId: 'HOSP-001',
            digitalPrescription: {
                diagnosis: 'Acute Gastritis',
                medicines: [{
                    name: 'Magic-Panto',
                    dosage: '40mg',
                    frequency: 'OD',
                    duration: '5 days',
                    instructions: 'Before food'
                }],
                notes: 'Specific medicine for verification test.'
            },
            createdAt: pastDate
        });
        await pastPrescription.save();
        console.log('📜 Created Past History (Acute Gastritis + Magic-Panto)');

        // 3. Create Current Appointment (Today - Stomach Pain)
        // This acts as the queue item for the doctor to "see"
        const currentApptId = 'APT-' + uuidv4().substring(0, 8);
        const currentAppointment = new Appointment({
            appointmentId: currentApptId,
            patientId: patientId,
            doctorId: 'DOC-001',
            doctorName: 'Dr. Current',
            patientName: patientName,
            patientAge: 35,
            appointmentDate: new Date(),
            appointmentTime: '09:00',
            status: 'scheduled',
            type: 'consultation',
            symptoms: ['stomach pain', 'nausea'], // Triggers Gastritis check
            priority: 'medium'
        });
        await currentAppointment.save();
        console.log('📅 Created Current Appointment (Stomach Pain)');

        console.log('✨ Verification data seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedVerificationData();
