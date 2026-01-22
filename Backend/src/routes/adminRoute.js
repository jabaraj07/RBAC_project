import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/authenticateToken.js';
import { getAllUsers } from '../controller/userController.js';
import { authorize } from '../middleware/authorize.js';

router.get('/',authenticate, authorize('admin'),getAllUsers)

export default router;