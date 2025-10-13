import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Asset from '../models/Asset.js';
import Department from '../models/Department.js';
import { Types } from 'mongoose';

dotenv.config({ path: '../../config.env' });

const seedAssets = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/assetflow');
    console.log('Connected to MongoDB');

    // Clear existing assets
    await Asset.deleteMany({});
    console.log('Cleared existing assets');

    // Get departments (assuming they exist from seedDepartments)
    const departments = await Department.find({});
    if (departments.length === 0) {
      console.log('No departments found. Please run seedDepartments.js first.');
      process.exit(1);
    }

    const sampleAssets = [
      // Capital Assets
      {
        itemName: 'Laboratory Equipment',
        category: 'Electronics',
        type: 'capital',
        quantity: 5,
        pricePerItem: 50000,
        totalAmount: 5 * 50000,
        vendorName: 'Tech Supplies Ltd',
        vendorAddress: '123 Tech Street, Bangalore',
        contactNumber: '9876543210',
        email: 'sales@techsupplies.com',
        billNo: 'BILL-001',
        billDate: new Date('2024-01-15'),
        billFileId: new Types.ObjectId(),
        department: departments[0]._id, // First department
      },
      {
        itemName: 'Furniture Set',
        category: 'Office Supplies',
        type: 'capital',
        quantity: 10,
        pricePerItem: 15000,
        totalAmount: 10 * 15000,
        vendorName: 'Office World',
        vendorAddress: '456 Office Ave, Mumbai',
        contactNumber: '8765432109',
        email: 'info@officeworld.com',
        billNo: 'BILL-002',
        billDate: new Date('2024-02-10'),
        billFileId: new Types.ObjectId(),
        department: departments[1]._id || departments[0]._id,
      },
      {
        itemName: 'Projector System',
        category: 'AV Equipment',
        type: 'capital',
        quantity: 3,
        pricePerItem: 80000,
        totalAmount: 3 * 80000,
        vendorName: 'AV Solutions',
        vendorAddress: '789 AV Road, Delhi',
        contactNumber: '7654321098',
        email: 'support@avsolutions.com',
        billNo: 'BILL-003',
        billDate: new Date('2024-03-05'),
        billFileId: new Types.ObjectId(),
        department: departments[0]._id,
      },
      {
        itemName: 'Computer Lab Setup',
        category: 'Computers',
        type: 'capital',
        quantity: 20,
        pricePerItem: 45000,
        totalAmount: 20 * 45000,
        vendorName: 'CompTech Inc',
        vendorAddress: '101 Comp Lane, Chennai',
        contactNumber: '6543210987',
        email: 'sales@comptech.com',
        billNo: 'BILL-004',
        billDate: new Date('2024-04-20'),
        billFileId: new Types.ObjectId(),
        department: departments[2]._id || departments[0]._id,
      },
      {
        itemName: 'Library Bookshelves',
        category: 'Furniture',
        type: 'capital',
        quantity: 15,
        pricePerItem: 12000,
        totalAmount: 15 * 12000,
        vendorName: 'BookShelf Co',
        vendorAddress: '202 Book St, Kolkata',
        contactNumber: '5432109876',
        email: 'orders@bookshelf.com',
        billNo: 'BILL-005',
        billDate: new Date('2024-05-12'),
        billFileId: new Types.ObjectId(),
        department: departments[3]._id || departments[0]._id,
      },
      // Revenue Assets
      {
        itemName: 'Textbooks Batch A',
        category: 'Educational Materials',
        type: 'revenue',
        quantity: 100,
        pricePerItem: 500,
        totalAmount: 100 * 500,
        vendorName: 'EduPublishers',
        vendorAddress: '303 Edu Blvd, Bangalore',
        contactNumber: '4321098765',
        email: 'info@edupub.com',
        billNo: 'BILL-006',
        billDate: new Date('2024-06-18'),
        billFileId: new Types.ObjectId(),
        department: departments[0]._id,
      },
      {
        itemName: 'Lab Consumables',
        category: 'Chemicals',
        type: 'revenue',
        quantity: 50,
        pricePerItem: 200,
        totalAmount: 50 * 200,
        vendorName: 'ChemSupply',
        vendorAddress: '404 Chem Way, Mumbai',
        contactNumber: '3210987654',
        email: 'sales@chemsupply.com',
        billNo: 'BILL-007',
        billDate: new Date('2024-07-22'),
        billFileId: new Types.ObjectId(),
        department: departments[1]._id || departments[0]._id,
      },
      {
        itemName: 'Stationery Pack',
        category: 'Office Supplies',
        type: 'revenue',
        quantity: 200,
        pricePerItem: 100,
        totalAmount: 200 * 100,
        vendorName: 'Stationery Hub',
        vendorAddress: '505 Stat Rd, Delhi',
        contactNumber: '2109876543',
        email: 'orders@stationeryhub.com',
        billNo: 'BILL-008',
        billDate: new Date('2024-08-14'),
        billFileId: new Types.ObjectId(),
        department: departments[2]._id || departments[0]._id,
      },
      {
        itemName: 'Uniform Materials',
        category: 'Textiles',
        type: 'revenue',
        quantity: 300,
        pricePerItem: 150,
        totalAmount: 300 * 150,
        vendorName: 'Uniform Makers',
        vendorAddress: '606 Uni Ave, Chennai',
        contactNumber: '1098765432',
        email: 'info@uniformmakers.com',
        billNo: 'BILL-009',
        billDate: new Date('2024-09-08'),
        billFileId: new Types.ObjectId(),
        department: departments[3]._id || departments[0]._id,
      },
      {
        itemName: 'Sports Equipment',
        category: 'Sports Goods',
        type: 'revenue',
        quantity: 25,
        pricePerItem: 800,
        totalAmount: 25 * 800,
        vendorName: 'Sports Pro',
        vendorAddress: '707 Sport St, Kolkata',
        contactNumber: '0987654321',
        email: 'sales@sportspro.com',
        billNo: 'BILL-010',
        billDate: new Date('2024-10-03'),
        billFileId: new Types.ObjectId(),
        department: departments[0]._id,
      }
    ];

    await Asset.insertMany(sampleAssets);
    console.log(`Seeded ${sampleAssets.length} assets (5 capital, 5 revenue)`);

    console.log('Assets seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding assets:', error);
    process.exit(1);
  }
};

export default seedAssets;
