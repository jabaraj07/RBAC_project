import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserApi } from "../../service/api";
import "../../styles/auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [data, setData] = useState({
    email: "",
    password: "",
    rememberMe: false,
    loading: false,
    error: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData({
      ...data,
      [name]: type === "checkbox" ? checked : value,
      error: "", // Clear error when user starts typing
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setData((prev) => ({ ...prev, error: "" }));

    // Client-side validation
    if (!data.email || !data.password) {
      setData((prev) => ({
        ...prev,
        error: "Please fill in all fields",
      }));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      setData((prev) => ({
        ...prev,
        error: "Invalid Email format",
      }));
      return;
    }

    // Set loading state
    setData((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      // API call to backend
        const response = await UserApi.login({
          email: data.email,
          password: data.password,
        });

      // Use AuthContext to store user info and tokens
      login(
        response.data.UserData,
        {
          accessToken: response.data.AccessToken,
          refreshToken: response.data.RefreshToken,
        },
        data.rememberMe
      );

      // Redirect to dashboard after successful login
      navigate("/dashboard");
    } catch (error) {
      // Handle server error messages
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Invalid credentials. Please try again.";
      
      setData((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {data.error && (
            <div className="error-message">
              {data.error}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="Enter your email"
              disabled={data.loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pass">Password</label>
            <input
              id="pass"
              type="password"
              name="password"
              value={data.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={data.loading}
              required
            />
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={data.rememberMe}
              onChange={handleChange}
              disabled={data.loading}
            />
            <label htmlFor="rememberMe">Remember credentials</label>
          </div>

          <button type="submit" className="btn-primary" disabled={data.loading}>
            {data.loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
