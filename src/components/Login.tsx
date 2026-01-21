import React, { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import { auth } from "../firebase";
import SignInScreen from "./SignInScreen";

interface Props {
  children: React.ReactNode;
}

const Login: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<firebase.User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (!currentUser) return;

      try {
        const userDocRef = firebase.firestore().doc(`users/${currentUser.uid}`);
        const userSnap = await userDocRef.get();

        const now = firebase.firestore.FieldValue.serverTimestamp();

        if (!userSnap.exists) {
          console.info(`[Login] creating user doc for uid=${currentUser.uid}`);
          await userDocRef.set(
            {
              uid: currentUser.uid,
              displayName: currentUser.displayName || null,
              email: currentUser.email || null,
              photoURL: currentUser.photoURL || null,
              providers: (currentUser.providerData || []).map((p) => p?.providerId),
              createdAt: now,
              lastLogin: now,
              // New initial task/streak fields:
              completedTasksCount: 0,
              currentStreak: 0,
              longestStreak: 0,
              lastCompletedDate: "",
            },
            { merge: true }
          );
          console.info(`[Login] user doc created for uid=${currentUser.uid}`);
        } else {
          console.info(`[Login] user doc exists for uid=${currentUser.uid}, updating lastLogin`);
          await userDocRef.update({ lastLogin: now });
          console.info(`[Login] lastLogin updated for uid=${currentUser.uid}`);
        }
      } catch (err) {
        // Firestore write may fail due to rules or network — log the full error
        console.error("[Login] Error ensuring user in Firestore:", err);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="main-content">
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  return <>{children}</>;
};

export default Login;
