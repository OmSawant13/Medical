const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { v4: uuidv4 } = require('uuid');

// Import Models
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');
const Patient = require('./models/Patient');
const User = require('./models/User');

const seedOmHistory = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = 'mongodb://localhost:27017/healthcare-platform';
        console.log('🔗 Connecting to Local MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected');

        // 1. Find User by Email
        const targetEmail = 'omoffice1305@gmail.com';
        let user = await User.findOne({ email: targetEmail });

        if (!user) {
            console.log(`❌ User with email ${targetEmail} not found!`);
            console.log('⚠️ Creating a temporary user for testing purposes...');
            user = new User({
                email: targetEmail,
                password: 'password123',
                name: 'Om Sawant',
                role: 'patient'
            });
            await user.save();
            console.log(`✅ Created User: ${user.name} (${user._id})`);
        } else {
            console.log(`👤 Found User: ${user.name} (${user.email})`);
        }

        // 2. Find or Create Patient Linked to User
        let patient = await Patient.findOne({ userId: user._id });

        if (!patient) {
            console.log('👤 Patient record not found for user, creating new...');
            patient = new Patient({
                userId: user._id,
                patientId: 'P-' + uuidv4().substring(0, 8).toUpperCase(),
                personalInfo: {
                    dateOfBirth: new Date('1995-05-13'),
                    gender: 'male',
                    phone: '9876543210'
                },
                medicalInfo: {
                    allergies: ['Penicillin']
                }
            });
            await patient.save();
            console.log(`✅ Created Patient Record: ${patient.patientId}`);
        } else {
            console.log(`👤 Found existing Patient Record: ${patient.patientId}`);
        }

        const patientId = patient.patientId;
        const patientName = user.name || 'Om Sawant';
        const patientAge = 28;

        // 3. Clear existing history for this patient
        await Appointment.deleteMany({ patientId: patientId });
        await Prescription.deleteMany({ patientId: patientId });
        console.log('🧹 Cleared existing history for Om Sawant.');

        // 4. Visit 1: 6 Months Ago - Viral Fever
        const date1 = new Date();
        date1.setMonth(date1.getMonth() - 6);

        const appt1Id = 'APT-' + uuidv4().substring(0, 8);
        await Appointment.create({
            appointmentId: appt1Id,
            patientId: patientId,
            doctorId: 'DOC-001',
            doctorName: 'Dr. Smith',
            patientName: patientName,
            patientAge: patientAge,
            appointmentDate: date1,
            appointmentTime: '10:00',
            status: 'completed',
            type: 'consultation',
            symptoms: ['fever', 'chills', 'body ache'],
            diagnosis: 'Viral Pyrexia'
        });

        await Prescription.create({
            prescriptionId: 'RX-' + uuidv4().substring(0, 8),
            appointmentId: appt1Id,
            patientId: patientId,
            doctorId: 'DOC-001',
            hospitalId: 'HOSP-001',
            digitalPrescription: {
                diagnosis: 'Viral Pyrexia',
                medicines: [{
                    name: 'Dolo 650',
                    dosage: '650mg',
                    frequency: 'TID',
                    duration: '5 days',
                    instructions: 'After food'
                }],
                notes: 'Rest and hydration.'
            },
            createdAt: date1
        });
        console.log('📅 Created Visit 1: 6 Months ago (Viral Fever)');

        // 5. Visit 2: 3 Months Ago - Acute Gastritis (The Pattern)
        const date2 = new Date();
        date2.setMonth(date2.getMonth() - 3);

        const appt2Id = 'APT-' + uuidv4().substring(0, 8);
        await Appointment.create({
            appointmentId: appt2Id,
            patientId: patientId,
            doctorId: 'DOC-001',
            doctorName: 'Dr. Smith',
            patientName: patientName,
            patientAge: patientAge,
            appointmentDate: date2,
            appointmentTime: '11:00',
            status: 'completed',
            type: 'consultation',
            symptoms: ['stomach pain', 'nausea', 'vomiting'],
            diagnosis: 'Acute Gastritis'
        });

        await Prescription.create({
            prescriptionId: 'RX-' + uuidv4().substring(0, 8),
            appointmentId: appt2Id,
            patientId: patientId,
            doctorId: 'DOC-001',
            hospitalId: 'HOSP-001',
            digitalPrescription: {
                diagnosis: 'Acute Gastritis',
                medicines: [{
                    name: 'Pan-40',
                    dosage: '40mg',
                    frequency: 'OD',
                    duration: '7 days',
                    instructions: 'Empty stomach'
                }],
                notes: 'Avoid spicy food.'
            },
            createdAt: date2
        });
        console.log('📅 Created Visit 2: 3 Months ago (Gastritis -> Pan-40)');

        // 6. Visit 3: Today - Recurrence?
        const date3 = new Date();
        const appt3Id = 'APT-' + uuidv4().substring(0, 8);

        await Appointment.create({
            appointmentId: appt3Id,
            patientId: patientId,
            doctorId: 'DOC-001',
            doctorName: 'Dr. Current',
            patientName: patientName,
            patientAge: patientAge,
            appointmentDate: date3,
            appointmentTime: '09:30',
            status: 'scheduled',
            type: 'consultation',
            symptoms: ['stomach pain', 'nausea', 'burning sensation'],
            priority: 'medium'
        });
        console.log('📅 Created Visit 3: Today (Stomach Pain - Scheduled in Queue)');

        console.log(`✨ Data seeding for Om Sawant (${targetEmail}) complete!`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedOmHistory();
