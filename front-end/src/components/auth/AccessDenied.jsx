import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/accessDenied.css";

const AccessDenied = () => {
  const { user } = useAuth();

  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="access-denied-icon">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 11h-1V7c0-2.76-2.24-5-5-5S7 4.24 7 7v4H6c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2zM9 7c0-1.66 1.34-3 3-3s3 1.34 3 3v4H9V7zm9 13H6v-7h12v7z"
              fill="#dc3545"
            />
            <circle cx="12" cy="15" r="1.5" fill="#dc3545" />
          </svg>
        </div>
        <h1>Access Denied</h1>
        <p className="access-denied-message">
          You do not have permission to access this page.
        </p>
        <p className="access-denied-detail">
          This page is only accessible to administrators.
        </p>
        {user && (
          <p className="access-denied-role">
            Your current role: <span className="role-badge">{user.role}</span>
          </p>
        )}
        <div className="access-denied-actions">
          <Link to="/dashboard" className="btn-back">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;

