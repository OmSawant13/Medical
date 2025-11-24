const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Family = require('../models/Family');
const bcrypt = require('bcryptjs');

const testUsers = [
  // Patients - NO lat/long, just address fields
  {
    name: 'Om Sawant',
    email: 'om@patient.com',
    password: 'Patient123',
    role: 'patient',
    phone: '+91-98765-43210',
    age: 25,
    gender: 'male',
    allergies: ['Penicillin', 'Peanuts'],
    ongoingMedications: ['Metformin 500mg'],
    chronicConditions: ['Type 2 Diabetes'],
    address: 'Flat 201, Green Valley Apartments',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@patient.com',
    password: 'Patient123',
    role: 'patient',
    phone: '+91-98765-43211',
    age: 30,
    gender: 'female',
    allergies: ['Dust', 'Pollen'],
    ongoingMedications: [],
    chronicConditions: ['Asthma'],
    address: 'House No. 45, Park Street',
    city: 'Delhi',
    state: 'Delhi',
    zipCode: '110001'
  },
  {
    name: 'Rajesh Kumar',
    email: 'rajesh@patient.com',
    password: 'Patient123',
    role: 'patient',
    phone: '+91-98765-43212',
    age: 35,
    gender: 'male',
    allergies: [],
    ongoingMedications: [],
    chronicConditions: [],
    address: 'Sector 15, Noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    zipCode: '201301'
  },
  // Doctors - Multiple specializations with proper addresses
  {
    name: 'Dr. Ramesh Sharma',
    email: 'sharma@doctor.com',
    password: 'Doctor123',
    role: 'doctor',
    phone: '+91-98765-43220',
    doctor_id: 'DOC-SHARMA-001',
    specialization: 'Cardiologist',
    qualification: 'MD, DM Cardiology',
    education: ['MBBS - AIIMS Delhi', 'MD - General Medicine', 'DM - Cardiology'],
    experience: 15,
    consultationFee: 1500,
    clinicName: 'Heart Care Clinic',
    address: '101, Medical Plaza, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400050',
    latitude: 19.0596,
    longitude: 72.8295,
    consultationHours: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '10:00', end: '14:00', available: true },
      sunday: { start: '10:00', end: '14:00', available: false }
    },
    isVerified: true
  },
  {
    name: 'Dr. Priya Verma',
    email: 'verma@doctor.com',
    password: 'Doctor123',
    role: 'doctor',
    phone: '+91-98765-43221',
    doctor_id: 'DOC-VERMA-001',
    specialization: 'Dermatologist',
    qualification: 'MD Dermatology',
    education: ['MBBS - KEM Hospital Mumbai', 'MD - Dermatology'],
    experience: 10,
    consultationFee: 1200,
    clinicName: 'Skin Care Center',
    address: '202, Health Avenue, Andheri',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400053',
    latitude: 19.1136,
    longitude: 72.8697,
    consultationHours: {
      monday: { start: '10:00', end: '18:00', available: true },
      tuesday: { start: '10:00', end: '18:00', available: true },
      wednesday: { start: '10:00', end: '18:00', available: true },
      thursday: { start: '10:00', end: '18:00', available: true },
      friday: { start: '10:00', end: '18:00', available: true },
      saturday: { start: '09:00', end: '13:00', available: true },
      sunday: { start: '09:00', end: '13:00', available: false }
    },
    isVerified: true
  },
  {
    name: 'Dr. Amit Patel',
    email: 'patel@doctor.com',
    password: 'Doctor123',
    role: 'doctor',
    phone: '+91-98765-43222',
    doctor_id: 'DOC-PATEL-001',
    specialization: 'General Physician',
    qualification: 'MBBS, MD',
    education: ['MBBS - Grant Medical College', 'MD - General Medicine'],
    experience: 8,
    consultationFee: 800,
    clinicName: 'Family Care Clinic',
    address: 'Sector 18, Near Metro Station',
    city: 'Noida',
    state: 'Uttar Pradesh',
    zipCode: '201301',
    latitude: 28.5355,
    longitude: 77.3910,
    consultationHours: {
      monday: { start: '09:00', end: '19:00', available: true },
      tuesday: { start: '09:00', end: '19:00', available: true },
      wednesday: { start: '09:00', end: '19:00', available: true },
      thursday: { start: '09:00', end: '19:00', available: true },
      friday: { start: '09:00', end: '19:00', available: true },
      saturday: { start: '09:00', end: '15:00', available: true },
      sunday: { start: '09:00', end: '13:00', available: true }
    },
    isVerified: true
  },
  {
    name: 'Dr. Anjali Singh',
    email: 'singh@doctor.com',
    password: 'Doctor123',
    role: 'doctor',
    phone: '+91-98765-43223',
    doctor_id: 'DOC-SINGH-001',
    specialization: 'Pediatrician',
    qualification: 'MD Pediatrics',
    education: ['MBBS - Maulana Azad Medical College', 'MD - Pediatrics'],
    experience: 12,
    consultationFee: 1000,
    clinicName: 'Kids Care Clinic',
    address: 'Connaught Place, Block A',
    city: 'Delhi',
    state: 'Delhi',
    zipCode: '110001',
    latitude: 28.6304,
    longitude: 77.2177,
    consultationHours: {
      monday: { start: '10:00', end: '18:00', available: true },
      tuesday: { start: '10:00', end: '18:00', available: true },
      wednesday: { start: '10:00', end: '18:00', available: true },
      thursday: { start: '10:00', end: '18:00', available: true },
      friday: { start: '10:00', end: '18:00', available: true },
      saturday: { start: '10:00', end: '16:00', available: true },
      sunday: { start: '10:00', end: '14:00', available: false }
    },
    isVerified: true
  },
  {
    name: 'Dr. Vikram Mehta',
    email: 'mehta@doctor.com',
    password: 'Doctor123',
    role: 'doctor',
    phone: '+91-98765-43224',
    doctor_id: 'DOC-MEHTA-001',
    specialization: 'Orthopedic',
    qualification: 'MS Orthopedics',
    education: ['MBBS - BJ Medical College', 'MS - Orthopedics'],
    experience: 14,
    consultationFee: 1300,
    clinicName: 'Bone & Joint Clinic',
    address: 'MG Road, Koregaon Park',
    city: 'Pune',
    state: 'Maharashtra',
    zipCode: '411001',
    latitude: 18.5204,
    longitude: 73.8567,
    consultationHours: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '13:00', available: true },
      sunday: { start: '09:00', end: '13:00', available: false }
    },
    isVerified: true
  },
  // Hospitals
  {
    name: 'City General Hospital',
    email: 'citygeneral@hospital.com',
    password: 'Hospital123',
    role: 'hospital',
    phone: '+1-555-3001',
    hospital_id: 'HOS-CITY-GEN-001',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    latitude: 40.7128,
    longitude: -74.0060,
    isVerified: true
  },
  {
    name: 'Metro Medical Center',
    email: 'metro@hospital.com',
    password: 'Hospital123',
    role: 'hospital',
    phone: '+1-555-3002',
    hospital_id: 'HOS-METRO-001',
    address: '456 Broadway',
    city: 'New York',
    state: 'NY',
    zipCode: '10013',
    latitude: 40.7209,
    longitude: -74.0007,
    isVerified: true
  }
];

