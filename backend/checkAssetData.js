import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

const MONGO_URI = process.env.MONGO_URI;

async function checkAssetData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const assetsCollection = db.collection('assets');

    console.log('Checking asset data structure...');
    
    const sampleAssets = await assetsCollection.find({}).limit(5).toArray();
    
    console.log('Sample assets:');
    sampleAssets.forEach((asset, index) => {
      console.log(`\nAsset ${index + 1}:`);
      console.log(`  _id: ${asset._id}`);
      console.log(`  billNo: ${asset.billNo}`);
      console.log(`  type: ${asset.type}`);
      console.log(`  totalAmount: ${asset.totalAmount}`);
      console.log(`  grandTotal: ${asset.grandTotal}`);
      console.log(`  cgst: ${asset.cgst}`);
      console.log(`  sgst: ${asset.sgst}`);
      console.log(`  items count: ${asset.items ? asset.items.length : 0}`);
      
      if (asset.items && asset.items.length > 0) {
        console.log('  Items:');
        asset.items.forEach((item, itemIndex) => {
          console.log(`    Item ${itemIndex + 1}:`);
          console.log(`      particulars: ${item.particulars}`);
          console.log(`      quantity: ${item.quantity}`);
          console.log(`      rate: ${item.rate}`);
          console.log(`      amount: ${item.amount}`);
          console.log(`      cgst: ${item.cgst}`);
          console.log(`      sgst: ${item.sgst}`);
          console.log(`      grandTotal: ${item.grandTotal}`);
        });
      }
    });

    // Check totals
    const totalStats = await assetsCollection.aggregate([
      {
        $group: {
          _id: null,
          totalAssets: { $sum: 1 },
          totalAmountSum: { $sum: '$totalAmount' },
          grandTotalSum: { $sum: '$grandTotal' },
          capitalCount: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, 1, 0] } },
          revenueCount: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, 1, 0] } },
          capitalTotalAmount: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$totalAmount', 0] } },
          revenueTotalAmount: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$totalAmount', 0] } },
          capitalGrandTotal: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$grandTotal', 0] } },
          revenueGrandTotal: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$grandTotal', 0] } }
        }
      }
    ]).toArray();

    console.log('\nDatabase Statistics:');
    if (totalStats.length > 0) {
      const stats = totalStats[0];
      console.log(`Total Assets: ${stats.totalAssets}`);
      console.log(`Capital Assets: ${stats.capitalCount}`);
      console.log(`Revenue Assets: ${stats.revenueCount}`);
      console.log(`Total Amount Sum: ₹${stats.totalAmountSum?.toLocaleString() || 0}`);
      console.log(`Grand Total Sum: ₹${stats.grandTotalSum?.toLocaleString() || 0}`);
      console.log(`Capital Total Amount: ₹${stats.capitalTotalAmount?.toLocaleString() || 0}`);
      console.log(`Revenue Total Amount: ₹${stats.revenueTotalAmount?.toLocaleString() || 0}`);
      console.log(`Capital Grand Total: ₹${stats.capitalGrandTotal?.toLocaleString() || 0}`);
      console.log(`Revenue Grand Total: ₹${stats.revenueGrandTotal?.toLocaleString() || 0}`);
    }
    
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkAssetData();