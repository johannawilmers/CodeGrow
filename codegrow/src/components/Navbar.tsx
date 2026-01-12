import { NavLink } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
        Home
      </NavLink>
      <span className="divider">|</span>
      <NavLink to="/about" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
        About
      </NavLink>
      <span className="divider">|</span>
      <NavLink to="/mypage" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
        My Page
      </NavLink>
      <span className="divider">|</span>
      <NavLink to="/social" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
        Social
      </NavLink>
    </nav>
  );
};

export default Navbar;
