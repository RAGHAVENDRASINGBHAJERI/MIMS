import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController.js';
import { getAssets, createAsset, updateAsset, deleteAsset, uploadMiddleware } from '../controllers/assetController.js';
import { getAuditLogs, getDatabaseStats, getAllUsers as getAdminUsers, getAllAssets as getAdminAssets, getPasswordResetRequests, approvePasswordReset, rejectPasswordReset } from '../controllers/adminController.js';
import { validateFileUpload } from '../middleware/security.js';
import seedDepartments from '../../seedDepartments.js';
import seedUsers from '../../seedUsers.js';
import seedAssets from '../../seedAssets.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Admin-only database access routes
router.get('/audit-logs', getAuditLogs);
router.get('/database-stats', getDatabaseStats);
router.get('/all-users', getAdminUsers);
router.get('/all-assets', getAdminAssets);
router.get('/password-reset-requests', getPasswordResetRequests);
router.post('/password-reset-requests/:requestId/approve', approvePasswordReset);
router.post('/password-reset-requests/:requestId/reject', rejectPasswordReset);

// User management routes
router.route('/users')
  .get(getAllUsers)
  .post(createUser);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

// Department management routes
router.route('/departments')
  .get(getDepartments)
  .post(createDepartment);

router.route('/departments/:id')
  .put(updateDepartment)
  .delete(deleteDepartment);

// Asset management routes
router.route('/assets')
  .get(getAssets)
  .post(uploadMiddleware, validateFileUpload, createAsset);

router.route('/assets/:id')
  .put(uploadMiddleware, validateFileUpload, updateAsset)
  .delete(deleteAsset);

// Data seeding route
router.post('/seed', async (req, res) => {
  try {
    console.log('Starting data seeding...');

    // Seed departments
    console.log('Seeding departments...');
    await seedDepartments();

    // Seed users
    console.log('Seeding users...');
    await seedUsers();

    // Seed assets
    console.log('Seeding assets...');
    await seedAssets();

    res.json({
      success: true,
      message: 'Data seeding completed successfully'
    });
  } catch (error) {
    console.error('Error during data seeding:', error);
    res.status(500).json({
      success: false,
      error: 'Data seeding failed',
      details: error.message
    });
  }
});

export default router;
