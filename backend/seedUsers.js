import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Department from './src/models/Department.js';

dotenv.config({ path: './config.env' });

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing users (optional, comment out if you want to keep existing)
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Find departments for reference
    const departments = await Department.find({});
    if (departments.length === 0) {
      console.log('No departments found. Please seed departments first.');
      process.exit(1);
    }

    const users = [
      {
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: 'admin123', // Will be hashed
        role: 'admin'
      },
      {
        name: 'Department Officer',
        email: 'officer@gmail.com',
        password: 'officer123', // Will be hashed
        role: 'department-officer',
        department: departments[0]._id // First department, e.g., Civil Engineering
      },
      {
        name: 'Regular User',
        email: 'user@gmail.com',
        password: 'user123', // Will be hashed
        role: 'user'
      }
    ];

    // Create users individually to trigger password hashing
    for (const userData of users) {
      await User.create(userData);
    }
    console.log(`Seeded ${users.length} users successfully`);

    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

export default seedUsers;
