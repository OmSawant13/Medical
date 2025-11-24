const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Dummy hospitals data with real-world coordinates
const dummyHospitals = [
  {
    name: 'City General Hospital',
    email: 'citygeneral@hospital.com',
    password: 'Hospital123',
    role: 'hospital',
    phone: '+1-555-0101',
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
    phone: '+1-555-0102',
    hospital_id: 'HOS-METRO-001',
    address: '456 Broadway',
    city: 'New York',
    state: 'NY',
    zipCode: '10013',
    latitude: 40.7209,
    longitude: -74.0007,
    isVerified: true
  },
  {
    name: 'Central Health Hospital',
    email: 'central@hospital.com',
    password: 'Hospital123',
    role: 'hospital',
    phone: '+1-555-0103',
    hospital_id: 'HOS-CENTRAL-001',
    address: '789 Park Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10021',
    latitude: 40.7614,
    longitude: -73.9776,
    isVerified: true
  },
  {
    name: 'Riverside Medical Center',
    email: 'riverside@hospital.com',
    password: 'Hospital123',
    role: 'hospital',
    phone: '+1-555-0104',
    hospital_id: 'HOS-RIVER-001',
    address: '321 Hudson Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10014',
    latitude: 40.7282,
    longitude: -74.0076,
    isVerified: true
  },
  {
    name: 'Sunset Hospital',
    email: 'sunset@hospital.com',
    password: 'Hospital123',
    role: 'hospital',
    phone: '+1-555-0105',
    hospital_id: 'HOS-SUNSET-001',
    address: '654 5th Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10019',
    latitude: 40.7589,
    longitude: -73.9851,
    isVerified: true
  },
  {
    name: 'Greenwood Medical',
    email: 'greenwood@hospital.com',
    password: 'Hospital123',
    role: 'hospital',
    phone: '+1-555-0106',
    hospital_id: 'HOS-GREEN-001',
    address: '987 Lexington Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10065',
    latitude: 40.7736,
    longitude: -73.9566,
    isVerified: true
  },
  {
    name: 'Bayview Hospital',
    email: 'bayview@hospital.com',
    password: 'Hospital123',
    role: 'hospital',
    phone: '+1-555-0107',
    hospital_id: 'HOS-BAY-001',
    address: '147 West End Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10023',
    latitude: 40.7789,
    longitude: -73.9883,
    isVerified: true
  },
  {
    name: 'Hilltop Medical Center',
    email: 'hilltop@hospital.com',
    password: 'Hospital123',
    role: 'hospital',
    phone: '+1-555-0108',
    hospital_id: 'HOS-HILL-001',
    address: '258 Amsterdam Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10024',
    latitude: 40.7870,
    longitude: -73.9754,
    isVerified: true
  },
  {
    name: 'Downtown Emergency Hospital',
    email: 'downtown@hospital.com',
    password: 'Hospital123',
    role: 'hospital',
    phone: '+1-555-0109',
    hospital_id: 'HOS-DOWN-001',
    address: '369 Canal Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10013',
    latitude: 40.7184,
    longitude: -74.0015,
    isVerified: true
  },
  {
    name: 'Uptown Medical Center',
    email: 'uptown@hospital.com',
    password: 'Hospital123',
    role: 'hospital',
    phone: '+1-555-0110',
    hospital_id: 'HOS-UP-001',
    address: '741 Madison Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10065',
    latitude: 40.7711,
    longitude: -73.9662,
    isVerified: true
  }
];

