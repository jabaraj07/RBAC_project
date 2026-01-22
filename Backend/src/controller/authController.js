import User from "../models/User.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import jwt from "jsonwebtoken";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
