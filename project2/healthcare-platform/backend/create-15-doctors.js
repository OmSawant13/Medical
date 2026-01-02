const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const { generateDoctorId } = require('./utils/generators');
const connectDB = require('./src/config/database');

// 15 Indian doctors data
const doctorsData = [
    { name: 'Dr. Priya Patel', specialization: ['Neurology'], experience: 9, fee: 800 },
    { name: 'Dr. Rahul Bansal', specialization: ['Orthopedics'], experience: 7, fee: 700 },
    { name: 'Dr. Neha Joshi', specialization: ['Psychiatry'], experience: 9, fee: 700 },
    { name: 'Dr. Rajesh Sharma', specialization: ['General Practice'], experience: 8, fee: 600 },
    { name: 'Dr. Amit Kumar', specialization: ['Cardiology'], experience: 10, fee: 900 },
    { name: 'Dr. Anjali Singh', specialization: ['Pediatrics'], experience: 6, fee: 650 },
    { name: 'Dr. Vikram Gupta', specialization: ['Dermatology'], experience: 11, fee: 850 },
    { name: 'Dr. Kavita Reddy', specialization: ['Gynecology'], experience: 12, fee: 900 },
    { name: 'Dr. Suresh Desai', specialization: ['General Practice'], experience: 5, fee: 500 },
    { name: 'Dr. Deepika Shah', specialization: ['Cardiology'], experience: 9, fee: 800 },
    { name: 'Dr. Arjun Agarwal', specialization: ['Orthopedics'], experience: 8, fee: 750 },
    { name: 'Dr. Meera Malhotra', specialization: ['Pediatrics'], experience: 7, fee: 700 },
    { name: 'Dr. Rohit Mehta', specialization: ['Neurology'], experience: 10, fee: 850 },
    { name: 'Dr. Swati Saxena', specialization: ['Dermatology'], experience: 6, fee: 600 },
    { name: 'Dr. Kiran Verma', specialization: ['Psychiatry'], experience: 11, fee: 900 }
];

async function create15Doctors() {
    try {
        await connectDB();
        console.log('📋 Creating 15 Pre-defined Doctors...\n');

        const createdDoctors = [];

        for (const docData of doctorsData) {
            try {
                // Generate email from name
                const emailName = docData.name
                    .toLowerCase()
                    .replace('dr. ', '')
                    .replace(/\s+/g, '.')
                    .replace(/[^a-z.]/g, '');
                const email = `${emailName}@healthcare.com`;

                // Check if user already exists
                let user = await User.findOne({ email });
                let doctor = null;

                if (user) {
                    // User exists, check if doctor profile exists
                    doctor = await Doctor.findOne({ userId: user._id });
                    if (doctor) {
                        console.log(`⚠️  Doctor already exists: ${docData.name} (${email})`);
                        createdDoctors.push({
                            name: docData.name,
                            email: email,
                            doctorId: doctor.doctorId,
                            status: 'existing'
                        });
                        continue;
                    }
                } else {
                    // Create new user account
                    user = new User({
                        email: email,
                        password: 'Doctor1234!',
                        role: 'doctor',
                        name: docData.name
                    });
                    await user.save();
                    console.log(`✅ Created user: ${docData.name} (${email})`);
                }

                // Create doctor profile (NO hospital affiliation yet - will be assigned later)
                const doctorId = generateDoctorId();
                doctor = new Doctor({
                    userId: user._id,
                    doctorId,
                    specialization: docData.specialization,
                    experience: docData.experience,
                    consultationFee: docData.fee,
                    qualifications: ['MBBS', 'MD'],
                    hospitalAffiliation: null, // Will be assigned when hospital is selected
                    availability: {
                        monday: { available: true, startTime: '09:00', endTime: '17:00' },
                        tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
                        wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
                        thursday: { available: true, startTime: '09:00', endTime: '17:00' },
                        friday: { available: true, startTime: '09:00', endTime: '17:00' },
                        saturday: { available: true, startTime: '09:00', endTime: '13:00' },
                        sunday: { available: false, startTime: '', endTime: '' }
                    }
                });
                await doctor.save();
                console.log(`✅ Created doctor: ${docData.name} (${doctorId})`);

                createdDoctors.push({
                    name: docData.name,
                    email: email,
                    doctorId: doctorId,
                    status: 'created'
                });
            } catch (error) {
                console.error(`❌ Error creating ${docData.name}:`, error.message);
            }
        }

        console.log(`\n${'='.repeat(70)}`);
        console.log(`\n✅ Total: ${createdDoctors.length} doctors created/verified`);
        console.log('📝 Password for ALL: Doctor1234!');
        console.log('\n💡 These doctors will be assigned to hospitals when hospitals are selected');
        console.log('   15 doctors ÷ 5 hospitals = 3 doctors per hospital\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

create15Doctors();

