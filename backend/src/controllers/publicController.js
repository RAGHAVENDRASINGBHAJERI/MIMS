import Asset from '../models/Asset.js';
import Department from '../models/Department.js';

export const getPublicStats = async (req, res, next) => {
  try {
    const totalAssets = await Asset.countDocuments();
    const totalDepartments = await Department.countDocuments();
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    const thisMonthAssets = await Asset.countDocuments({
      billDate: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const totalValueResult = await Asset.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$grandTotal', '$totalAmount'] } } } }
    ]);
    const totalValue = totalValueResult[0]?.total || 0;
    
    const formatIndianCurrency = (amount) => {
      if (amount >= 10000000) { // 1 crore
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
      } else if (amount >= 100000) { // 1 lakh
        return `₹${(amount / 100000).toFixed(2)} L`;
      } else if (amount >= 1000) { // 1 thousand
        return `₹${(amount / 1000).toFixed(2)} K`;
      } else {
        return `₹${amount.toLocaleString('en-IN')}`;
      }
    };
    
    const formattedTotalValue = formatIndianCurrency(totalValue);

    res.json({
      success: true,
      data: {
        totalAssets,
        totalDepartments,
        thisMonthAssets,
        totalValue: formattedTotalValue
      }
    });
  } catch (error) {
    next(error);
  }
};