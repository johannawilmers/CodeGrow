import React, { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth } from "../firebase";
import { db } from "../firebase";
import Badges from "../components/Badges";
import NicknamePopup from "../components/NicknamePopup";


const MyPage: React.FC = () => {
  const [user] = useState<firebase.User | null>(auth.currentUser);
  const [nickname, setNickname] = useState("");
  const [loadingNickname, setLoadingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [showNicknamePopup, setShowNicknamePopup] = useState(false);

  useEffect(() => {
    const loadNickname = async () => {
      if (!user) return;

      setLoadingNickname(true);
      setNicknameError(null);

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const storedNickname =
          userDoc.exists() && typeof userDoc.data().nickname === "string"
            ? userDoc.data().nickname.trim()
            : "";
        setNickname(storedNickname);
      } catch {
        setNicknameError("Kunne ikke hente nickname.");
      } finally {
        setLoadingNickname(false);
      }
    };

    loadNickname();
  }, [user]);

  const handleSaveNickname = async (nextNickname: string) => {
    if (!user) return;

    await setDoc(
      doc(db, "users", user.uid),
      {
        nickname: nextNickname,
        nicknameUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await user.updateProfile({ displayName: nextNickname });

    setNickname(nextNickname);
    setShowNicknamePopup(false);
    setNicknameError(null);
  };


 

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

          <div className="mypage-nickname-card">
            <p>
              <strong>Kallenavn:</strong>{" "}
              {loadingNickname ? "Laster..." : nickname || "Ikke satt"}
            </p>
            {nicknameError && <p className="post-form-error">{nicknameError}</p>}
            <button type="button" onClick={() => setShowNicknamePopup(true)}>
              {nickname ? "Endre kallenavn" : "Sett kallenavn"}
            </button>
          </div>

          <a href="https://forms.office.com/Pages/ResponsePage.aspx?id=cgahCS-CZ0SluluzdZZ8BZ_gZpSo7_dPng7lyyEl-QpUQzBGSFdXREk3RlhaQTdIWEFJQUM1QzlZOC4u" target="_blank" rel="noopener noreferrer">
            Lenke til introduksjonsundersøkelse
          </a>
        </div>
      </div>
  
        <Badges />

      <NicknamePopup
        isOpen={showNicknamePopup}
        title={nickname ? "Endre kallenavn" : "Sett kallenavn"}
        description="Dette navnet brukes når du poster og kommenterer i forumet."
        initialNickname={nickname}
        submitLabel="Lagre"
        onClose={() => setShowNicknamePopup(false)}
        onSubmit={handleSaveNickname}
      />
     
    </div>
  );
};

export default MyPage;
