import User from "../models/User.js";
import jwt from "jsonwebtoken";


export const authenticate = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Not authorized to access this route" });
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ message: "Not authorized to access this route" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res
      .status(401)
      .json({ message: "Not authorized to access this route" });
  }
};