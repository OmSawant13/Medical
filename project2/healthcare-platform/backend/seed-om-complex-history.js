require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');
const MedicalScan = require('./models/MedicalScan');
const User = require('./models/User');

async function seedComplexHistory() {
    console.log('Using shared DB config...');
    await connectDB();
    console.log('Connected.');

    try {
        // 1. Get Om Sawant
        const user = await User.findOne({ name: 'Om Sawant' });
        if (!user) { console.error('Create User Om Sawant first.'); return; }

        let patient = await Patient.findOne({ userId: user._id });
        if (!patient) { console.error('Create Patient Profile first.'); return; }

        console.log(`Configuring History for: ${user.name} (${patient.patientId})`);

        // 2. Get Doctors
        const drAnjali = await User.findOne({ name: 'Dr. Anjali Singh' });
        const drRahul = await User.findOne({ name: 'Dr. Rahul Bansal' });
        const drVikram = await User.findOne({ name: 'Dr. Vikram Gupta' });
        const drSwati = await User.findOne({ name: 'Dr. Swati Saxena' });

        if (!drAnjali || !drRahul || !drVikram || !drSwati) {
            console.error('Could not find all required doctors. Check seeded data.');
            return;
        }

        // 3. CLEANUP (Remove old data for clarity)
        console.log('Cleaning up old test data for Om Sawant...');
        await Appointment.deleteMany({ patientId: patient.patientId });
        await Prescription.deleteMany({ patientId: patient.patientId });
        await MedicalScan.deleteMany({ patientId: patient.patientId });

        // ---------------------------------------------------------
        // EVENT 1: 1 Year Ago - Chest Infection (Dr. Vikram Gupta)
        // ---------------------------------------------------------
        const date1 = new Date(); date1.setFullYear(date1.getFullYear() - 1);
        const apt1 = await Appointment.create({
            appointmentId: `APT-${Date.now()}-1`,
            patientId: patient.patientId,
            doctorId: drVikram._id.toString(), // Linking real Doctor ID
            hospitalId: 'HOSP-001',
            appointmentDate: date1,
            appointmentTime: '10:00 AM',
            status: 'completed',
            symptoms: ['Chest Pain', 'Cough'],
            diagnosis: 'Acute Bronchitis',
            type: 'consultation',
            notes: 'Patient advised rest and antibiotics.'
        });

        await Prescription.create({
            prescriptionId: `PRE-${Date.now()}-1`,
            appointmentId: apt1.appointmentId,
            patientId: patient.patientId,
            doctorId: drVikram._id.toString(),
            digitalPrescription: {
                diagnosis: 'Acute Bronchitis',
                medicines: [
                    { name: 'Azithromycin 500mg', dosage: '1 tab', frequency: 'daily', duration: '5 days' },
                    { name: 'Ascoril LS Syrup', dosage: '10ml', frequency: 'thrice daily', duration: '7 days' }
                ],
                notes: 'Drink warm water.'
            },
            createdAt: date1
        });

        await MedicalScan.create({
            scanId: `SCN-${Date.now()}-1`,
            patientId: patient.patientId,
            doctorId: drVikram._id.toString(),
            scanType: 'chest-xray',
            filePath: '/uploads/dummy_chest_healthy.jpg',
            uploadedBy: drVikram._id,
            status: 'completed',
            createdAt: date1,
            aiAnalysis: {
                confidence: 0.98,
                findings: ['Bronchial thickening', 'No consolidation'],
                recommendations: ['Antibiotics'],
                processingTime: 0.8,
                modelVersion: 'v1.0'
            }
        });
        console.log(` + Event 1: Bronchitis with Dr. Vikram Gupta (${date1.toLocaleDateString()})`);

        // ---------------------------------------------------------
        // EVENT 2: REMOVED (User Request: No Fracture History)
        // ---------------------------------------------------------
        // (Fracture Data Scrubbed)

        // ---------------------------------------------------------
        // EVENT 3: 2 Months Ago - Viral Fever (Dr. Swati Saxena)
        // ---------------------------------------------------------
        const date3 = new Date(); date3.setMonth(date3.getMonth() - 2);
        const apt3 = await Appointment.create({
            appointmentId: `APT-${Date.now()}-3`,
            patientId: patient.patientId,
            doctorId: drSwati._id.toString(),
            hospitalId: 'HOSP-001',
            appointmentDate: date3,
            appointmentTime: '11:00 AM',
            status: 'completed',
            symptoms: ['Fever', 'Headache'],
            diagnosis: 'Viral Pyrexia',
            type: 'consultation',
            notes: 'Seasonal flu.'
        });

        await Prescription.create({
            prescriptionId: `PRE-${Date.now()}-3`,
            appointmentId: apt3.appointmentId,
            patientId: patient.patientId,
            doctorId: drSwati._id.toString(),
            digitalPrescription: {
                diagnosis: 'Viral Pyrexia',
                medicines: [
                    { name: 'Dolo 650', dosage: '1 tab', frequency: 'thrice daily', duration: '3 days' },
                    { name: 'Allegra 120', dosage: '1 tab', frequency: 'nightly', duration: '5 days' }
                ],
                notes: 'Hydration.'
            },
            createdAt: date3
        });
        console.log(` + Event 3: Fever with Dr. Swati Saxena (${date3.toLocaleDateString()})`);

        // ---------------------------------------------------------
        // NOW: APPOINTMENT WITH DR. ANJALI SINGH
        // ---------------------------------------------------------
        console.log(`Creating Booking for Dr. Anjali Singh...`);
        const today = new Date();
        today.setHours(14, 0, 0, 0); // 2:00 PM

        await Appointment.create({
            appointmentId: `APT-${Date.now()}-NOW`,
            patientId: patient.patientId,
            doctorId: drAnjali._id.toString(),
            hospitalId: 'HOSP-001',
            appointmentDate: today,
            appointmentTime: '02:00 PM',
            status: 'confirmed',
            symptoms: ['High Fever', 'Chills'],
            type: 'consultation',
            notes: 'Patient requesting urgent consult.'
        });

        console.log('--------------------------------------------------');
        console.log('SUCCESS: Complex History Seeded.');
        console.log('--------------------------------------------------');
        console.log(`TEST INSTRUCTIONS:`);
        console.log(`1. Log in as: Dr. Anjali Singh (email: dr.anjali@example.com / password: password123 [Check dummy data])`);
        console.log(`   (Or verify Dr. Anjali credentials in backend/create-dummy-doctors.js - usually password123)`);
        console.log(`2. Dashboard -> See "Om Sawant".`);
        console.log(`3. Open Patient.`);
        console.log(`4. See History: You should see Dr. Vikram, Dr. Rahul, Dr. Swati listed.`);
        console.log(`5. AI: Should warn about Recurrent Fever (matching Dr. Swati's visit).`);
        console.log('--------------------------------------------------');

    } catch (err) {
        console.error('Seeding Failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seedComplexHistory();