// Dummy doctors data
const dummyDoctors = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@doctor.com',
    password: 'Doctor123',
    role: 'doctor',
    phone: '+1-555-0201',
    doctor_id: 'DOC-SJ-001',
    specialization: 'Cardiologist',
    qualification: 'MD, FACC',
    education: ['MBBS - Harvard Medical School', 'MD - Cardiology', 'Fellowship - Johns Hopkins'],
    experience: 15,
    consultationFee: 500,
    clinicName: 'Heart Care Clinic',
    address: '100 Medical Plaza',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    latitude: 40.7128,
    longitude: -74.0060,
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
    name: 'Dr. Michael Chen',
    email: 'michael.chen@doctor.com',
    password: 'Doctor123',
    role: 'doctor',
    phone: '+1-555-0202',
    doctor_id: 'DOC-MC-001',
    specialization: 'Dermatologist',
    qualification: 'MD, FAAD',
    education: ['MBBS - Stanford University', 'MD - Dermatology'],
    experience: 10,
    consultationFee: 400,
    clinicName: 'Skin Care Center',
    address: '200 Health Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10013',
    latitude: 40.7209,
    longitude: -74.0007,
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
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@doctor.com',
    password: 'Doctor123',
    role: 'doctor',
    phone: '+1-555-0203',
    doctor_id: 'DOC-ER-001',
    specialization: 'Pediatrician',
    qualification: 'MD, FAAP',
    education: ['MBBS - Columbia University', 'MD - Pediatrics'],
    experience: 12,
    consultationFee: 350,
    clinicName: 'Children\'s Health Clinic',
    address: '300 Care Boulevard',
    city: 'New York',
    state: 'NY',
    zipCode: '10021',
    latitude: 40.7614,
    longitude: -73.9776,
    consultationHours: {
      monday: { start: '08:00', end: '16:00', available: true },
      tuesday: { start: '08:00', end: '16:00', available: true },
      wednesday: { start: '08:00', end: '16:00', available: true },
      thursday: { start: '08:00', end: '16:00', available: true },
      friday: { start: '08:00', end: '16:00', available: true },
      saturday: { start: '09:00', end: '12:00', available: true },
      sunday: { start: '09:00', end: '12:00', available: false }
    },
    isVerified: true
  },
  {
    name: 'Dr. James Wilson',
    email: 'james.wilson@doctor.com',
    password: 'Doctor123',
    role: 'doctor',
    phone: '+1-555-0204',
    doctor_id: 'DOC-JW-001',
    specialization: 'Orthopedic Surgeon',
    qualification: 'MD, FACS',
    education: ['MBBS - Yale University', 'MD - Orthopedic Surgery', 'Fellowship - Mayo Clinic'],
    experience: 20,
    consultationFee: 600,
    clinicName: 'Bone & Joint Clinic',
    address: '400 Surgery Lane',
    city: 'New York',
    state: 'NY',
    zipCode: '10014',
    latitude: 40.7282,
    longitude: -74.0076,
    consultationHours: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: false },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '10:00', end: '14:00', available: true },
      sunday: { start: '10:00', end: '14:00', available: false }
    },
    isVerified: true
  },
  {
    name: 'Dr. Lisa Anderson',
    email: 'lisa.anderson@doctor.com',
    password: 'Doctor123',
    role: 'doctor',
    phone: '+1-555-0205',
    doctor_id: 'DOC-LA-001',
    specialization: 'General Physician',
    qualification: 'MD',
    education: ['MBBS - NYU Medical School', 'MD - Internal Medicine'],
    experience: 8,
    consultationFee: 300,
    clinicName: 'Family Care Clinic',
    address: '500 Wellness Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10023',
    latitude: 40.7789,
    longitude: -73.9883,
    consultationHours: {
      monday: { start: '08:00', end: '18:00', available: true },
      tuesday: { start: '08:00', end: '18:00', available: true },
      wednesday: { start: '08:00', end: '18:00', available: true },
      thursday: { start: '08:00', end: '18:00', available: true },
      friday: { start: '08:00', end: '18:00', available: true },
      saturday: { start: '09:00', end: '15:00', available: true },
      sunday: { start: '09:00', end: '15:00', available: false }
    },
    isVerified: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthlink', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing hospitals and doctors (optional - comment out if you want to keep existing data)
    // await User.deleteMany({ role: 'hospital' });
    // await User.deleteMany({ role: 'doctor' });
    // console.log('🗑️  Cleared existing hospitals and doctors');

    // Seed Hospitals
    console.log('\n🏥 Seeding Hospitals...');
    let hospitalCount = 0;
    for (const hospitalData of dummyHospitals) {
      const existingHospital = await User.findOne({ email: hospitalData.email });
      if (!existingHospital) {
        const hashedPassword = await bcrypt.hash(hospitalData.password, 10);
        const hospital = new User({
          ...hospitalData,
          password: hashedPassword
        });
        await hospital.save();
        hospitalCount++;
        console.log(`  ✅ Created: ${hospitalData.name}`);
      } else {
        console.log(`  ⏭️  Skipped (exists): ${hospitalData.name}`);
      }
    }
    console.log(`\n✅ Created ${hospitalCount} new hospitals`);

    // Seed Doctors
    console.log('\n👨‍⚕️ Seeding Doctors...');
    let doctorCount = 0;
    for (const doctorData of dummyDoctors) {
      const existingDoctor = await User.findOne({ email: doctorData.email });
      if (!existingDoctor) {
        const hashedPassword = await bcrypt.hash(doctorData.password, 10);
        const doctor = new User({
          ...doctorData,
          password: hashedPassword
        });
        await doctor.save();
        doctorCount++;
        console.log(`  ✅ Created: ${doctorData.name} (${doctorData.specialization})`);
      } else {
        console.log(`  ⏭️  Skipped (exists): ${doctorData.name}`);
      }
    }
    console.log(`\n✅ Created ${doctorCount} new doctors`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('  Hospitals: email ends with @hospital.com, password: Hospital123');
    console.log('  Doctors: email ends with @doctor.com, password: Doctor123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();

