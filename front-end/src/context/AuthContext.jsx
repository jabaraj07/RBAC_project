import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isTokenExpired, getTokenExpirationTime } from "../utils/tokenUtils";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  // Clear auth state
  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    
    // Clear both storages
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("userData");
  }, []);

  // Logout function
  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  // Load auth state from storage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        // Check both storages to find existing tokens
        const localToken = localStorage.getItem("accessToken");
        const sessionToken = sessionStorage.getItem("accessToken");
        
        const token = localToken || sessionToken;
        const storedUser = 
          localStorage.getItem("userData") || 
          sessionStorage.getItem("userData");
        const storedRefreshToken = 
          localStorage.getItem("refreshToken") || 
          sessionStorage.getItem("refreshToken");
        
        // Determine rememberMe preference based on where token is stored
        if (localToken) {
          setRememberMe(true);
        }

        if (token && !isTokenExpired(token)) {
          setAccessToken(token);
          if (storedRefreshToken) {
            setRefreshToken(storedRefreshToken);
          }
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (error) {
              console.error("Error parsing user data:", error);
            }
          }
        } else if (token && isTokenExpired(token)) {
          // Token expired, clear storage
          clearAuth();
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    loadAuthState();
  }, [clearAuth]);

  // Auto-logout on token expiration
  useEffect(() => {
    if (!accessToken) return;

    const checkTokenExpiration = () => {
      if (isTokenExpired(accessToken)) {
        console.log("Token expired, logging out...");
        logout();
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Set up interval to check token expiration periodically
    const expirationTime = getTokenExpirationTime(accessToken);
    const checkInterval = Math.min(expirationTime, 60000); // Check at least every minute or when token expires

    const intervalId = setInterval(() => {
      checkTokenExpiration();
    }, checkInterval);

    // Also set a timeout for when token actually expires
    const timeoutId = setTimeout(() => {
      checkTokenExpiration();
    }, expirationTime);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [accessToken, logout]);

  // Login function
  const login = useCallback((userData, tokens, remember = false) => {
    const storage = remember ? localStorage : sessionStorage;
    
    setUser(userData);
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setRememberMe(remember);

    // Store in appropriate storage
    storage.setItem("accessToken", tokens.accessToken);
    storage.setItem("refreshToken", tokens.refreshToken);
    storage.setItem("userData", JSON.stringify(userData));

    // Clear the other storage to avoid conflicts
    if (remember) {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("userData");
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!accessToken && !isTokenExpired(accessToken);
  }, [accessToken]);

  const value = {
    user,
    accessToken,
    refreshToken,
    loading,
    rememberMe,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

