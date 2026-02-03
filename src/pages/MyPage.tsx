import React, { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { auth } from "../firebase";

const MyPage: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u: firebase.User | null) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="main-content">
        <h1>My Profile</h1>
        <p>No user is signed in.</p>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="profile-card" style={{ maxWidth: 720 }}>
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt={user.displayName ?? "avatar"}
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: 16,
            }}
          />
        )}

        <h1 style={{ margin: "0 0 8px 0" }}>{user.displayName ?? "Unnamed user"}</h1>
        
        <div style={{ color: "var(--text-secondary)" }}>
          <p style={{ margin: "8px 0" }}>
            <strong>Email:</strong> {user.email ?? "—"}
          </p>
          <p style={{ margin: "8px 0", wordBreak: "break-all" }}>
            <strong>UID:</strong> {user.uid}
          </p>
          <p style={{ margin: "8px 0" }}>
            <strong>Providers:</strong>{" "}
            {user.providerData && user.providerData.length > 0
              ? user.providerData.map((p) => p?.providerId).join(", ")
              : "—"}
          </p>
          <p style={{ margin: "8px 0" }}>
            <strong>Email verified:</strong> {user.emailVerified ? "Yes" : "No"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
