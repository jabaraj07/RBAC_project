import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/navbar.css";
import { UserApi } from "../../service/api";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async() => {
    // Get refresh token from both storages (same logic as api.js)
    const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");
    
    try {
      // Try to invalidate token on server
      if (refreshToken) {
        await UserApi.logout(refreshToken);
      }
    } catch (error) {
      // Even if API call fails, we still logout locally
      // This ensures user is logged out even if server is unreachable
      console.error("Error invalidating token on server:", error);
    } finally {
      // Always clear local auth state and redirect
      // This ensures logout happens even if API call fails
      logout();
      navigate("/login");
    }
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

