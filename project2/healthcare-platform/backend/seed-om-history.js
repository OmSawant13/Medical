require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');
const User = require('./models/User');

async function seedHistory() {
    console.log('Using shared DB config...');
    await connectDB();
    console.log('Connected via shared config.');

    try {
        // 1. Find or Create User 'Om Sawant'
        let user = await User.findOne({ name: 'Om Sawant' });
        if (!user) {
            console.log('Creating User Om Sawant...');
            user = await User.create({
                name: 'Om Sawant',
                email: 'om.sawant@example.com',
                password: 'hashedpassword123', // Dummy
                role: 'patient'
            });
        }

        // 2. Find or Create Patient Profile
        let patient = await Patient.findOne({ userId: user._id });
        if (!patient) {
            console.log('Creating Patient Profile...');
            patient = await Patient.create({
                userId: user._id,
                patientId: 'P-OM-001',
                personalInfo: {
                    dateOfBirth: new Date('1998-05-15'),
                    gender: 'male',
                    phone: '9876543210'
                },
                medicalInfo: {
                    bloodType: 'O+',
                    allergies: ['Peanuts'],
                    chronicConditions: []
                }
            });
        }

        // 3. Create PAST Appointment (The "History")
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 2); // 2 months ago

        console.log('Creating Past Appointment (Viral Fever)...');
        const pastApp = await Appointment.create({
            appointmentId: `APT-${Date.now()}-PAST`,
            patientId: patient.patientId,
            doctorId: 'DOC-001',
            hospitalId: 'HOSP-001',
            appointmentDate: pastDate,
            appointmentTime: '10:00 AM',
            status: 'completed',
            symptoms: ['Fever', 'Chills'],
            type: 'consultation'
        });

        // 4. Create PAST Prescription
        await Prescription.create({
            prescriptionId: `PRE-${Date.now()}-PAST`,
            appointmentId: pastApp.appointmentId,
            patientId: patient.patientId,
            doctorId: 'DOC-001',
            digitalPrescription: {
                diagnosis: 'Viral Fever',
                medicines: [{
                    name: 'Paracetamol 650mg',
                    dosage: '1 tablet',
                    frequency: 'thrice daily',
                    duration: '5 days'
                }],
                notes: 'Rest and hydration.'
            },
            createdAt: pastDate
        });

        // 5. Create TODAY'S Appointment (The "Test Case")
        console.log('Creating Current Appointment (Fever)...');
        await Appointment.create({
            appointmentId: `APT-${Date.now()}-NOW`,
            patientId: patient.patientId,
            doctorId: 'DOC-001',
            hospitalId: 'HOSP-001',
            appointmentDate: new Date(),
            appointmentTime: '02:00 PM',
            status: 'confirmed',
            symptoms: ['High Fever', 'Body Ache'],
            type: 'consultation'
        });

        console.log('--------------------------------------------------');
        console.log('SUCCESS: Seeded History for Om Sawant.');
        console.log('--------------------------------------------------');
        console.log('HOW TO TEST:');
        console.log('1. Log in as Doctor.');
        console.log('2. See "Om Sawant" in your queue (or search him).');
        console.log('3. Click "See Patient".');
        console.log('4. Observe Column 3 (AI Brain).');
        console.log('   Expected: "History Pattern Detected: Viral Fever (2 months ago)"');
        console.log('   Expected Suggestion: "Paracetamol 650mg"');
        console.log('--------------------------------------------------');

    } catch (err) {
        console.error('Seeding Failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seedHistory();
