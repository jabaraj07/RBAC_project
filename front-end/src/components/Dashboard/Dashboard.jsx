import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Navbar/Navbar";
import "../../styles/dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isAuthenticated()) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || !isAuthenticated()) {
    return (
      <div className="loading-container">
        <div>Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome to your personal dashboard</p>
        </div>

        <div className="welcome-card">
          <h2>Welcome, {user.name}!</h2>
          <div className="user-info">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong>{" "}
              <span className={`role-badge ${user.role}`}>
                {user.role}
              </span>
            </p>
          </div>
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            {user.role === "admin" && (
              <Link to="/users" className="action-btn primary">
                View Users
              </Link>
            )}
            <Link to="/dashboard" className="action-btn secondary">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

