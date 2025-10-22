import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import PasswordResetRequest from '../models/PasswordResetRequest.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

export const register = async (req, res, next) => {
  try {
    
    const { name, email, password, role, department } = req.body;

    // Validate role if provided
    if (role && !['admin', 'department-officer', 'user'].includes(role)) {
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
      role: role || 'user'
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

    const user = await User.findOne({ email });
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

    // Officers need admin approval
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required for password reset request'
      });
    }

    await PasswordResetRequest.create({
      userId: user._id,
      reason
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
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(resetRecord.userId, {
      password: hashedPassword
    });

    // Mark token as used
    await PasswordReset.findByIdAndUpdate(resetRecord._id, {
      used: true
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
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