async function createTestUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthlink');
    console.log('✅ Connected to MongoDB\n');

    console.log('👥 Creating Test Users...\n');

    // First, create hospitals and get their IDs
    const hospitalMap = new Map();
    for (const userData of testUsers) {
      if (userData.role === 'hospital') {
        const existing = await User.findOne({ email: userData.email });
        if (existing) {
          hospitalMap.set(userData.email, existing.user_id);
          console.log(`⏭️  Hospital exists: ${userData.name}`);
          continue;
        }
        const user = new User({ ...userData });
        await user.save();
        hospitalMap.set(userData.email, user.user_id);
        console.log(`✅ Created: ${userData.name} (${userData.role})`);
      }
    }

    // Get first hospital ID for doctors (or create a default one)
    let defaultHospitalId = null;
    const firstHospital = await User.findOne({ role: 'hospital' });
    if (firstHospital) {
      defaultHospitalId = firstHospital.user_id;
    }

    // Now create patients and doctors
    for (const userData of testUsers) {
      if (userData.role === 'hospital') continue; // Already created

      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`⏭️  Skipped: ${userData.name} (already exists)`);
        continue;
      }

      // Don't hash password here - User model pre-save hook will handle it
      const user = new User({
        ...userData
      });

      if (userData.role === 'patient') {
        const family = new Family({ members: [] });
        await family.save();
        user.family_id = family.family_id;
        await Family.findOneAndUpdate(
          { family_id: family.family_id },
          { $addToSet: { members: user.user_id } }
        );
      }

      // Link doctors to hospitals
      if (userData.role === 'doctor' && defaultHospitalId) {
        user.hospital_id = defaultHospitalId;
      }

      await user.save();
      console.log(`✅ Created: ${userData.name} (${userData.role})${userData.role === 'doctor' && defaultHospitalId ? ' → Linked to hospital' : ''}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📝 TEST CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('\n👤 PATIENTS:');
    console.log('  Email: om@patient.com | Password: Patient123 (Mumbai)');
    console.log('  Email: sarah@patient.com | Password: Patient123 (Delhi)');
    console.log('  Email: rajesh@patient.com | Password: Patient123 (Noida)');
    console.log('\n👨‍⚕️ DOCTORS (All Verified):');
    console.log('  Email: sharma@doctor.com | Password: Doctor123 | Cardiologist (Mumbai)');
    console.log('  Email: verma@doctor.com | Password: Doctor123 | Dermatologist (Mumbai)');
    console.log('  Email: patel@doctor.com | Password: Doctor123 | General Physician (Noida)');
    console.log('  Email: singh@doctor.com | Password: Doctor123 | Pediatrician (Delhi)');
    console.log('  Email: mehta@doctor.com | Password: Doctor123 | Orthopedic (Pune)');
    console.log('\n🏥 HOSPITALS:');
    console.log('  Email: citygeneral@hospital.com | Password: Hospital123');
    console.log('  Email: metro@hospital.com | Password: Hospital123');
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test users created successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUsers();

