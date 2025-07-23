import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app;
let db;
let authInstance;

if (
  firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.projectId
) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    authInstance = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    console.warn("Please ensure your Firebase environment variables (VITE_FIREBASE_*) are correctly set in your .env file.");
  }
} else {
  console.warn(
    "Firebase configuration is missing or using placeholder values. " +
    "Please create a .env file with your Firebase project credentials (VITE_FIREBASE_*). " +
    "Refer to .env.example (if available) or the Firebase console."
  );
  app = null;
  db = null;
  authInstance = null;
}

export { db, authInstance as auth, app }; 