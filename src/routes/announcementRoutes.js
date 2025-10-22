import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement
} from '../controllers/announcementController.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin'), createAnnouncement);
router.get('/', getAnnouncements);
router.delete('/:id', authorize('admin'), deleteAnnouncement);

export default router;