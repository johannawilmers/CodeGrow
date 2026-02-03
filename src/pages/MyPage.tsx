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
      <div >
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt={user.displayName ?? "avatar"}
          />
        )}

        <h1>{user.displayName ?? "Unnamed user"}</h1>
        
        <div>
          <p>
            <strong>Email:</strong> {user.email ?? "—"}
          </p>
         
          <p>
            <strong>Providers:</strong>{" "}
            {user.providerData && user.providerData.length > 0
              ? user.providerData.map((p) => p?.providerId).join(", ")
              : "—"}
          </p>
          <p>
            <strong>Email verified:</strong> {user.emailVerified ? "Yes" : "No"}
          </p>
        </div>
      </div>
      <div>
        <h1>Rewards</h1>
        <p>Coming soon!</p>
      </div>
    </div>
  );
};

export default MyPage;
