const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const { generateDoctorId } = require('./utils/generators');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
    createDummyDoctors();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

/**
 * Generate dummy doctors for a hospital (same logic as getMockDoctors)
 */
function generateDummyDoctorsForHospital(hospitalId, hospitalName) {
    // Indian first names
    const indianFirstNames = [
        'Rajesh', 'Priya', 'Amit', 'Anjali', 'Vikram', 'Kavita', 'Rohit', 'Neha',
        'Suresh', 'Deepika', 'Arjun', 'Meera', 'Kiran', 'Shreya', 'Nikhil', 'Pooja',
        'Manoj', 'Divya', 'Rahul', 'Swati', 'Ajay', 'Riya', 'Vishal', 'Anita'
    ];
    
    // Indian last names
    const indianLastNames = [
        'Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Reddy', 'Mehta', 'Joshi',
        'Desai', 'Shah', 'Agarwal', 'Malhotra', 'Verma', 'Iyer', 'Nair', 'Rao',
        'Chopra', 'Kapoor', 'Bansal', 'Saxena', 'Tiwari', 'Mishra', 'Pandey', 'Jain'
    ];
    
    // Specializations
    const specializations = [
        ['General Practice'],
        ['Cardiology'],
        ['Orthopedics'],
        ['Pediatrics'],
        ['Dermatology'],
        ['Neurology'],
        ['Gynecology'],
        ['Psychiatry']
    ];
    
    // Generate unique seed from hospitalId for consistent doctors
    let seed = 0;
    for (let i = 0; i < hospitalId.length; i++) {
        seed += hospitalId.charCodeAt(i);
    }
    
    const doctor1Idx = seed % indianFirstNames.length;
    const doctor2Idx = (seed + 7) % indianFirstNames.length;
    const doctor3Idx = (seed + 13) % indianFirstNames.length;
    
    const spec1Idx = seed % specializations.length;
    const spec2Idx = (seed + 3) % specializations.length;
    const spec3Idx = (seed + 5) % specializations.length;
    
    return [
        {
            name: `Dr. ${indianFirstNames[doctor1Idx]} ${indianLastNames[doctor1Idx]}`,
            email: `doctor1.${hospitalId.substring(0, 8).replace(/[^a-zA-Z0-9]/g, '')}@hospital.com`,
            specialization: specializations[spec1Idx],
            experience: 5 + (seed % 5),
            consultationFee: 500 + (seed % 5) * 100,
            qualifications: ['MBBS', 'MD'],
            hospitalAffiliation: hospitalId
        },
        {
            name: `Dr. ${indianFirstNames[doctor2Idx]} ${indianLastNames[doctor2Idx]}`,
            email: `doctor2.${hospitalId.substring(0, 8).replace(/[^a-zA-Z0-9]/g, '')}@hospital.com`,
            specialization: specializations[spec2Idx],
            experience: 7 + (seed % 4),
            consultationFee: 600 + (seed % 4) * 100,
            qualifications: ['MBBS', 'MD', 'DM'],
            hospitalAffiliation: hospitalId
        },
        {
            name: `Dr. ${indianFirstNames[doctor3Idx]} ${indianLastNames[doctor3Idx]}`,
            email: `doctor3.${hospitalId.substring(0, 8).replace(/[^a-zA-Z0-9]/g, '')}@hospital.com`,
            specialization: specializations[spec3Idx],
            experience: 9 + (seed % 3),
            consultationFee: 700 + (seed % 3) * 100,
            qualifications: ['MBBS', 'MS'],
            hospitalAffiliation: hospitalId
        }
    ];
}

/**
 * Create dummy doctors for hospitals
 */
async function createDummyDoctors() {
    try {
        console.log('🚀 Starting dummy doctor creation...\n');

        // Get all hospitals from Google Places (we'll create doctors for GP_ hospitals)
        // For now, we'll create doctors for hospitals that might be selected
        // In production, you can fetch from actual hospital list
        
        // Example: Create doctors for some common hospital IDs
        // You can modify this to fetch from actual hospital list
        const sampleHospitalIds = [
            // Add hospital IDs here if you want to pre-create doctors
            // For now, doctors will be created on-demand when hospital is selected
        ];

        // For MVP: We'll create doctors on-demand when getMockDoctors is called
        // But we can also create a script to pre-create doctors for common hospitals
        
        console.log('📝 Note: Doctors are created on-demand when hospitals are selected.');
        console.log('📝 To pre-create doctors, add hospital IDs to sampleHospitalIds array.\n');

        // If you want to pre-create doctors for specific hospitals, uncomment below:
        /*
        let created = 0;
        let skipped = 0;

        for (const hospitalId of sampleHospitalIds) {
            const doctors = generateDummyDoctorsForHospital(hospitalId, 'Hospital');
            
            for (const doctorData of doctors) {
                try {
                    // Check if user already exists
                    const existingUser = await User.findOne({ email: doctorData.email });
                    if (existingUser) {
                        console.log(`⏭️  Skipping ${doctorData.name} - already exists`);
                        skipped++;
                        continue;
                    }

                    // Create user
                    const user = new User({
                        email: doctorData.email,
                        password: 'Doctor1234!', // Default password - doctors should change this
                        role: 'doctor',
                        name: doctorData.name
                    });
                    await user.save();

                    // Create doctor profile
                    const doctorId = generateDoctorId();
                    const doctor = new Doctor({
                        userId: user._id,
                        doctorId,
                        specialization: doctorData.specialization,
                        experience: doctorData.experience,
                        consultationFee: doctorData.consultationFee,
                        qualifications: doctorData.qualifications,
                        hospitalAffiliation: doctorData.hospitalAffiliation,
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

                    console.log(`✅ Created: ${doctorData.name} (${doctorId}) for ${hospitalId}`);
                    created++;
                } catch (error) {
                    console.error(`❌ Error creating ${doctorData.name}:`, error.message);
                }
            }
        }

        console.log(`\n✅ Done! Created: ${created}, Skipped: ${skipped}`);
        */

        // Instead, update getMockDoctors to also create accounts on-demand
        console.log('💡 Tip: Doctors are returned as dummy data when hospitals are selected.');
        console.log('💡 To create real accounts, use the /api/v1/auth/register endpoint.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

