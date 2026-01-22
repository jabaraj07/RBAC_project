import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AccessDenied from "./AccessDenied";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh" 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <AccessDenied />;
  }

  return children;
};

export default AdminRoute;

