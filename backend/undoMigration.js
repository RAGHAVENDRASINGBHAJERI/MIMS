import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

const MONGO_URI = process.env.MONGO_URI;

async function undoMigration() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const assetsCollection = db.collection('assets');

    console.log('Removing approval workflow fields from assets...');
    
    const result = await assetsCollection.updateMany(
      {},
      {
        $unset: {
          updateRequestStatus: "",
          requestedFields: "",
          tempValues: "",
          adminRemarks: "",
          requestedAt: "",
          reviewedAt: "",
          tempBillFileId: ""
        }
      }
    );

    console.log(`Removed approval workflow fields from ${result.modifiedCount} assets`);
    console.log('Migration rollback completed successfully!');
    
  } catch (error) {
    console.error('Migration rollback failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

undoMigration();