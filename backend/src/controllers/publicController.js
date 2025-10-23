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
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalValue = totalValueResult[0]?.total || 0;
    
    const formattedTotalValue = totalValue >= 1000000
      ? `₹${(totalValue / 1000000).toFixed(1)}M`
      : `₹${totalValue.toLocaleString()}`;

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