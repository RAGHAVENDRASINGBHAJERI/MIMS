import Asset from '../models/Asset.js';
import { createNotification } from './notificationController.js';

// Helper to get field display value
const getFieldDisplayValue = (field, value, asset) => {
  if (field === 'items' && Array.isArray(value)) {
    return value.map(item => `${item.particulars} (Qty: ${item.quantity}, Rate: ₹${item.rate})`).join(', ');
  }
  if (field === 'singleItem' && value) {
    const { itemIndex, updatedItem, action } = value;
    if (action === 'delete') return `Delete item at index ${itemIndex}`;
    return `${updatedItem.particulars} (Qty: ${updatedItem.quantity}, Rate: ₹${updatedItem.rate})`;
  }
  if (field === 'billDate') return new Date(value).toLocaleDateString();
  return String(value || '');
};

// Request asset update
export const requestAssetUpdate = async (req, res, next) => {
  try {
    const { requestedFields, tempValues } = req.body;
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    asset.updateRequestStatus = 'pending';
    asset.requestedFields = requestedFields;
    asset.tempValues = tempValues;
    asset.requestedBy = req.user._id;
    asset.requestedAt = new Date();
    
    await asset.save();
    
    res.json({ success: true, message: 'Update request submitted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get pending updates
export const getPendingUpdates = async (req, res, next) => {
  try {
    const assets = await Asset.find({ updateRequestStatus: 'pending' })
      .populate('department', 'name')
      .populate('requestedBy', 'name email')
      .sort({ requestedAt: -1 });
    
    // Add current values for comparison
    const assetsWithComparison = assets.map(asset => {
      const currentValues = {};
      const newValues = {};
      
      asset.requestedFields.forEach(field => {
        currentValues[field] = getFieldDisplayValue(field, asset[field], asset);
        newValues[field] = getFieldDisplayValue(field, asset.tempValues[field], asset);
      });
      
      return {
        ...asset.toObject(),
        currentValues,
        newValues
      };
    });
    
    res.json({ success: true, data: assetsWithComparison });
  } catch (error) {
    next(error);
  }
};

// Approve asset update
export const approveAssetUpdate = async (req, res, next) => {
  try {
    const { adminRemarks } = req.body;
    const asset = await Asset.findById(req.params.id).populate('requestedBy', 'name');
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Apply the temp values to actual fields
    Object.keys(asset.tempValues).forEach(field => {
      if (field === 'items' && Array.isArray(asset.tempValues[field])) {
        // Recalculate item totals
        asset.items = asset.tempValues[field].map(item => {
          const quantity = Number(item.quantity) || 0;
          const rate = Number(item.rate) || 0;
          const cgst = Number(item.cgst) || 0;
          const sgst = Number(item.sgst) || 0;
          
          const amount = quantity * rate;
          const cgstAmount = (amount * cgst) / 100;
          const sgstAmount = (amount * sgst) / 100;
          const grandTotal = amount + cgstAmount + sgstAmount;
          
          return {
            ...item,
            quantity,
            rate,
            cgst,
            sgst,
            amount,
            grandTotal
          };
        });
        // Recalculate asset totals
        asset.totalAmount = asset.items.reduce((sum, item) => sum + item.amount, 0);
        asset.grandTotal = asset.items.reduce((sum, item) => sum + item.grandTotal, 0);
      } else if (field === 'singleItem') {
        // Handle single item update or delete
        const { itemIndex, updatedItem, action } = asset.tempValues[field];
        if (asset.items && itemIndex >= 0 && itemIndex < asset.items.length) {
          if (action === 'delete') {
            asset.items.splice(itemIndex, 1);
          } else if (action === 'update') {
            asset.items[itemIndex] = updatedItem;
          }
          // Recalculate totals
          asset.totalAmount = asset.items.reduce((sum, item) => sum + (item.amount || 0), 0);
          asset.grandTotal = asset.items.reduce((sum, item) => sum + (item.grandTotal || 0), 0);
        }
      } else {
        asset[field] = asset.tempValues[field];
      }
    });
    
    asset.updateRequestStatus = 'approved';
    asset.reviewedBy = req.user._id;
    asset.reviewedAt = new Date();
    asset.adminRemarks = adminRemarks || '';
    asset.tempValues = {};
    asset.requestedFields = [];
    
    await asset.save();
    
    // Create notification for the officer
    await createNotification(
      asset.requestedBy._id,
      'update_approved',
      'Update Request Approved',
      `Your update request for Bill #${asset.billNo} has been approved by admin.${adminRemarks ? ` Remarks: ${adminRemarks}` : ''}`,
      asset._id,
      asset.billNo,
      req.user._id
    );
    
    res.json({ success: true, message: 'Update request approved successfully' });
  } catch (error) {
    next(error);
  }
};

// Reject asset update
export const rejectAssetUpdate = async (req, res, next) => {
  try {
    const { adminRemarks } = req.body;
    const asset = await Asset.findById(req.params.id).populate('requestedBy', 'name');
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    asset.updateRequestStatus = 'rejected';
    asset.reviewedBy = req.user._id;
    asset.reviewedAt = new Date();
    asset.adminRemarks = adminRemarks || '';
    asset.tempValues = {};
    asset.requestedFields = [];
    
    await asset.save();
    
    // Create notification for the officer
    await createNotification(
      asset.requestedBy._id,
      'update_rejected',
      'Update Request Rejected',
      `Your update request for Bill #${asset.billNo} has been rejected by admin.${adminRemarks ? ` Reason: ${adminRemarks}` : ''}`,
      asset._id,
      asset.billNo,
      req.user._id
    );
    
    res.json({ success: true, message: 'Update request rejected' });
  } catch (error) {
    next(error);
  }
};