import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Asset from './src/models/Asset.js';
import Department from './src/models/Department.js';
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

    const sampleAssets = [];

    // Generate 1 capital and 1 revenue asset for each department
    const capitalItems = [
      'Laboratory Equipment', 'Furniture Set', 'Projector System', 'Computer Lab Setup', 'Library Bookshelves',
      'Workshop Tools', 'Classroom Desks', 'Server Equipment', 'Medical Equipment', 'Sports Facilities',
      'Auditorium Setup', 'Research Equipment', 'Cafeteria Equipment', 'Security Systems', 'Transportation Vehicles',
      'Maintenance Tools', 'Office Equipment'
    ];

    const revenueItems = [
      'Textbooks Batch', 'Lab Consumables', 'Stationery Pack', 'Uniform Materials', 'Sports Equipment',
      'Cleaning Supplies', 'Office Supplies', 'Educational Materials', 'Software Licenses', 'Training Materials',
      'Event Supplies', 'Maintenance Consumables', 'Food Supplies', 'Medical Supplies', 'IT Consumables',
      'Library Materials', 'Administrative Supplies'
    ];

    const vendors = [
      { name: 'Tech Supplies Ltd', address: '123 Tech Street, Bangalore', phone: '9876543210', email: 'sales@techsupplies.com' },
      { name: 'Office World', address: '456 Office Ave, Mumbai', phone: '8765432109', email: 'info@officeworld.com' },
      { name: 'AV Solutions', address: '789 AV Road, Delhi', phone: '7654321098', email: 'support@avsolutions.com' },
      { name: 'CompTech Inc', address: '101 Comp Lane, Chennai', phone: '6543210987', email: 'sales@comptech.com' },
      { name: 'BookShelf Co', address: '202 Book St, Kolkata', phone: '5432109876', email: 'orders@bookshelf.com' },
      { name: 'EduPublishers', address: '303 Edu Blvd, Bangalore', phone: '4321098765', email: 'info@edupub.com' },
      { name: 'ChemSupply', address: '404 Chem Way, Mumbai', phone: '3210987654', email: 'sales@chemsupply.com' },
      { name: 'Stationery Hub', address: '505 Stat Rd, Delhi', phone: '2109876543', email: 'orders@stationeryhub.com' },
      { name: 'Uniform Makers', address: '606 Uni Ave, Chennai', phone: '1098765432', email: 'info@uniformmakers.com' },
      { name: 'Sports Pro', address: '707 Sport St, Kolkata', phone: '0987654321', email: 'sales@sportspro.com' }
    ];

    const categories = [
      'Electronics', 'Office Supplies', 'AV Equipment', 'Computers', 'Furniture', 'Educational Materials',
      'Chemicals', 'Textiles', 'Sports Goods', 'Tools', 'Medical Equipment', 'Software', 'Maintenance',
      'Security', 'Transportation', 'Food', 'Library Materials'
    ];

    // Create assets for each department
    departments.forEach((dept, index) => {
      const vendor = vendors[index % vendors.length];
      const billDate = new Date(2025, index % 12, (index % 28) + 1); // Spread dates across 2025

      // Capital Asset
      sampleAssets.push({
        itemName: `${capitalItems[index % capitalItems.length]} - ${dept.name.split(' ')[1] || 'Dept'}`,
        category: categories[index % categories.length],
        type: 'capital',
        quantity: Math.floor(Math.random() * 10) + 1,
        pricePerItem: Math.floor(Math.random() * 50000) + 10000,
        totalAmount: 0, // Will be calculated
        vendorName: vendor.name,
        vendorAddress: vendor.address,
        contactNumber: vendor.phone,
        email: vendor.email,
        billNo: `CAP-BILL-${String(index + 1).padStart(3, '0')}`,
        billDate: billDate,
        billFileId: new Types.ObjectId(),
        department: dept._id,
      });

      // Revenue Asset
      sampleAssets.push({
        itemName: `${revenueItems[index % revenueItems.length]} - ${dept.name.split(' ')[1] || 'Dept'}`,
        category: categories[(index + 5) % categories.length],
        type: 'revenue',
        quantity: Math.floor(Math.random() * 100) + 10,
        pricePerItem: Math.floor(Math.random() * 1000) + 100,
        totalAmount: 0, // Will be calculated
        vendorName: vendor.name,
        vendorAddress: vendor.address,
        contactNumber: vendor.phone,
        email: vendor.email,
        billNo: `REV-BILL-${String(index + 1).padStart(3, '0')}`,
        billDate: billDate,
        billFileId: new Types.ObjectId(),
        department: dept._id,
      });
    });

    // Calculate totalAmount for each asset
    sampleAssets.forEach(asset => {
      asset.totalAmount = asset.quantity * asset.pricePerItem;
    });

    await Asset.insertMany(sampleAssets);
    console.log(`Seeded ${sampleAssets.length} assets (${departments.length} capital, ${departments.length} revenue)`);

    console.log('Assets seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding assets:', error);
    process.exit(1);
  }
};

export default seedAssets;
