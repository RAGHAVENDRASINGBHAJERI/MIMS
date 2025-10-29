import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

const MONGO_URI = process.env.MONGO_URI;

async function migrateApprovalFields() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const assetsCollection = db.collection('assets');

    console.log('Adding approval workflow fields to assets...');
    
    const result = await assetsCollection.updateMany(
      {
        $or: [
          { updateRequestStatus: { $exists: false } },
          { requestedFields: { $exists: false } },
          { tempValues: { $exists: false } }
        ]
      },
      {
        $set: {
          updateRequestStatus: 'none',
          requestedFields: [],
          tempValues: {},
          adminRemarks: '',
          requestedAt: null,
          reviewedAt: null,
          tempBillFileId: null,
          requestedBy: null,
          reviewedBy: null
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} assets with approval workflow fields`);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateApprovalFields();