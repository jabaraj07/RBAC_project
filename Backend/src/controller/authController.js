import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import jwt from "jsonwebtoken";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper function to save refresh token to database
const saveRefreshToken = async (userId, token) => {
  try {
    // Decode token to get expiration
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      throw new Error("Invalid token format");
    }
    
    const expiresAt = new Date(decoded.exp * 1000);

    // PURPOSE: Prevents token accumulation when user logs in from multiple devices

    const userTokens = await RefreshToken.find({ user: userId }).sort({ createdAt: -1 });
    if (userTokens.length >= 5) {
      // Keep first 5 (newest), delete the rest (older tokens)
      const tokensToDelete = userTokens.slice(5); // Skip first 5, get the rest
      const tokenIdsToDelete = tokensToDelete.map(t => t._id);
      await RefreshToken.deleteMany({ _id: { $in: tokenIdsToDelete } });
    }

    // Save refresh token
    const refreshTokenDoc = new RefreshToken({
      token,
      user: userId,
      expiresAt,
    });

    await refreshTokenDoc.save();
    return refreshTokenDoc;
  } catch (error) {
    // If duplicate token error (shouldn't happen with JWT, but handle it)
    if (error.code === 11000) {
      console.warn("Duplicate refresh token detected, skipping save");
      return null;
    }
    console.error("Error saving refresh token:", error);
    throw error;
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Required field missing.." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password length must be greater then 6" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const saltRouds = 11;
    const hashPassword = await bcrypt.hash(password, saltRouds);

    const userCount = await User.countDocuments();

    let assignedRole;

    if (userCount === 0) {
      assignedRole = "admin";
    } else {
      assignedRole = role || "user";
    }

    const UserExist = await User.findOne({ email });

    if (UserExist) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = new User({
      name,
      email,
      password: hashPassword,
      role: assignedRole,
    });

    await user.save();
    const { accessToken, refreshToken } = generateToken(user);
    
    // Save refresh token to database
    await saveRefreshToken(user._id, refreshToken);
    
    res.status(201).json({
      message: "User registered successfully",
      UserData: user,
      AccessToken: accessToken,
      RefreshToken: refreshToken,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Required field missing.." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User Not exists" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Password Not Match" });
    }

    const { accessToken, refreshToken } = generateToken(user);
    
    // Save refresh token to database
    await saveRefreshToken(user._id, refreshToken);

    res.status(200).json({
      message: "Login credential verified successfully",
      UserData: user,
      AccessToken: accessToken,
      RefreshToken: refreshToken,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify token signature
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if token exists in database (not revoked)
    const tokenDoc = await RefreshToken.findOne({ 
      token: refreshToken,
      user: decoded.id 
    });

    if (!tokenDoc) {
      return res.status(403).json({ message: "Refresh token not found or has been revoked" });
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new access token
    const { accessToken } = generateToken(user);

    res.status(200).json({
      AccessToken: accessToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const SendUserData = async (req, res) => {
  const { user } = req;
  if (!user) {
    return res.status(401).json({ message: "User not authorize" });
  }
  res.status(200).json({
    message: "User is authenticated",
    UserData: user,
  });
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    // Verify token to get user ID
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      // Token is invalid or expired, but we still return success
      // This prevents token enumeration attacks
      return res.status(200).json({ message: "Logged out successfully" });
    }

    // Delete the refresh token from database
    const deletedToken = await RefreshToken.findOneAndDelete({ 
      token: refreshToken,
      user: decoded.id 
    });

    // Optionally: Delete all refresh tokens for this user (for security)
    // Uncomment the line below if you want to invalidate all user sessions on logout
    // await RefreshToken.deleteMany({ user: decoded.id });

    res.status(200).json({ 
      message: "Logged out successfully",
      success: true 
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
