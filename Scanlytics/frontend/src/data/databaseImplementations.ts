export interface DatabaseImplementation {
  title: string;
  description: string;
  realWorldUse: string[];
  concepts: string[];
  demo: string;
}

export const databaseImplementations: { [key: string]: DatabaseImplementation } = {
  mongodb: {
    title: '🍃 MongoDB - Aggregation & Analytics',
    description: 'Advanced healthcare data analytics with MongoDB aggregation pipelines',
    realWorldUse: [
      '📊 Patient cohort analysis - group by demographics, conditions, outcomes',
      '💊 Drug efficacy studies - aggregate treatment success rates',
      '🏥 Hospital performance metrics - real-time operational dashboards',
      '�� Predictive analytics - identify at-risk patients for preventive care'
    ],
    concepts: [
      'Aggregation Pipelines - $match, $group, $project, $lookup, $unwind',
      'GridFS - Medical image storage (X-rays, MRIs, CT scans up to 16MB+)',
      'Sharding - Horizontal scaling for 100M+ patient records across clusters',
      'Change Streams - Real-time data synchronization and event triggering'
    ],
    demo: `=== MONGODB HEALTHCARE ANALYTICS ===

📊 Sample Patient Collection:
db.patients.insertMany([
  { "_id": "P001", "age": 25, "condition": "Hypertension", "visits": 5, "status": "active" },
  { "_id": "P002", "age": 45, "condition": "Diabetes", "visits": 8, "status": "active" },
  { "_id": "P003", "age": 15, "condition": "Asthma", "visits": 3, "status": "active" },
  { "_id": "P004", "age": 70, "condition": "Heart Disease", "visits": 12, "status": "active" },
  { "_id": "P005", "age": 35, "condition": "Migraine", "visits": 4, "status": "active" }
])

🔍 Advanced Aggregation Pipeline:

db.patients.aggregate([
  // Stage 1: Match active patients (last 90 days)
  {
    $match: {
      status: "active",
      lastVisit: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    }
  },
  
  // Stage 2: Add computed age group field
  {
    $addFields: {
      ageGroup: {
        $switch: {
          branches: [
            { case: { $lt: ["$age", 18] }, then: "Child" },
            { case: { $lt: ["$age", 40] }, then: "Adult" },
            { case: { $lt: ["$age", 65] }, then: "Middle Age" }
          ],
          default: "Senior"
        }
      },
      daysSinceLastVisit: {
        $divide: [
          { $subtract: [new Date(), "$lastVisit"] },
          1000 * 60 * 60 * 24
        ]
      }
    }
  },
  
  // Stage 3: Group by age group with aggregations
  {
    $group: {
      _id: "$ageGroup",
      totalPatients: { $sum: 1 },
      avgAge: { $avg: "$age" },
      totalVisits: { $sum: "$visits" },
      avgDaysSinceVisit: { $avg: "$daysSinceLastVisit" },
      commonConditions: { $push: "$condition" }
    }
  },
  
  // Stage 4: Sort by patient count descending
  { $sort: { totalPatients: -1 } },
  
  // Stage 5: Project final output format
  {
    $project: {
      ageGroup: "$_id",
      totalPatients: 1,
      avgAge: { $round: ["$avgAge", 0] },
      totalVisits: 1,
      avgDaysSinceVisit: { $round: ["$avgDaysSinceVisit", 1] },
      _id: 0
    }
  }
])

✅ AGGREGATION RESULTS:

Age Group Analysis:
┌─────────────┬──────────────┬─────────┬─────────────┬──────────────────────┐
│ Age Group   │ Patient Count│ Avg Age │ Total Visits│ Avg Days Since Visit │
├─────────────┼──────────────┼─────────┼─────────────┼──────────────────────┤
│ Adult       │      2       │   30    │      9      │         15.5         │
│ Senior      │      1       │   70    │     12      │         8.0          │
│ Middle Age  │      1       │   45    │      8      │         20.0         │
│ Child       │      1       │   15    │      3      │         45.0         │
└─────────────┴──────────────┴─────────┴─────────────┴──────────────────────┘

📂 GridFS Medical Image Storage:

const { GridFSBucket } = require('mongodb');

// Initialize GridFS bucket for medical images
const bucket = new GridFSBucket(db, {
  bucketName: 'medicalImages',
  chunkSizeBytes: 255 * 1024 // 255KB chunks (optimal for MongoDB)
});

// Upload X-ray DICOM file
const uploadStream = bucket.openUploadStream('patient_P001_xray_chest.dcm', {
  metadata: {
    patientId: 'P001',
    scanType: 'X-Ray',
    bodyPart: 'Chest',
    timestamp: new Date(),
    radiologist: 'Dr. Smith',
    department: 'Radiology',
    fileSize: '45MB',
    aiAnalysisStatus: 'pending',
    tags: ['routine-checkup', 'chest', 'diagnostic']
  }
});

fileStream.pipe(uploadStream);

uploadStream.on('finish', () => {
  console.log('✅ X-ray uploaded successfully!');
  console.log('   File ID:', uploadStream.id);
  console.log('   Stored in 176 chunks (255KB each)');
});

// Retrieve image for AI analysis
const downloadStream = bucket.openDownloadStreamByName('patient_P001_xray_chest.dcm');
downloadStream.pipe(fs.createWriteStream('./analysis_queue/P001_xray.dcm'));

✅ Image Storage Complete:
   📁 File: patient_P001_xray_chest.dcm
   💾 Size: 45MB (stored in 176 x 255KB chunks)
   🔍 Retrievable by: filename, file ID, or metadata query
   ⚡ Stream download: 2.3 seconds

🔀 Sharding for Scalability:

// Enable sharding on patients collection
sh.enableSharding("healthcareDB")

sh.shardCollection("healthcareDB.patients", { "patientId": "hashed" })

// Result: Data distributed across 10 shard nodes
// Query performance: 45ms average (vs 2.3s unsharded)

📡 Change Streams for Real-time Sync:

const changeStream = db.collection('vitalSigns').watch([
  { $match: { "operationType": "insert" } }
]);

changeStream.on('change', (change) => {
  const vitals = change.fullDocument;
  
  // Check for critical conditions
  if (vitals.systolic > 180 || vitals.diastolic > 110) {
    // Trigger emergency alert
    triggerEmergencyAlert(vitals.patientId, vitals);
  }
  
  // Update real-time dashboard
  io.emit('vitalUpdate', vitals);
});

✅ Real-time monitoring active on 1,250 patients

📈 Performance Metrics:
  • Aggregation Pipeline: 120ms for 100K patient records
  • GridFS Upload: 2.3s for 50MB DICOM file (streaming)
  • GridFS Download: 1.8s for 50MB file retrieval
  • Sharded Query: 45ms across 10 nodes (10M records)
  • Change Stream Latency: <100ms event notification
  • Index Scan: 8ms on 5M indexed documents

💡 Real-world Impact:
  ✓ Analyze millions of patient records in seconds
  ✓ Store unlimited medical images with rich metadata
  ✓ Real-time dashboards for hospital administrators
  ✓ Predictive analytics for preventive care programs
  ✓ Horizontal scaling to 100M+ patient records`
  },

  firebase: {
    title: '🔥 Firebase - Real-time Synchronization',
    description: 'Real-time healthcare notifications, data sync, and serverless functions',
    realWorldUse: [
      '⚡ Real-time patient monitoring - vital signs updates every 5 seconds',
      '🚨 Emergency alerts - instant push notifications to on-call doctors',
      '💬 Doctor-patient messaging - HIPAA-compliant secure chat',
      '📱 Mobile app sync - offline support with automatic data synchronization'
    ],
    concepts: [
      'Firestore Real-time Listeners - onSnapshot() for live data updates',
      'Cloud Functions - Serverless backend logic and automated workflows',
      'Firebase Cloud Messaging - Push notifications to iOS/Android/Web',
      'Security Rules - Fine-grained access control and data validation'
    ],
    demo: `=== FIREBASE REAL-TIME HEALTHCARE SYSTEM ===

📊 Firestore Data Model Structure:

patients/{patientId}
  ├─ personalInfo: { name, age, gender, insurance, ssn }
  ├─ vitalSigns: { systolic, diastolic, heartRate, temp, spo2, timestamp }
  ├─ medications: [ { name, dosage, frequency, startDate }, ... ]
  ├─ appointments: [ { doctorId, date, type, status }, ... ]
  └─ medicalHistory: { allergies: [], conditions: [], surgeries: [] }

doctors/{doctorId}
  ├─ profile: { name, specialization, license, availability }
  ├─ patients: [ patientId1, patientId2, ... ]
  └─ notifications: [ { type, message, timestamp, read }, ... ]

🔄 Real-time Patient Vital Signs Monitoring:

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// Setup real-time listener for patient vitals
const patientRef = doc(db, 'patients', 'P001');

const unsubscribe = onSnapshot(patientRef, (snapshot) => {
  if (!snapshot.exists()) return;
  
  const data = snapshot.data();
  const vitals = data.vitalSigns;
  
  console.log('📊 Real-time Vitals Update:');
  console.log(\`   BP: \${vitals.systolic}/\${vitals.diastolic} mmHg\`);
  console.log(\`   HR: \${vitals.heartRate} bpm\`);
  console.log(\`   Temp: \${vitals.temp}°F\`);
  console.log(\`   SpO2: \${vitals.spo2}%\`);
  console.log(\`   ⏱️  Updated: \${new Date(vitals.timestamp).toLocaleTimeString()}\`);
  
  // Check for critical conditions
  if (vitals.systolic > 180 || vitals.diastolic > 110) {
    console.log('🚨 CRITICAL: Severe Hypertension Detected!');
    
    // Trigger emergency alert system
    sendEmergencyAlert({
      type: 'CRITICAL_VITALS',
      patientId: 'P001',
      condition: 'Severe Hypertension',
      vitals: vitals,
      priority: 1
    });
  }
  
  if (vitals.heartRate < 50 || vitals.heartRate > 120) {
    console.log('⚠️  WARNING: Abnormal Heart Rate!');
    notifyNurseStation('P001', 'Abnormal HR: ' + vitals.heartRate);
  }
  
  // Update real-time dashboard
  updatePatientDashboard(data);
});

✅ Real-time Monitoring Active:
   📍 Patient P001 - John Smith
   📊 Current Vitals:
      BP: 140/90 mmHg (Normal)
      HR: 85 bpm (Normal)
      Temp: 98.6°F (Normal)
      SpO2: 98% (Normal)
   ✅ All vitals within normal range
   ⚡ Last update: 2 seconds ago
   🔄 Auto-refresh enabled

🚨 Emergency Alert System (Cloud Functions):

// Cloud Function triggered on alert creation
exports.sendEmergencyAlert = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    const { patientId, type, condition, vitals, priority } = alert;
    
    console.log(\`🚨 Processing Emergency Alert: \${alertId}\`);
    
    // Get on-call doctor
    const onCallDoctor = await getOnCallDoctor();
    
    // Send push notification
    await admin.messaging().send({
      token: onCallDoctor.deviceToken,
      notification: {
        title: '🚨 CRITICAL PATIENT ALERT',
        body: \`Patient \${patientId}: \${condition}\`,
        sound: 'emergency_alert.wav'
      },
      data: {
        type: 'emergency',
        patientId: patientId,
        vitals: JSON.stringify(vitals),
        priority: priority.toString(),
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'emergency_alerts',
          priority: 'max'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'emergency_alert.wav',
            badge: 1,
            'interruption-level': 'critical'
          }
        }
      }
    });
    
    // Log to audit trail
    await db.collection('auditLogs').add({
      event: 'emergency_alert_sent',
      alertId: context.params.alertId,
      patientId: patientId,
      doctorId: onCallDoctor.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: alert
    });
    
    // Update patient status
    await db.collection('patients').doc(patientId).update({
      'status.emergencyAlert': true,
      'status.lastAlertTimestamp': admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Emergency alert sent successfully');
    return { success: true, doctorNotified: onCallDoctor.id };
  });

✅ Alert Processing Complete:
   📱 Dr. Sarah Smith notified
   ⏱️  Response time: 1.2 seconds
   ✓ Push notification delivered
   ✓ Audit log created
   ✓ Patient status updated

🤖 AI Medical Scan Analysis Integration:

// Cloud Function for AI-powered scan analysis
exports.analyzeMedicalScan = functions.https.onCall(
  async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }
    
    const { scanId, scanType, patientId } = data;
    
    console.log(\`🔍 Starting AI analysis for scan: \${scanId}\`);
    console.log(\`   Type: \${scanType}\`);
    console.log(\`   Patient: \${patientId}\`);
    
    // Get scan image from Cloud Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(\`scans/\${scanId}.dcm\`);
    
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000 // 15 minutes
    });
    
    // Call AI model endpoint
    const aiStartTime = Date.now();
    const aiResult = await fetch('https://ai-api.scanlytics.com/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: signedUrl,
        scanType: scanType,
        priority: 'high',
        modelVersion: 'v3.2'
      })
    }).then(res => res.json());
    
    const aiProcessingTime = ((Date.now() - aiStartTime) / 1000).toFixed(2);
    
    console.log(\`✅ AI Analysis Complete in \${aiProcessingTime}s\`);
    console.log(\`   Findings: \${aiResult.findings}\`);
    console.log(\`   Confidence: \${aiResult.confidence}%\`);
    
    // Store results in Firestore
    const analysisDoc = await db.collection('aiAnalysisResults').add({
      scanId: scanId,
      patientId: patientId,
      scanType: scanType,
      findings: aiResult.findings,
      confidence: aiResult.confidence,
      processingTime: parseFloat(aiProcessingTime),
      modelVersion: 'v3.2',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed',
      reviewRequired: aiResult.confidence < 85
    });
    
    // Notify radiologist if review required
    if (aiResult.confidence < 85) {
      await notifyRadiologist(patientId, analysisDoc.id);
    }
    
    return {
      success: true,
      analysisId: analysisDoc.id,
      findings: aiResult.findings,
      confidence: aiResult.confidence,
      processingTime: aiProcessingTime
    };
  }
);

✅ AI Analysis Results:
   🔍 Scan Type: Chest X-Ray
   🧠 AI Model: v3.2 (TensorFlow)
   ⚡ Processing Time: 2.3 seconds
   ✓ Findings: No acute abnormalities detected
   📊 Confidence Score: 96.8%
   ✅ Review Status: Approved (high confidence)
   💾 Results stored in Firestore

📱 Firebase Cloud Messaging - Push Notifications:

// Send appointment reminder
await admin.messaging().sendMulticast({
  tokens: [patient.deviceToken],
  notification: {
    title: '📅 Appointment Reminder',
    body: 'You have an appointment with Dr. Smith tomorrow at 10:00 AM'
  },
  data: {
    type: 'appointment_reminder',
    appointmentId: 'APT_12345',
    doctorId: 'DOC_789'
  }
});

✅ Notification Sent:
   📱 Device: iPhone 14 Pro
   ⏱️  Delivery time: 2.1 seconds
   ✓ Delivered successfully

🔒 Security Rules Example:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Patients can only read their own data
    match /patients/{patientId} {
      allow read: if request.auth != null && 
                     request.auth.uid == patientId;
      allow write: if false; // Only via Cloud Functions
    }
    
    // Doctors can read their assigned patients
    match /patients/{patientId} {
      allow read: if request.auth != null && 
                     hasAccess(request.auth.uid, patientId);
    }
    
    // Helper function
    function hasAccess(doctorId, patientId) {
      return exists(/databases/$(database)/documents/doctors/$(doctorId)/patients/$(patientId));
    }
  }
}

📈 Performance Metrics:
  • Real-time Listener Latency: 45-120ms (data to UI)
  • Cloud Function Cold Start: 1.2s (first invocation)
  • Cloud Function Warm Start: 95ms (subsequent calls)
  • Push Notification Delivery: 2.1s average worldwide
  • Firestore Read/Write: 20-50ms average
  • Offline Sync: Automatic on network reconnect
  • Data Transfer: <100KB per patient update

💡 Real-world Impact:
  ✓ Instant alerts save lives in critical emergencies
  ✓ Doctors access patient data from anywhere, anytime
  ✓ Real-time collaboration between medical specialists
  ✓ Mobile apps work offline, automatically sync online
  ✓ HIPAA-compliant secure data transmission
  ✓ Scalable to millions of concurrent users`
  }
};
