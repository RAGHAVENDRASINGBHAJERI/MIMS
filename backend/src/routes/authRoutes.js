import express from 'express';
import { register, login, createAdmin, requestPasswordReset, resetPassword, getMe } from '../controllers/authController.js';
import { disableAfterAdmin } from '../middleware/disableAfterAdmin.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();



// POST /api/auth/create-admin
router.post('/create-admin', disableAfterAdmin, createAdmin);

// POST /api/auth/register (Admin only)
router.post('/register', protect, authorize('admin'), register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/request-password-reset
router.post('/request-password-reset', requestPasswordReset);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// GET /api/auth/me
router.get('/me', protect, getMe);

export default router;
