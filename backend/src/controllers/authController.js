import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import PasswordResetRequest from '../models/PasswordResetRequest.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).populate('department');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    const jwtToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        token: jwtToken
      }
    });
  } catch (error) {
    next(error);
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const register = async (req, res, next) => {
  try {
    
    const { name, email, password, role, department } = req.body;

    // Validate role if provided
    if (role && !['admin', 'chief-administrative-officer', 'department-officer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role specified'
      });
    }

    // Validate department for department-officer
    if (role === 'department-officer' && !department) {
      return res.status(400).json({
        success: false,
        error: 'Department is required for department-officer role'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role: role || 'department-officer'
    };
    if (role === 'department-officer') {
      userData.department = department;
    }
    const user = await User.create(userData);

    // Populate department if exists
    await user.populate('department');

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).populate('department');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (req, res, next) => {
  try {

    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create admin user
    const user = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email, reason } = req.body;
    const requesterId = req.user?._id;

    // Find user by ID if authenticated, otherwise by email
    let user;
    if (requesterId) {
      user = await User.findById(requesterId);
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Admin can reset immediately
    if (user.role === 'admin') {
      const resetToken = crypto.randomBytes(32).toString('hex');
      await PasswordReset.create({
        userId: user._id,
        token: resetToken
      });

      return res.json({
        success: true,
        message: 'Password reset token generated',
        token: resetToken
      });
    }

    // Department officers need admin approval
    const existingRequest = await PasswordResetRequest.findOne({
      userId: user._id,
      status: { $in: ['PENDING', 'pending'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending password reset request'
      });
    }

    await PasswordResetRequest.create({
      userId: user._id,
      reason: reason || 'Password reset requested',
      status: 'PENDING'
    });

    res.json({
      success: true,
      message: 'Password reset request submitted. Admin approval required.'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const resetRecord = await PasswordReset.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Update user password
    const user = await User.findById(resetRecord.userId);
    user.password = newPassword;
    await user.save();

    // Mark token as used
    await PasswordReset.findByIdAndUpdate(resetRecord._id, {
      used: true
    });

    // Get user data and generate new JWT token
    await user.populate('department');
    const jwtToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        token: jwtToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department', 'name')
      .select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).populate('department');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const newToken = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        token: newToken
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    next(error);
  }
};

export const adminResetPassword = async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update password (let pre-save middleware handle hashing)
    user.password = newPassword;
    await user.save();

    // Generate new token for the user
    const newToken = generateToken(user._id);
    const updatedUser = await User.findById(userId).populate('department');

    res.json({
      success: true,
      message: 'Password reset successfully by admin',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        token: newToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).populate('department');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Handle password change (only for admins)
    if (newPassword && currentPassword && user.role === 'admin') {
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
      .populate('department');

    // Generate new token if password was changed
    let responseData = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department
    };

    if (newPassword && user.role === 'admin') {
      const jwtToken = generateToken(updatedUser._id);
      responseData.token = jwtToken;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};
