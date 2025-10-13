import User from '../models/User.js';
import Department from '../models/Department.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';

const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin: Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).populate('department', 'name').select('-password');
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin: Create new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Validate department if role is department-officer
    if (role === 'department-officer' && !department) {
      return res.status(400).json({ success: false, error: 'Department is required for department officers' });
    }

    if (department) {
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        return res.status(400).json({ success: false, error: 'Invalid department' });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      department: role === 'department-officer' ? department : undefined,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin: Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
    }

    // Validate department if role is department-officer
    if (role === 'department-officer' && !department) {
      return res.status(400).json({ success: false, error: 'Department is required for department officers' });
    }

    if (department) {
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        return res.status(400).json({ success: false, error: 'Invalid department' });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        name,
        email,
        role,
        department: role === 'department-officer' ? department : undefined,
      },
      { new: true }
    ).populate('department', 'name').select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin: Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { authUser, getAllUsers, createUser, updateUser, deleteUser };
