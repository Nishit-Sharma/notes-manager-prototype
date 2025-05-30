// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // If you plan to use Firebase Authentication

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyCoBu37Dr27uqKqnDWjtkCXhfeltv_0vJ0",
  authDomain: "accounting-activity-tracker.firebaseapp.com",
  projectId: "accounting-activity-tracker",
  storageBucket: "accounting-activity-tracker.firebasestorage.app",
  messagingSenderId: "786349813929",
  appId: "1:786349813929:web:62bb9fd07c5c931819f9b8",
  measurementId: "G-MGK7BBNP8K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication (optional, but recommended for user management)
const auth = getAuth(app);

export { db, auth, app }; // Export auth as well if you use it 