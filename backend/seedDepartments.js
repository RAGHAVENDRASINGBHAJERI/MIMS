import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Department from './src/models/Department.js';

dotenv.config({ path: './config.env' });

const departments = [
  // Major Departments
  { name: 'Department of Civil Engineering', type: 'Major' },
  { name: 'Department of Computer Science and Engineering (CSE)', type: 'Major' },
  { name: 'Department of Electronics and Communication Engineering (ECE)', type: 'Major' },
  { name: 'Department of Electrical and Electronics Engineering (EEE)', type: 'Major' },
  { name: 'Department of Information Science and Engineering (ISE)', type: 'Major' },
  { name: 'Department of Mechanical Engineering', type: 'Major' },
  { name: 'Department of Artificial Intelligence and Machine Learning (AIML, under CSE)', type: 'Major' },
  
  // Academic Departments
  { name: 'Department of First Year Engineering', type: 'Academic' },
  { name: 'Department of Chemistry', type: 'Academic' },
  { name: 'Department of Physics', type: 'Academic' },
  { name: 'Department of Mathematics', type: 'Academic' },
  
  // Service Departments
  { name: 'Department of Electrical Maintenance', type: 'Service' },
  { name: 'Department of Civil Maintenance', type: 'Service' },
  { name: 'Office Administration', type: 'Service' },
  { name: 'Central Library', type: 'Service' },
  { name: 'Department of Sports and Physical Education', type: 'Service' },
  { name: 'Boys\' Hostel Administration', type: 'Service' },
  { name: 'Girls\' Hostel Administration', type: 'Service' }
];

const seedDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing departments
    await Department.deleteMany({});
    console.log('Cleared existing departments');

    // Insert new departments
    await Department.insertMany(departments);
    console.log(`Seeded ${departments.length} departments successfully`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding departments:', error);
    process.exit(1);
  }
};

export default seedDepartments;
