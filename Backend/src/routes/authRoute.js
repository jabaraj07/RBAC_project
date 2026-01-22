import express from "express";
import { register, login, refreshAccessToken, SendUserData } from "../controller/authController.js";
import { authenticate } from "../middleware/authenticateToken.js";
const router = express.Router();



router.post("/register", register);
router.post('/login',login);
router.post('/refresh',refreshAccessToken);
router.get('/me',authenticate,SendUserData);

export default router;
