import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController.js';

const router = express.Router();

router.route('/').get(protect, getDepartments).post(protect, adminOnly, createDepartment);
router.route('/:id').put(protect, adminOnly, updateDepartment).delete(protect, adminOnly, deleteDepartment);

export default router;
