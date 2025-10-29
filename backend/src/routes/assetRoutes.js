import express from 'express';
import { createAsset, getAssets, getAsset, downloadBill, updateAsset, deleteAsset, updateAssetItem, deleteAssetItem, uploadMiddleware, previewBill } from '../controllers/assetController.js';
import { requestAssetUpdate, getPendingUpdates, approveAssetUpdate, rejectAssetUpdate } from '../controllers/updateRequestController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateFileUpload } from '../middleware/security.js';

const router = express.Router();

// POST /api/assets - Create asset with file upload
router.post('/', protect, authorize('admin', 'department-officer'), (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size too large. Maximum allowed size is 10MB'
        });
      }
      if (err.message === 'Only PDF files are allowed') {
        return res.status(400).json({
          success: false,
          error: 'Only PDF files are allowed for bill uploads'
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload error'
      });
    }
    next();
  });
}, validateFileUpload, createAsset);

// GET /api/assets - Get all assets
router.get('/', protect, getAssets);

// Update request routes (must come before /:id routes)
router.get('/pending-updates', protect, authorize('admin'), getPendingUpdates);

// GET /api/assets/:id - Get single asset
router.get('/:id', protect, getAsset);

// PUT /api/assets/:id - Update asset
router.put('/:id', protect, authorize('admin', 'department-officer'), (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size too large. Maximum allowed size is 10MB'
        });
      }
      if (err.message === 'Only PDF files are allowed') {
        return res.status(400).json({
          success: false,
          error: 'Only PDF files are allowed for bill uploads'
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload error'
      });
    }
    next();
  });
}, validateFileUpload, updateAsset);

// DELETE /api/assets/:id - Delete asset
router.delete('/:id', protect, authorize('admin', 'department-officer'), deleteAsset);

// GET /api/assets/:id/bill - Download bill file
router.get('/:id/bill', protect, downloadBill);

// GET /api/assets/:id/preview - Preview bill file
router.get('/:id/preview', protect, previewBill);

// PUT /api/assets/:id/items - Update specific item
router.put('/:id/items', protect, authorize('admin', 'department-officer'), updateAssetItem);

// DELETE /api/assets/:id/items - Delete specific item
router.delete('/:id/items', protect, authorize('admin', 'department-officer'), deleteAssetItem);

// Update request routes (remaining routes)
router.post('/:id/request-update', protect, authorize('department-officer'), requestAssetUpdate);
router.post('/:id/approve-update', protect, authorize('admin'), approveAssetUpdate);
router.post('/:id/reject-update', protect, authorize('admin'), rejectAssetUpdate);

export default router;
