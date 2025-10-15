import Asset from '../models/Asset.js';
import mongoose from 'mongoose';
import { uploadFile, downloadFile } from '../utils/gridfs.js';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadMiddleware = upload.single('billFile');

export const createAsset = async (req, res, next) => {
  try {
    console.log('=== CREATE ASSET ENDPOINT HIT ===');
    console.log('Request body:', req.body);
    console.log('Request type field:', req.body.type);
    console.log('Request file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');
    console.log('Request headers:', req.headers);

    const { department, category, itemName, quantity, pricePerItem, vendorName, vendorAddress, contactNumber, email, billNo, billDate, type, collegeISRNo, itISRNo, igst, cgst, sgst, grandTotal, remark } = req.body;

    if (!req.file) {
      console.log('ERROR: No file provided');
      return res.status(400).json({
        success: false,
        error: 'Bill file is required'
      });
    }

    // Upload file to GridFS
    console.log('Uploading file to GridFS...');
    const fileId = await uploadFile(req.file.originalname, req.file.buffer);
    console.log('File uploaded with ID:', fileId);

    console.log('Creating asset in database...');
    const quantityNum = parseInt(quantity);
    const priceNum = parseFloat(pricePerItem);
    const totalAmount = quantityNum * priceNum;

    const asset = await Asset.create({
      department,
      category,
      itemName,
      quantity: quantityNum,
      pricePerItem: priceNum,
      totalAmount: totalAmount,
      vendorName,
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
      grandTotal: grandTotal ? parseFloat(grandTotal) : totalAmount,
      remark
    });
    console.log('Asset created:', asset);

    await asset.populate('department', 'name type');
    console.log('Asset populated with department:', asset);

    console.log('Sending success response');
    res.status(201).json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error('Error creating asset:', error);

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
    const { department, category, itemName, quantity, pricePerItem, vendorName, vendorAddress, contactNumber, email, billNo, billDate, type, collegeISRNo, itISRNo, igst, cgst, sgst, grandTotal, remark } = req.body;

    const quantityNum = parseInt(quantity);
    const priceNum = parseFloat(pricePerItem);
    const totalAmount = quantityNum * priceNum;

    const updateData = {
      department,
      category,
      itemName,
      quantity: quantityNum,
      pricePerItem: priceNum,
      totalAmount: totalAmount,
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

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error('Error updating asset:', error);

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
    const asset = await Asset.findByIdAndDelete(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Optionally, delete the associated file from GridFS
    // await deleteFile(asset.billFileId);

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
