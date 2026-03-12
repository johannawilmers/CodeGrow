import React, { useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { auth } from "../firebase";
import Badges from "../components/Badges";


const MyPage: React.FC = () => {
  const [user] = useState<firebase.User | null>(auth.currentUser);


 

  if (!user) {
    return (
      <div className="main-content">
        <h1>Min profil</h1>
        <p>Ingen bruker er innlogget.</p>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div >
      
        <div>
          <h1>Min profil</h1>
    
          
          <p>
            <strong>Email verifisert:</strong> {user.emailVerified ? "Yes" : "No"}
          </p>
          <p>
            <strong>Bruker ID:</strong> {user.uid}
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
