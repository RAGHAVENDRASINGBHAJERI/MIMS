import Asset from '../models/Asset.js';
import AuditLog from '../models/AuditLog.js';
import mongoose from 'mongoose';
import { uploadFile, downloadFile } from '../utils/gridfs.js';
import multer from 'multer';

// Configure multer for memory storage with PDF-only restriction
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

export const uploadMiddleware = upload.single('billFile');

export const createAsset = async (req, res, next) => {
  try {

    // Handle multer errors (file type, size, etc.)
    if (req.fileError) {
      return res.status(400).json({
        success: false,
        error: req.fileError.message || 'File upload error'
      });
    }

    const { department, category, itemName, quantity, pricePerItem, vendor, vendorName, vendorAddress, contactNumber, email, billNo, billDate, type, collegeISRNo, itISRNo, igst, cgst, sgst, grandTotal, remark, items } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Bill file is required'
      });
    }

    // Upload file to GridFS
    const fileId = await uploadFile(req.file.originalname, req.file.buffer);
    const quantityNum = quantity !== undefined ? parseFloat(quantity) : undefined;
    const priceNum = pricePerItem !== undefined ? parseFloat(pricePerItem) : undefined;
    const singleTotalAmount = quantityNum != null && priceNum != null ? quantityNum * priceNum : 0;

    // Parse items if provided (could arrive as JSON string via multipart)
    let parsedItems = [];
    if (items) {
      try {
        parsedItems = Array.isArray(items) ? items : JSON.parse(items);
        // Ensure serial numbers are properly handled
        parsedItems = parsedItems.map(item => ({
          ...item,
          serialNumber: item.serialNumber || '',
          serialNumbers: item.serialNumbers || []
        }));
      } catch (e) {
        // Failed to parse items, using empty array
      }
    }

    const asset = await Asset.create({
      department,
      category: (category || type || 'capital').toString().toLowerCase(),
      itemName,
      quantity: quantityNum,
      pricePerItem: priceNum,
      items: parsedItems,
      vendorName: vendorName || vendor,
      vendor: vendor || vendorName,
      vendorAddress,
      contactNumber,
      email,
      billNo,
      billDate: new Date(billDate),
      billFileId: fileId,
      type: type || 'capital',
      collegeISRNo,
      itISRNo,
      igst: igst ? parseFloat(igst) : 0,
      cgst: cgst ? parseFloat(cgst) : 0,
      sgst: sgst ? parseFloat(sgst) : 0,
      grandTotal: grandTotal ? parseFloat(grandTotal) : singleTotalAmount,
      remark
    });

    await asset.populate('department', 'name type');
    
    // Create audit log for asset creation
    await AuditLog.create({
      action: 'CREATE',
      entityType: 'ASSET',
      entityId: asset._id,
      userId: req.user._id,
      reason: 'Asset created',
      billInfo: {
        billNumber: asset.billNo,
        vendorName: asset.vendorName
      }
    });
    
    res.status(201).json({
      success: true,
      data: asset
    });
  } catch (error) {

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Asset with this information already exists'
      });
    }

    next(error);
  }
};

export const getAssets = async (req, res, next) => {
  try {
    const { departmentId, type, startDate, endDate, page = 1, limit = 10 } = req.query;
    const user = req.user;

    const filterQuery = {};

    // If user is department officer, restrict to their department
    if (user.role === 'department-officer') {
      filterQuery.department = user.department;
    } else if (departmentId) {
      // Admin can filter by department
      filterQuery.department = new mongoose.Types.ObjectId(departmentId);
    }

    if (type) {
      filterQuery.type = type;
    }
    if (startDate || endDate) {
      filterQuery.billDate = {};
      if (startDate) {
        filterQuery.billDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filterQuery.billDate.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;
    const assets = await Asset.find(filterQuery)
      .populate('department', 'name')
      .sort({ billDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalAssets = await Asset.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalAssets / limit);

    res.json({
      success: true,
      data: {
        assets,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalAssets,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('department', 'name type');

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    next(error);
  }
};

export const downloadBill = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    const downloadStream = downloadFile(asset.billFileId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bill_${asset.billNo}.pdf"`);

    downloadStream.pipe(res);

    downloadStream.on('error', (error) => {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    });
  } catch (error) {
    next(error);
  }
};

export const previewBill = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    const downloadStream = downloadFile(asset.billFileId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');

    downloadStream.pipe(res);

    downloadStream.on('error', (error) => {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    });
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req, res, next) => {
  try {
    const { department, category, itemName, quantity, pricePerItem, vendorName, vendorAddress, contactNumber, email, billNo, billDate, type, collegeISRNo, itISRNo, igst, cgst, sgst, grandTotal, remark, items, reason, officerName } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason for update is required'
      });
    }

    if (!officerName) {
      return res.status(400).json({
        success: false,
        error: 'Officer name is required'
      });
    }

    // Get original asset for audit log
    const originalAsset = await Asset.findById(req.params.id).lean();

    const quantityNum = quantity !== undefined ? parseFloat(quantity) : undefined;
    const priceNum = pricePerItem !== undefined ? parseFloat(pricePerItem) : undefined;
    const totalAmount = quantityNum != null && priceNum != null ? quantityNum * priceNum : 0;

    // Parse items if provided (could arrive as JSON string via multipart)
    let parsedItems = [];
    if (items) {
      try {
        parsedItems = Array.isArray(items) ? items : JSON.parse(items);
        // Ensure serial numbers are properly handled
        parsedItems = parsedItems.map(item => ({
          ...item,
          serialNumber: item.serialNumber || '',
          serialNumbers: item.serialNumbers || []
        }));
      } catch (e) {
        // Failed to parse items, using empty array
      }
    }

    const updateData = {
      department,
      category,
      itemName,
      quantity: quantityNum,
      pricePerItem: priceNum,
      totalAmount: totalAmount,
      items: parsedItems,
      vendorName,
      vendorAddress,
      contactNumber,
      email,
      billNo,
      billDate: new Date(billDate),
      type: type || 'capital',
      collegeISRNo,
      itISRNo,
      igst: igst ? parseFloat(igst) : 0,
      cgst: cgst ? parseFloat(cgst) : 0,
      sgst: sgst ? parseFloat(sgst) : 0,
      grandTotal: grandTotal ? parseFloat(grandTotal) : totalAmount,
      remark
    };

    // If a new file is uploaded, update the billFileId
    if (req.file) {
      const fileId = await uploadFile(req.file.originalname, req.file.buffer);
      updateData.billFileId = fileId;
    }

    const asset = await Asset.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('department', 'name type');

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Create audit log
    await AuditLog.create({
      action: 'UPDATE',
      entityType: 'ASSET',
      entityId: asset._id,
      userId: req.user._id,
      reason,
      officerName,
      billInfo: {
        billNumber: asset.billNo,
        vendorName: asset.vendorName
      },
      oldData: originalAsset,
      newData: asset.toObject()
    });

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Asset with this information already exists'
      });
    }

    next(error);
  }
};

