import express from 'express';
import { getPublicStats } from '../controllers/publicController.js';

const router = express.Router();

// GET /api/public/stats - Public statistics
router.get('/stats', getPublicStats);

export default router;