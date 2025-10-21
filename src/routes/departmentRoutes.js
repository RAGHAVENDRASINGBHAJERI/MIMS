import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getDepartments } from '../controllers/departmentController.js';

const router = express.Router();

router.route('/').get(protect, getDepartments);

export default router;
