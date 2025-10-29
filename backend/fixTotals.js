import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

const MONGO_URI = process.env.MONGO_URI;

async function fixTotals() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const assetsCollection = db.collection('assets');

    console.log('Fixing asset totals...');
    
    const assets = await assetsCollection.find({}).toArray();
    let fixedCount = 0;

    for (const asset of assets) {
      let needsUpdate = false;
      const updates = {};

      // Fix grandTotal calculation
      if (asset.items && asset.items.length > 0) {
        // Calculate from items
        const totalAmount = asset.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const grandTotal = asset.items.reduce((sum, item) => sum + (Number(item.grandTotal) || 0), 0);
        
        if (asset.totalAmount !== totalAmount) {
          updates.totalAmount = totalAmount;
          needsUpdate = true;
        }
        
        if (typeof asset.grandTotal !== 'number' || asset.grandTotal !== grandTotal) {
          updates.grandTotal = grandTotal;
          needsUpdate = true;
        }

        // Fix asset-level CGST/SGST (use average from items)
        const avgCgst = asset.items.reduce((sum, item) => sum + (Number(item.cgst) || 0), 0) / asset.items.length;
        const avgSgst = asset.items.reduce((sum, item) => sum + (Number(item.sgst) || 0), 0) / asset.items.length;
        
        if (typeof asset.cgst !== 'number') {
          updates.cgst = avgCgst;
          needsUpdate = true;
        }
        
        if (typeof asset.sgst !== 'number') {
          updates.sgst = avgSgst;
          needsUpdate = true;
        }
      } else {
        // Legacy single item - calculate grandTotal from totalAmount and taxes
        const totalAmount = Number(asset.totalAmount) || 0;
        const cgst = Number(asset.cgst) || 0;
        const sgst = Number(asset.sgst) || 0;
        const igst = Number(asset.igst) || 0;
        
        const tax = totalAmount * (cgst + sgst + igst) / 100;
        const grandTotal = totalAmount + tax;
        
        if (typeof asset.grandTotal !== 'number' || asset.grandTotal !== grandTotal) {
          updates.grandTotal = grandTotal;
          needsUpdate = true;
        }
        
        // Ensure CGST/SGST are numbers
        if (typeof asset.cgst !== 'number') {
          updates.cgst = 0;
          needsUpdate = true;
        }
        
        if (typeof asset.sgst !== 'number') {
          updates.sgst = 0;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await assetsCollection.updateOne(
          { _id: asset._id },
          { $set: updates }
        );
        fixedCount++;
        console.log(`Fixed asset ${asset.billNo}: grandTotal = ${updates.grandTotal}`);
      }
    }

    console.log(`Fixed ${fixedCount} assets`);

    // Verify the fix
    const totalStats = await assetsCollection.aggregate([
      {
        $group: {
          _id: null,
          totalAssets: { $sum: 1 },
          totalAmountSum: { $sum: '$totalAmount' },
          grandTotalSum: { $sum: '$grandTotal' },
          capitalGrandTotal: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$grandTotal', 0] } },
          revenueGrandTotal: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$grandTotal', 0] } }
        }
      }
    ]).toArray();

    console.log('\nUpdated Statistics:');
    if (totalStats.length > 0) {
      const stats = totalStats[0];
      console.log(`Total Assets: ${stats.totalAssets}`);
      console.log(`Total Amount Sum: ₹${stats.totalAmountSum?.toLocaleString() || 0}`);
      console.log(`Grand Total Sum: ₹${stats.grandTotalSum?.toLocaleString() || 0}`);
      console.log(`Capital Grand Total: ₹${stats.capitalGrandTotal?.toLocaleString() || 0}`);
      console.log(`Revenue Grand Total: ₹${stats.revenueGrandTotal?.toLocaleString() || 0}`);
    }
    
  } catch (error) {
    console.error('Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixTotals();