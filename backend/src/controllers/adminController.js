import Asset from '../models/Asset.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import AuditLog from '../models/AuditLog.js';
import PasswordReset from '../models/PasswordReset.js';
import PasswordResetRequest from '../models/PasswordResetRequest.js';
import crypto from 'crypto';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, entityType, userId } = req.query;
    
    const filterQuery = {};
    if (action) filterQuery.action = action;
    if (entityType) filterQuery.entityType = entityType;
    if (userId) filterQuery.userId = userId;

    const skip = (page - 1) * limit;
    const logs = await AuditLog.find(filterQuery)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalLogs = await AuditLog.countDocuments(filterQuery);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalLogs / limit),
          totalLogs
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDatabaseStats = async (req, res, next) => {
  try {
    const [assetCount, userCount, departmentCount, auditLogCount, passwordResetCount, passwordResetRequestCount] = await Promise.all([
      Asset.countDocuments(),
      User.countDocuments(),
      Department.countDocuments(),
      AuditLog.countDocuments(),
      PasswordReset.countDocuments(),
      PasswordResetRequest.countDocuments()
    ]);

    const assetsByType = await Asset.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const recentActivity = await AuditLog.find()
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(10);

    const pendingPasswordResets = await PasswordResetRequest.find({ status: 'PENDING' })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        stats: {
          assets: assetCount,
          users: userCount,
          departments: departmentCount,
          auditLogs: auditLogCount,
          passwordResets: passwordResetCount,
          passwordResetRequests: passwordResetRequestCount
        },
        assetsByType,
        recentActivity,
        pendingPasswordResets
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .populate('department', 'name')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAssets = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const assets = await Asset.find()
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalAssets = await Asset.countDocuments();

    res.json({
      success: true,
      data: {
        assets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalAssets / limit),
          totalAssets
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPasswordResetRequests = async (req, res, next) => {
  try {
    const requests = await PasswordResetRequest.find()
      .populate('userId', 'name email role')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

export const approvePasswordReset = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const adminId = req.user._id;

    const request = await PasswordResetRequest.findById(requestId)
      .populate('userId');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Password reset request not found'
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Request already processed'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    await PasswordReset.create({
      userId: request.userId._id,
      token: resetToken
    });

    // Update request status
    await PasswordResetRequest.findByIdAndUpdate(requestId, {
      status: 'APPROVED',
      approvedBy: adminId,
      approvedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Password reset approved',
      token: resetToken
    });
  } catch (error) {
    next(error);
  }
};

export const rejectPasswordReset = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    const request = await PasswordResetRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Password reset request not found'
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Request already processed'
      });
    }

    await PasswordResetRequest.findByIdAndUpdate(requestId, {
      status: 'REJECTED',
      approvedBy: adminId,
      approvedAt: new Date(),
      rejectedReason: reason
    });

    res.json({
      success: true,
      message: 'Password reset request rejected'
    });
  } catch (error) {
    next(error);
  }
};