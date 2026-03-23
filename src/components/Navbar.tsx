import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { auth } from "../firebase";
import { logUserClick } from "../utils/clickLogger";
import "../styles/navbar.css";
import Streak from "./Streak";

const Navbar = () => {
  const [streak, setStreak] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setDisplayName(null);
        setStreak(null);

        return;
      }

      setDisplayName(user.displayName || user.email || null);

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
            onClick={() =>
              logUserClick(auth.currentUser?.uid, {
                type: "nav_click",
                target: "home",
              })
            }
          >
            Hjem
          </NavLink>
          <NavLink
            to="/mypage"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={() =>
              logUserClick(auth.currentUser?.uid, {
                type: "nav_click",
                target: "mypage",
              })
            }
          >
            Min Side
          </NavLink>
          <NavLink
            to="/social"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={() =>
              logUserClick(auth.currentUser?.uid, {
                type: "nav_click",
                target: "social",
              })
            }
          >
            Forum
          </NavLink>
        </div>
      </div>

      <div className="nav-right">
        {displayName && (
          <>
            <Streak streak={streak} />
          </>
        )}

        <button
          onClick={() => {
            logUserClick(auth.currentUser?.uid, {
              type: "action_click",
              target: "logout",
            });
            handleLogout();
          }}
          className="logout-button"
        >
          Logg ut
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
