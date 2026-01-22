import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/navbar.css";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated() || !user) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link to="/dashboard" className="navbar-link">
          Dashboard
        </Link>
        {user.role === "admin" && (
          <Link to="/users" className="navbar-link">
            View Users
          </Link>
        )}
      </div>
      <div className="navbar-user">
        <div className="user-info">
          <div className="user-info-content">
          <span className="user-name">{user.name}</span>
          <span className={`user-role ${user.role}`}>{user.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

