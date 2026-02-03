import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { auth } from "../firebase";
import "../styles/navbar.css";
import Streak from "./Streak";

const Navbar = () => {
  const [streak, setStreak] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setDisplayName(null);
        setStreak(null);
        setPhotoURL(null);
        return;
      }

      setDisplayName(user.displayName || user.email || null);
      setPhotoURL(user.photoURL || null);

      const userDocRef = firebase.firestore().doc(`users/${user.uid}`);
      const unsubscribeDoc = userDocRef.onSnapshot(
        (snap) => {
          const data = snap.data();
          setStreak(
            typeof data?.currentStreak === "number" ? data.currentStreak : 0
          );
        },
        (err) => {
          console.error("Navbar: user doc snapshot error", err);
          setStreak(null);
        }
      );

      return () => unsubscribeDoc();
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/mypage"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            My Page
          </NavLink>
          <NavLink
            to="/social"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Social
          </NavLink>
        </div>
      </div>

      <div className="nav-right">
        {displayName && (
          <>
            <Streak streak={streak} />

            {/* User Icon */}
            <div className="user-icon" title={displayName}>
              {photoURL ? (
                <img src={photoURL} alt="User avatar" />
              ) : (
                <div className="user-icon-fallback" aria-label="User icon">
                  {/* You can replace with SVG or emoji */}
                  👤
                </div>
              )}
            </div>
          </>
        )}

        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
