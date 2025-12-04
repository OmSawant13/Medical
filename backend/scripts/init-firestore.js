const admin = require('firebase-admin');
const serviceAccount = require('../firebase-credentials.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'thw-2-3c16b'
});

const db = admin.firestore();

async function initializeFirestore() {
  console.log('\n🔥 INITIALIZING FIRESTORE COLLECTIONS\n');
  console.log('='.repeat(70));

  try {
    // Collection 1: vitalSigns
    console.log('\n1️⃣  Creating vitalSigns collection...');
    await db.collection('vitalSigns').doc('P001').set({
      patientId: 'P001',
      patientName: 'John Doe',
      systolic: 120,
      diastolic: 80,
      heartRate: 75,
      temperature: 98.6,
      spo2: 98,
      timestamp: new Date().toISOString(),
      status: 'normal',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ Sample vital signs created for P001');

    await db.collection('vitalSigns').doc('P002').set({
      patientId: 'P002',
      patientName: 'Jane Smith',
      systolic: 130,
      diastolic: 85,
      heartRate: 80,
      temperature: 98.4,
      spo2: 97,
      timestamp: new Date().toISOString(),
      status: 'normal',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ Sample vital signs created for P002');

    // Collection 2: alerts
    console.log('\n2️⃣  Creating alerts collection...');
    await db.collection('alerts').add({
      patientId: 'P001',
      type: 'CRITICAL_VITALS',
      severity: 'high',
      alerts: ['Test alert - System initialization'],
      vitalSigns: {
        systolic: 120,
        diastolic: 80,
        heartRate: 75
      },
      timestamp: new Date().toISOString(),
      status: 'resolved',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ Sample alert created');

    // Collection 3: patients (for real-time sync)
    console.log('\n3️⃣  Creating patients collection...');
    await db.collection('patients').doc('P001').set({
      patientId: 'P001',
      name: 'John Doe',
      email: 'patient1@test.com',
      age: 35,
      role: 'patient',
      lastSync: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });
    console.log('   ✅ Patient P001 created');

    await db.collection('patients').doc('P002').set({
      patientId: 'P002',
      name: 'Jane Smith',
      email: 'patient2@test.com',
      age: 28,
      role: 'patient',
      lastSync: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });
    console.log('   ✅ Patient P002 created');

    // Collection 4: notifications
    console.log('\n4️⃣  Creating notifications collection...');
    await db.collection('notifications').add({
      userId: 'P001',
      type: 'system',
      title: 'Welcome to Scanlytics',
      message: 'Your account has been set up successfully',
      read: false,
      timestamp: new Date().toISOString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ Sample notification created');

    // Collection 5: appointments (real-time sync)
    console.log('\n5️⃣  Creating appointments collection...');
    await db.collection('appointments').add({
      patientId: 'P001',
      doctorName: 'Dr. Sarah Johnson',
      date: '2024-12-15',
      time: '10:00 AM',
      type: 'General Checkup',
      status: 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ Sample appointment created');

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ FIRESTORE INITIALIZATION COMPLETE!\n');
    console.log('📊 Collections created:');
    console.log('   1. vitalSigns - Real-time patient vitals');
    console.log('   2. alerts - Emergency alerts');
    console.log('   3. patients - Patient profiles');
    console.log('   4. notifications - User notifications');
    console.log('   5. appointments - Appointment scheduling\n');
    console.log('🔗 View in Firebase Console:');
    console.log('   https://console.firebase.google.com/project/thw-2-3c16b/firestore\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error initializing Firestore:', error.message);
    console.error('\nMake sure Firestore is enabled in Firebase Console:');
    console.error('https://console.firebase.google.com/project/thw-2-3c16b/firestore\n');
    process.exit(1);
  }
}

initializeFirestore();
