const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    try {
        // Check if Firebase is already initialized
        if (admin.apps.length === 0) {
            const serviceAccount = {
                type: "service_account",
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY ? .replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: process.env.FIREBASE_AUTH_URI,
                token_uri: process.env.FIREBASE_TOKEN_URI,
                auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
                client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
            };

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.STORAGE_BUCKET,
                databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
            });

            console.log('✅ Firebase Admin SDK initialized successfully');

            // Initialize services after app initialization
            initializeServices();
        }
    } catch (error) {
        console.error('❌ Error initializing Firebase Admin SDK:', error);
        throw error;
    }
};

// Initialize Firebase services
let db, storage, auth;

// Initialize services
const initializeServices = () => {
    if (admin.apps.length > 0) {
        db = getFirestore();
        storage = getStorage();
        auth = getAuth();
        console.log('✅ Firebase services initialized');
        console.log('Database instance:', !!db);
    } else {
        console.error('❌ Firebase app not initialized');
    }
};

// Firestore collections
const COLLECTIONS = {
    USERS: 'users',
    PROFILES: 'profiles',
    MATCHES: 'matches',
    SWIPES: 'swipes',
    MESSAGES: 'messages',
    CONVERSATIONS: 'conversations',
    INTERESTS: 'interests',
    LOCATIONS: 'locations',
    PREMIUM_SUBSCRIPTIONS: 'premium_subscriptions',
    REWARDS: 'rewards',
    LEADERBOARD: 'leaderboard',
    NOTIFICATIONS: 'notifications',
    REPORTS: 'reports',
    ADMIN_LOGS: 'admin_logs',
    ANALYTICS: 'analytics'
};

// Storage buckets
const STORAGE_BUCKETS = {
    PROFILE_IMAGES: 'profile-images',
    CHAT_IMAGES: 'chat-images',
    VERIFICATION_DOCS: 'verification-docs'
};

// Function to get database instance
const getDatabase = () => {
    if (!db) {
        console.log('Database not initialized, initializing now...');
        initializeServices();
    }
    return db;
};

module.exports = {
    admin,
    get db() { return getDatabase(); },
    get storage() { return storage; },
    get auth() { return auth; },
    COLLECTIONS,
    STORAGE_BUCKETS,
    initializeFirebase,
    initializeServices,
    getDatabase
};