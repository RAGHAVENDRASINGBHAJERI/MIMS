import User from '../models/User.js';

export const disableAfterAdmin = async (req, res, next) => {
  try {
    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin already exists. This route is disabled.'
      });
    }

    // If no admin exists, allow the request to proceed
    next();
  } catch (error) {
    next(error);
  }
};
