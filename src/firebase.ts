import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBlIltIs43cIXDG0Xyhn1bHPQcNVJsgefA",
  authDomain: "codegrow-5894a.firebaseapp.com",
  projectId: "codegrow-5894a",
  storageBucket: "codegrow-5894a.firebasestorage.app",
  messagingSenderId: "717569559294",
  appId: "1:717569559294:web:724fb892509337a383b3af",
  measurementId: "G-5BJVRH8BBG"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);

    // Optionally export other services
    // export const auth = getAuth(app);

export default app;
