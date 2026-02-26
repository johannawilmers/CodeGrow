// src/firebase.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth'; // Essential for FirebaseUI Auth
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Initialize Firebase if it hasn't been initialized already
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export the auth instance for use with FirebaseUI
export const auth = firebase.auth();
export default app;
