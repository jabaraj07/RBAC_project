import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Landing = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated && isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, redirect to login
  return <Navigate to="/login" replace />;
};

export default Landing;

