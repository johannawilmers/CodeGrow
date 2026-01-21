import { NavLink, Link } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import "./Navbar.css";

const Navbar = () => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="navbar">
      {/* Left side: Navigation links */}
      <div className="nav-links">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Home
        </NavLink>
        <span className="divider">|</span>
        <NavLink
          to="/mypage"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          My Page
        </NavLink>
        <span className="divider">|</span>
        <NavLink
          to="/social"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Social
        </NavLink>
      </div>

      {/* Right side: Logout button */}
      <button
        onClick={handleLogout}
        className="logout-button"
      >
        Logout
      </button>
    </nav>
  );
};

export default Navbar;




