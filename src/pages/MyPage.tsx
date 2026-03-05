import React, { useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { auth } from "../firebase";
import Badges from "../components/Badges";
import Streak from "../components/Streak";

const MyPage: React.FC = () => {
  const [user] = useState<firebase.User | null>(auth.currentUser);
  const [streak] = useState<number | null>(null);

 

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
      
        <div>
          <h1>My Profile</h1>
         
         <Streak streak={streak} />
          <p>
            
            <strong>Providers:</strong>{" "}
            {user.providerData && user.providerData.length > 0
              ? user.providerData.map((p) => p?.providerId).join(", ")
              : "—"}
          </p>
          <p>
            <strong>Email verified:</strong> {user.emailVerified ? "Yes" : "No"}
          </p>
          <p>
            <strong>User ID:</strong> {user.uid}
          </p>
          <a href="https://forms.office.com/Pages/ResponsePage.aspx?id=cgahCS-CZ0SluluzdZZ8BZ_gZpSo7_dPng7lyyEl-QpUQzBGSFdXREk3RlhaQTdIWEFJQUM1QzlZOC4u" target="_blank" rel="noopener noreferrer">
            Lenke til introduksjonsundersøkelse
          </a>
        </div>
      </div>
  
        <Badges />
     
    </div>
  );
};

export default MyPage;
