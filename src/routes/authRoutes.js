import express from 'express';
import { register, login, createAdmin } from '../controllers/authController.js';
import { disableAfterAdmin } from '../middleware/disableAfterAdmin.js';

const router = express.Router();

// Log all auth requests
router.use((req, res, next) => {
  console.log(`=== AUTH REQUEST: ${req.method} ${req.path} ===`);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  console.log('Request origin:', req.get('origin'));
  next();
});

// POST /api/auth/create-admin
router.post('/create-admin', disableAfterAdmin, createAdmin);

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

export default router;
