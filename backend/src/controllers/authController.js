import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

export const register = async (req, res, next) => {
  try {
    console.log('=== REGISTER ENDPOINT HIT ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    console.log('Request origin:', req.get('origin'));
    
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
    console.log('=== LOGIN ENDPOINT HIT ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    console.log('Request origin:', req.get('origin'));
    
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
