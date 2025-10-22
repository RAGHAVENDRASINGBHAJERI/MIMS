# Material Inward Management System (MIMS)
## Comprehensive Project Report - Part 3 of 8

---

# PART 3: BACKEND API ARCHITECTURE & CONTROLLERS

## 1. Backend Architecture Overview

### 1.1 Express.js Server Structure
```javascript
// File: backend/src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### 1.2 API Route Structure
```
/api
├── /auth              # Authentication endpoints
├── /assets            # Asset management
├── /departments       # Department operations
├── /reports           # Report generation
├── /admin             # Admin operations
└── /announcements     # Notification system
```

## 2. Authentication Controller

### 2.1 Login Implementation
```javascript
// File: backend/src/controllers/authController.js
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password').populate('department');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        department: user.department?._id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Create audit log
    await AuditLog.create({
      entityType: 'USER',
      entityId: user._id,
      action: 'LOGIN',
      userId: user._id,
      userName: user.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### 2.2 JWT Middleware
```javascript
// File: backend/src/middleware/auth.js
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('department');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token is not valid'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token is not valid'
    });
  }
};
```

## 3. Asset Controller

### 3.1 Create Asset Implementation
```javascript
// File: backend/src/controllers/assetController.js
export const createAsset = async (req, res) => {
  try {
    const {
      department,
      category,
      type,
      vendorName,
      vendorAddress,
      contactNumber,
      email,
      billNo,
      billDate,
      items,
      ...otherFields
    } = req.body;

    // Validate required fields
    const requiredFields = ['department', 'vendorName', 'vendorAddress', 'contactNumber', 'email', 'billNo', 'billDate'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`
        });
      }
    }

    // Handle file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Bill file is required'
      });
    }

    // Parse items if provided
    let parsedItems = [];
    if (items) {
      try {
        parsedItems = JSON.parse(items);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid items format'
        });
      }
    }

    // Create asset
    const assetData = {
      department,
      category: category || type || 'capital',
      type: type || category || 'capital',
      vendorName,
      vendorAddress,
      contactNumber,
      email,
      billNo,
      billDate: new Date(billDate),
      billFileId: req.file.id,
      items: parsedItems,
      ...otherFields
    };

    const asset = await Asset.create(assetData);
    await asset.populate('department');

    // Create audit log
    await AuditLog.create({
      entityType: 'ASSET',
      entityId: asset._id,
      action: 'CREATE',
      userId: req.user._id,
      userName: req.user.name,
      changes: { created: assetData },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: asset
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
```

### 3.2 Update Asset with Audit Trail
```javascript
export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, officerName, items, ...updateData } = req.body;

    // Validate reason for updates
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required for asset updates'
      });
    }

    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Store original data for audit
    const originalData = asset.toObject();

    // Handle file update
    if (req.file) {
      updateData.billFileId = req.file.id;
    }

    // Parse items if provided
    if (items) {
      try {
        updateData.items = JSON.parse(items);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid items format'
        });
      }
    }

    // Update asset
    Object.assign(asset, updateData);
    await asset.save();
    await asset.populate('department');

    // Create audit log
    await AuditLog.create({
      entityType: 'ASSET',
      entityId: asset._id,
      action: 'UPDATE',
      userId: req.user._id,
      userName: req.user.name,
      officerName,
      reason,
      changes: {
        before: originalData,
        after: asset.toObject()
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
```

### 3.3 Asset Query with Filtering
```javascript
export const getAssets = async (req, res) => {
  try {
    const {
      departmentId,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      search
    } = req.query;

    // Build query
    let query = {};

    // Role-based filtering
    if (req.user.role === 'department-officer') {
      query.department = req.user.department._id;
    } else if (departmentId) {
      query.department = departmentId;
    }

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
        { billNo: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const assets = await Asset.find(query)
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Asset.countDocuments(query);

    res.json({
      success: true,
      data: {
        assets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalAssets: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 4. Report Controller

### 4.1 Department Report Generation
```javascript
// File: backend/src/controllers/reportController.js
export const getDepartmentReport = async (req, res) => {
  try {
    const { departmentId, startDate, endDate, type } = req.query;

    // Build aggregation pipeline
    const pipeline = [];

    // Match stage
    const matchStage = {};
    if (departmentId) matchStage.department = mongoose.Types.ObjectId(departmentId);
    if (type) matchStage.type = type;
    if (startDate || endDate) {
      matchStage.billDate = {};
      if (startDate) matchStage.billDate.$gte = new Date(startDate);
      if (endDate) matchStage.billDate.$lte = new Date(endDate);
    }
    pipeline.push({ $match: matchStage });

    // Lookup department details
    pipeline.push({
      $lookup: {
        from: 'departments',
        localField: 'department',
        foreignField: '_id',
        as: 'departmentInfo'
      }
    });

    // Group by department
    pipeline.push({
      $group: {
        _id: '$department',
        departmentName: { $first: { $arrayElemAt: ['$departmentInfo.name', 0] } },
        totalAssets: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        capitalAssets: {
          $sum: { $cond: [{ $eq: ['$type', 'capital'] }, 1, 0] }
        },
        revenueAssets: {
          $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, 1, 0] }
        },
        capitalAmount: {
          $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$totalAmount', 0] }
        },
        revenueAmount: {
          $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$totalAmount', 0] }
        }
      }
    });

    // Sort by total amount
    pipeline.push({ $sort: { totalAmount: -1 } });

    const report = await Asset.aggregate(pipeline);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### 4.2 Excel Export Implementation
```javascript
export const exportToExcel = async (req, res) => {
  try {
    const { departmentId, type, startDate, endDate } = req.query;

    // Build query
    let query = {};
    if (departmentId) query.department = departmentId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    // Fetch assets
    const assets = await Asset.find(query)
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Assets Report');

    // Define columns
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 10 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Item Name', key: 'itemName', width: 30 },
      { header: 'Vendor Name', key: 'vendorName', width: 25 },
      { header: 'Bill No', key: 'billNo', width: 15 },
      { header: 'Bill Date', key: 'billDate', width: 15 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 }
    ];

    // Add data rows
    assets.forEach((asset, index) => {
      worksheet.addRow({
        sno: index + 1,
        department: asset.department.name,
        itemName: asset.itemName || 'Multiple Items',
        vendorName: asset.vendorName,
        billNo: asset.billNo,
        billDate: asset.billDate.toLocaleDateString(),
        type: asset.type,
        totalAmount: asset.totalAmount
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=assets-report.xlsx');

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 5. Admin Controller

### 5.1 Database Overview
```javascript
// File: backend/src/controllers/adminController.js
export const getDatabaseOverview = async (req, res) => {
  try {
    const [
      usersCount,
      departmentsCount,
      assetsCount,
      auditLogsCount,
      announcementsCount,
      recentAssets,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      Department.countDocuments(),
      Asset.countDocuments(),
      AuditLog.countDocuments(),
      Announcement.countDocuments(),
      Asset.find().populate('department').sort({ createdAt: -1 }).limit(5),
      User.find().populate('department').sort({ createdAt: -1 }).limit(5)
    ]);

    // Calculate total asset value
    const assetValueResult = await Asset.aggregate([
      { $group: { _id: null, totalValue: { $sum: '$totalAmount' } } }
    ]);
    const totalAssetValue = assetValueResult[0]?.totalValue || 0;

    res.json({
      success: true,
      data: {
        collections: {
          users: usersCount,
          departments: departmentsCount,
          assets: assetsCount,
          auditLogs: auditLogsCount,
          announcements: announcementsCount
        },
        totalAssetValue,
        recentAssets,
        recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### 5.2 User Management
```javascript
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, employeeId } = req.body;

    // Validate admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can create users'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role,
      employeeId
    };

    if (role === 'department-officer' && department) {
      userData.department = department;
    }

    const user = await User.create(userData);
    await user.populate('department');

    // Create audit log
    await AuditLog.create({
      entityType: 'USER',
      entityId: user._id,
      action: 'CREATE',
      userId: req.user._id,
      userName: req.user.name,
      changes: { created: userData },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
```

## 6. Announcement Controller

### 6.1 Create Announcement
```javascript
// File: backend/src/controllers/announcementController.js
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, targetDepartments, expiresAt } = req.body;

    // Validate admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can create announcements'
      });
    }

    const announcementData = {
      title,
      message,
      type: type || 'general',
      createdBy: req.user._id
    };

    if (targetDepartments && targetDepartments.length > 0) {
      announcementData.targetDepartments = targetDepartments;
    }

    if (expiresAt) {
      announcementData.expiresAt = new Date(expiresAt);
    }

    const announcement = await Announcement.create(announcementData);
    await announcement.populate(['createdBy', 'targetDepartments']);

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
```

### 6.2 Get Announcements with Role-based Filtering
```javascript
export const getAnnouncements = async (req, res) => {
  try {
    let query = { isActive: true, expiresAt: { $gt: new Date() } };

    // Role-based filtering
    if (req.user.role === 'department-officer') {
      query.$or = [
        { targetDepartments: { $size: 0 } }, // General announcements
        { targetDepartments: req.user.department._id } // Department-specific
      ];
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name')
      .populate('targetDepartments', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 7. Error Handling & Middleware

### 7.1 Global Error Handler
```javascript
// File: backend/src/middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};
```

### 7.2 Role-based Authorization
```javascript
// File: backend/src/middleware/auth.js
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};
```

---

**End of Part 3**

*Continue to Part 4 for Frontend Architecture & Components*