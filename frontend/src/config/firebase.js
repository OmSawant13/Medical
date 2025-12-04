// Firebase Web SDK Configuration
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzSr2jAQTdipafG5sMA4u0LkGYAPXYXyY",
  authDomain: "thw-2-3c16b.firebaseapp.com",
  projectId: "thw-2-3c16b",
  storageBucket: "thw-2-3c16b.firebasestorage.app",
  messagingSenderId: "785039409442",
  appId: "1:785039409442:web:0ae3d137f868d9b536e57b",
  measurementId: "G-YRVMFTKM02"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize Messaging (with support check)
let messaging = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export { app, analytics, db, auth, storage, messaging };
export default app;
