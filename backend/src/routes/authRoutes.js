import express from 'express';
import { register, login, createAdmin, requestPasswordReset, resetPassword, getMe, refreshToken, changePassword, updateProfile } from '../controllers/authController.js';
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
router.post('/request-password-reset', (req, res, next) => {
  // Optional authentication - if token exists, verify it
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    protect(req, res, next);
  } else {
    next();
  }
}, requestPasswordReset);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// GET /api/auth/me
router.get('/me', protect, getMe);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// POST /api/auth/change-password
router.post('/change-password', protect, changePassword);

// PUT /api/auth/profile
router.put('/profile', protect, updateProfile);

export default router;