export const deleteAsset = async (req, res, next) => {
  try {
    const { reason, officerName } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason for deletion is required'
      });
    }

    if (!officerName) {
      return res.status(400).json({
        success: false,
        error: 'Officer name is required'
      });
    }

    const asset = await Asset.findById(req.params.id).lean();

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    await Asset.findByIdAndDelete(req.params.id);

    // Create audit log
    await AuditLog.create({
      action: 'DELETE',
      entityType: 'ASSET',
      entityId: asset._id,
      userId: req.user._id,
      reason,
      officerName,
      billInfo: {
        billNumber: asset.billNo,
        vendorName: asset.vendorName
      },
      oldData: asset
    });

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updateAssetItem = async (req, res, next) => {
  try {
    const { itemIndex, updatedItem, reason, officerName } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason for item update is required'
      });
    }

    if (!officerName) {
      return res.status(400).json({
        success: false,
        error: 'Officer name is required'
      });
    }

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    if (!asset.items || itemIndex >= asset.items.length || itemIndex < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid item index'
      });
    }

    const originalItem = { ...asset.items[itemIndex].toObject() };
    
    // Update the specific item
    asset.items[itemIndex] = {
      particulars: updatedItem.particulars,
      serialNumber: updatedItem.serialNumber || '',
      serialNumbers: updatedItem.serialNumbers || [],
      quantity: updatedItem.quantity,
      rate: updatedItem.rate,
      cgst: updatedItem.cgst,
      sgst: updatedItem.sgst,
      amount: updatedItem.amount,
      grandTotal: updatedItem.grandTotal
    };

    // Mark the items array as modified for Mongoose
    asset.markModified('items');

    // Recalculate asset grand total
    const newGrandTotal = asset.items.reduce((sum, item) => sum + (item.grandTotal || 0), 0);
    asset.grandTotal = newGrandTotal;

    await asset.save();
    await asset.populate('department', 'name type');

    // Create audit log
    await AuditLog.create({
      action: 'UPDATE',
      entityType: 'ASSET',
      entityId: asset._id,
      userId: req.user._id,
      reason,
      officerName,
      billInfo: {
        billNumber: asset.billNo,
        vendorName: asset.vendorName
      },
      oldData: { itemIndex, item: originalItem },
      newData: { itemIndex, item: updatedItem }
    });

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAssetItem = async (req, res, next) => {
  try {
    const { itemIndex, reason, officerName } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason for item deletion is required'
      });
    }

    if (!officerName) {
      return res.status(400).json({
        success: false,
        error: 'Officer name is required'
      });
    }

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    if (!asset.items || itemIndex >= asset.items.length || itemIndex < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid item index'
      });
    }

    if (asset.items.length === 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the last item. Delete the entire asset instead.'
      });
    }

    const deletedItem = { ...asset.items[itemIndex].toObject() };
    asset.items.splice(itemIndex, 1);

    // Mark the items array as modified for Mongoose
    asset.markModified('items');

    // Recalculate asset grand total
    const newGrandTotal = asset.items.reduce((sum, item) => sum + (item.grandTotal || 0), 0);
    asset.grandTotal = newGrandTotal;

    await asset.save();
    await asset.populate('department', 'name type');

    // Create audit log
    await AuditLog.create({
      action: 'DELETE',
      entityType: 'ASSET',
      entityId: asset._id,
      userId: req.user._id,
      reason,
      officerName,
      billInfo: {
        billNumber: asset.billNo,
        vendorName: asset.vendorName
      },
      oldData: { itemIndex, item: deletedItem }
    });

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    next(error);
  }
};
