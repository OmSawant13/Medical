const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase Admin SDK configuration
const firebaseConfig = {
  projectId: "thw-2-3c16b",
};

let firebaseInitialized = false;
let firebaseAvailable = false;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    return admin;
  }

  try {
    // Try to load service account from file
    const serviceAccountPath = path.join(__dirname, '../firebase-credentials.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
      firebaseAvailable = true;
      console.log('✅ Firebase Admin initialized with service account');
    } else {
      // Initialize without credentials (limited functionality)
      console.log('⚠️  Firebase service account not found');
      console.log('   Download from: https://console.firebase.google.com/project/thw-2-3c16b/settings/serviceaccounts/adminsdk');
      console.log('   Save as: backend/firebase-credentials.json');
      firebaseAvailable = false;
    }

    firebaseInitialized = true;
    return admin;
  } catch (error) {
    console.log('⚠️  Firebase initialization error:', error.message);
    firebaseAvailable = false;
    return null;
  }
};

// Firestore helper functions
const getFirestore = () => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  if (!firebaseAvailable) {
    return null;
  }
  return admin.firestore();
};

// Real-time database helper
const getDatabase = () => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  if (!firebaseAvailable) {
    return null;
  }
  return admin.database();
};

// Firebase Cloud Messaging helper
const getMessaging = () => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  if (!firebaseAvailable) {
    return null;
  }
  return admin.messaging();
};

// Check if Firebase is available
const isFirebaseAvailable = () => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return firebaseAvailable;
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getDatabase,
  getMessaging,
  isFirebaseAvailable,
  admin
};
