require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const MedicalScan = require('./models/MedicalScan');
const User = require('./models/User');
const Patient = require('./models/Patient');

async function seedReports() {
    console.log('Using shared DB config...');
    await connectDB();
    console.log('Connected.');

    try {
        // 1. Get Om Sawant Details
        const user = await User.findOne({ name: 'Om Sawant' });
        if (!user) {
            console.error('User Om Sawant not found. Run seed-om-history.js first.');
            return;
        }
        const patient = await Patient.findOne({ userId: user._id });
        if (!patient) {
            console.error('Patient profile not found.');
            return;
        }

        const patientId = patient.patientId;
        const userId = user._id;

        console.log(`Seeding reports for ${patientId}...`);

        // Report 1: Bone X-Ray (6 Months Ago) - Fracture
        const date1 = new Date();
        date1.setMonth(date1.getMonth() - 6);

        await MedicalScan.create({
            scanId: `SCN-${Date.now()}-1`,
            patientId: patientId,
            scanType: 'bone-xray',
            filePath: '/uploads/dummy_bone_fracture.jpg', // Placeholder
            uploadedBy: userId,
            status: 'completed',
            createdAt: date1,
            updatedAt: date1,
            aiAnalysis: {
                confidence: 0.92,
                findings: [' hairline fracture detected in distal tibia', 'soft tissue swelling'],
                recommendations: ['Orthopedic consultation', 'Immobilization'],
                processingTime: 1.2,
                modelVersion: 'v1.0',
                requiresDoctorReview: false
            },
            metadata: {
                originalName: 'leg_xray_scan.jpg',
                mimeType: 'image/jpeg',
                dimensions: { width: 1024, height: 1024 }
            }
        });
        console.log(' + Added Bone X-Ray (Fracture)');

        // Report 2: Chest X-Ray (1 Year Ago) - Normal
        const date2 = new Date();
        date2.setFullYear(date2.getFullYear() - 1);

        await MedicalScan.create({
            scanId: `SCN-${Date.now()}-2`,
            patientId: patientId,
            scanType: 'chest-xray',
            filePath: '/uploads/dummy_chest_healthy.jpg',
            uploadedBy: userId,
            status: 'completed',
            createdAt: date2,
            updatedAt: date2,
            aiAnalysis: {
                confidence: 0.98,
                findings: ['Clear lung fields', 'No cardiomegaly', 'Normal thoracic cage'],
                recommendations: ['Routine follow-up if symptoms persist'],
                processingTime: 0.8,
                modelVersion: 'v1.0',
                requiresDoctorReview: false
            },
            metadata: {
                originalName: 'chest_checkup_2024.jpg',
                mimeType: 'image/jpeg',
                dimensions: { width: 2048, height: 2048 }
            }
        });
        console.log(' + Added Chest X-Ray (Healthy)');

        // Report 3: Brain MRI (Yesterday) - Pending
        const date3 = new Date();
        date3.setDate(date3.getDate() - 1);

        await MedicalScan.create({
            scanId: `SCN-${Date.now()}-3`,
            patientId: patientId,
            scanType: 'brain-mri',
            filePath: '/uploads/dummy_brain_mri.jpg',
            uploadedBy: userId,
            status: 'pending', // Simulating "Waiting for AI" or "Pending Review"
            createdAt: date3,
            updatedAt: date3,
            metadata: {
                originalName: 'headache_investigation.dcm',
                mimeType: 'application/dicom',
                dimensions: { width: 512, height: 512 }
            }
        });
        console.log(' + Added Brain MRI (Pending)');

        console.log('--------------------------------------------------');
        console.log('SUCCESS: Seeded 3 Medical Reports.');
        console.log('--------------------------------------------------');

    } catch (err) {
        console.error('Seeding Reports Failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seedReports();
