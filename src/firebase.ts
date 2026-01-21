// src/firebase.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth'; // Essential for FirebaseUI Auth
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration (replace with your actual values)
const firebaseConfig = {
  apiKey: "AIzaSyBlIltIs43cIXDG0Xyhn1bHPQcNVJsgefA", // Get this from your Firebase project settings
  authDomain: "codegrow-5894a.firebaseapp.com",
  projectId: "codegrow-5894a",
  storageBucket: "codegrow-5894a.firebasestorage.app",
  messagingSenderId: "717569559294",
  appId: "1:717569559294:web:724fb892509337a383b3af",
  measurementId: "G-5BJVRH8BBG"
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Initialize Firebase if it hasn't been initialized already
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export the auth instance for use with FirebaseUI
export const auth = firebase.auth();
export default app;
