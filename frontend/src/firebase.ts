// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhheOLEZF9bdHPyJl0At8p670irpL_dUY",
  authDomain: "scanlytics-e644a.firebaseapp.com",
  projectId: "scanlytics-e644a",
  storageBucket: "scanlytics-e644a.firebasestorage.app",
  messagingSenderId: "648311850691",
  appId: "1:648311850691:web:f76a3d40f6a8de101c8476",
  measurementId: "G-G0P602R0MV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, analytics };
export default app;
