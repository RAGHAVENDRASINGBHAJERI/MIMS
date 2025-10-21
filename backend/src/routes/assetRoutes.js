import express from 'express';
import { createAsset, getAssets, getAsset, downloadBill, updateAsset, deleteAsset, uploadMiddleware, previewBill } from '../controllers/assetController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateFileUpload } from '../middleware/security.js';

const router = express.Router();

// POST /api/assets - Create asset with file upload
router.post('/', protect, authorize('admin', 'department-officer'), uploadMiddleware, validateFileUpload, createAsset);

// GET /api/assets - Get all assets
router.get('/', protect, getAssets);

// GET /api/assets/:id - Get single asset
router.get('/:id', protect, getAsset);

// PUT /api/assets/:id - Update asset
router.put('/:id', protect, authorize('admin', 'department-officer'), uploadMiddleware, validateFileUpload, updateAsset);

// DELETE /api/assets/:id - Delete asset
router.delete('/:id', protect, authorize('admin', 'department-officer'), deleteAsset);

// GET /api/assets/:id/bill - Download bill file
router.get('/:id/bill', protect, downloadBill);

// GET /api/assets/:id/preview - Preview bill file
router.get('/:id/preview', protect, previewBill);

export default router;
