# Material Inward Management System (MIMS)
## Comprehensive Project Report - Part 2 of 8

---

# PART 2: DATABASE DESIGN & MODELS

## 1. Database Architecture Overview

### 1.1 Database Selection: MongoDB
MongoDB was chosen as the primary database for MIMS due to its:
- **Document-oriented structure**: Perfect for varying asset types
- **GridFS integration**: Efficient file storage for bill documents
- **Flexible schema**: Accommodates evolving business requirements
- **Scalability**: Horizontal scaling capabilities
- **JSON-like documents**: Natural fit with JavaScript/Node.js

### 1.2 Database Structure
```
MIMS Database
├── Collections
│   ├── users
│   ├── departments
│   ├── assets
│   ├── auditlogs
│   ├── announcements
│   └── passwordresets
└── GridFS
    ├── fs.files
    └── fs.chunks
```

## 2. Data Models & Schemas

### 2.1 User Model
```javascript
// File: backend/src/models/User.js
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'chief-administrative-officer', 'department-officer', 'user'],
    default: 'user'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: function() {
      return this.role === 'department-officer';
    }
  },
  employeeId: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true
});
```

**Key Features**:
- **Role-based access**: Four distinct user roles
- **Department association**: Required for department officers
- **Password hashing**: Pre-save middleware for bcrypt hashing
- **Email uniqueness**: Enforced at database level
- **Timestamps**: Automatic createdAt/updatedAt fields

### 2.2 Department Model
```javascript
// File: backend/src/models/Department.js
const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['academic', 'administrative', 'support'],
    default: 'academic'
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});
```

**Key Features**:
- **Unique constraints**: Name and code uniqueness
- **Department types**: Academic, administrative, support
- **Soft delete**: isActive flag for deactivation
- **Code standardization**: Automatic uppercase conversion

### 2.3 Asset Model (Complex Schema)
```javascript
// File: backend/src/models/Asset.js
const itemSchema = new mongoose.Schema({
  particulars: { type: String, trim: true },
  quantity: { type: Number, min: [0, 'Quantity cannot be negative'] },
  rate: { type: Number, min: [0, 'Rate cannot be negative'] },
  cgst: { type: Number, default: 0, min: [0, 'CGST cannot be negative'] },
  sgst: { type: Number, default: 0, min: [0, 'SGST cannot be negative'] },
  amount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 }
}, { _id: false });

const assetSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: {
      values: ['capital', 'revenue'],
      message: 'Category must be capital or revenue'
    }
  },
  type: {
    type: String,
    enum: ['capital', 'revenue'],
    default: 'capital',
    required: [true, 'Type is required']
  },
  // Legacy single-item fields
  itemName: { type: String, trim: true },
  quantity: { type: Number, min: [0, 'Quantity cannot be negative'] },
  pricePerItem: { type: Number, min: [0, 'Price cannot be negative'] },
  totalAmount: { type: Number, default: 0 },
  
  // Multi-item support
  items: {
    type: [itemSchema],
    default: []
  },
  
  // Vendor information
  vendorName: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  vendorAddress: {
    type: String,
    required: [true, 'Vendor address is required'],
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  
  // Bill information
  billNo: {
    type: String,
    required: [true, 'Bill number is required'],
    trim: true
  },
  billDate: {
    type: Date,
    required: [true, 'Bill date is required']
  },
  billFileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Bill file is required']
  },
  
  // Tax and financial fields
  collegeISRNo: { type: String, trim: true },
  itISRNo: { type: String, trim: true },
  igst: { type: Number, default: 0, min: [0, 'IGST cannot be negative'] },
  cgst: { type: Number, default: 0, min: [0, 'CGST cannot be negative'] },
  sgst: { type: Number, default: 0, min: [0, 'SGST cannot be negative'] },
  grandTotal: { type: Number, default: 0 },
  remark: { type: String, trim: true }
}, {
  timestamps: true
});
```

**Key Features**:
- **Hybrid design**: Supports both single and multi-item bills
- **Embedded items**: Array of item subdocuments
- **Automatic calculations**: Pre-save middleware for totals
- **File references**: GridFS file ID storage
- **Validation**: Comprehensive field validation
- **Tax support**: CGST, SGST, IGST calculations

### 2.4 Audit Log Model
```javascript
// File: backend/src/models/AuditLog.js
const auditLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    required: true,
    enum: ['ASSET', 'USER', 'DEPARTMENT', 'ASSET_ITEM']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  officerName: {
    type: String
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
  },
  reason: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});
```

**Key Features**:
- **Complete audit trail**: All system operations logged
- **Flexible changes**: Mixed type for storing any change data
- **User tracking**: Both user ID and name stored
- **Reason collection**: Mandatory reasons for modifications
- **Network info**: IP address and user agent tracking

### 2.5 Announcement Model
```javascript
// File: backend/src/models/Announcement.js
const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['general', 'urgent', 'report_reminder', 'budget_release'],
    default: 'general'
  },
  targetDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});
```

**Key Features**:
- **Targeted messaging**: Department-specific announcements
- **Message types**: Different priority levels
- **Auto-expiration**: Automatic cleanup after 30 days
- **Creator tracking**: Links to admin user
- **Soft delete**: isActive flag for management

## 3. Database Relationships

### 3.1 Entity Relationship Diagram
```
Users (1) ──────── (0..1) Departments
  │                         │
  │                         │
  │ (1)                (1) │
  │                         │
  ▼                         ▼
AuditLogs              Assets (N)
  │                         │
  │                         │
  │ (N)                (1) │
  │                         │
  ▼                         ▼
Announcements ──────── GridFS Files
```

### 3.2 Relationship Details

#### User-Department Relationship
- **Type**: One-to-Many (Optional)
- **Description**: Department officers belong to one department
- **Implementation**: ObjectId reference with conditional requirement

#### Asset-Department Relationship
- **Type**: Many-to-One
- **Description**: Assets belong to specific departments
- **Implementation**: Required ObjectId reference with population

#### Asset-File Relationship
- **Type**: One-to-One
- **Description**: Each asset has one bill file
- **Implementation**: GridFS ObjectId reference

#### User-AuditLog Relationship
- **Type**: One-to-Many
- **Description**: Users generate multiple audit entries
- **Implementation**: ObjectId reference with user details

## 4. Database Indexing Strategy

### 4.1 Primary Indexes
```javascript
// User indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, department: 1 });

// Asset indexes
assetSchema.index({ department: 1, type: 1 });
assetSchema.index({ billDate: -1 });
assetSchema.index({ vendorName: 1 });
assetSchema.index({ createdAt: -1 });

// Department indexes
departmentSchema.index({ code: 1 }, { unique: true });
departmentSchema.index({ name: 1 }, { unique: true });

// Audit log indexes
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// Announcement indexes
announcementSchema.index({ targetDepartments: 1, isActive: 1 });
announcementSchema.index({ expiresAt: 1 });
```

### 4.2 Compound Indexes
- **Asset queries**: `{ department: 1, type: 1, billDate: -1 }`
- **User lookup**: `{ role: 1, department: 1, isActive: 1 }`
- **Audit trail**: `{ entityType: 1, entityId: 1, createdAt: -1 }`

## 5. Data Validation & Constraints

### 5.1 Schema-Level Validation
```javascript
// Email validation
email: {
  type: String,
  required: true,
  validate: {
    validator: function(v) {
      return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
    },
    message: 'Please enter a valid email'
  }
}

// Phone number validation
contactNumber: {
  type: String,
  validate: {
    validator: function(v) {
      return /^[\+]?[1-9][\d]{0,15}$/.test(v);
    },
    message: 'Please enter a valid phone number'
  }
}

// Amount validation
totalAmount: {
  type: Number,
  min: [0, 'Amount cannot be negative'],
  validate: {
    validator: function(v) {
      return v >= 0 && v <= 999999999;
    },
    message: 'Amount must be between 0 and 999,999,999'
  }
}
```

### 5.2 Business Logic Validation
```javascript
// Pre-save middleware for asset calculations
assetSchema.pre('save', function(next) {
  if (Array.isArray(this.items) && this.items.length > 0) {
    this.items = this.items.map((item) => {
      const amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      const tax = amount * ((Number(item.cgst) || 0) + (Number(item.sgst) || 0)) / 100;
      return {
        ...item,
        amount,
        grandTotal: amount + tax
      };
    });
    this.totalAmount = this.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    this.grandTotal = this.items.reduce((sum, it) => sum + (Number(it.grandTotal) || 0), 0);
  }
  next();
});
```

## 6. GridFS File Storage

### 6.1 GridFS Configuration
```javascript
// File: backend/src/utils/gridfs.js
import mongoose from 'mongoose';
import GridFSBucket from 'mongodb';

let gfs;
let gridfsBucket;

export const initGridFS = () => {
  const conn = mongoose.connection;
  gridfsBucket = new GridFSBucket(conn.db, {
    bucketName: 'uploads'
  });
  
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
};
```

### 6.2 File Storage Strategy
- **Bucket Name**: 'uploads'
- **File Types**: PDF, DOC, DOCX, JPG, PNG
- **Size Limit**: 10MB per file
- **Metadata**: Original filename, upload date, user ID
- **Chunking**: Automatic for files > 255KB

## 7. Database Performance Optimization

### 7.1 Query Optimization Techniques
```javascript
// Efficient asset queries with population
const assets = await Asset.find({ department: departmentId })
  .populate('department', 'name code')
  .select('itemName totalAmount billDate vendorName')
  .sort({ createdAt: -1 })
  .limit(50)
  .lean(); // Returns plain objects for better performance

// Aggregation pipeline for reports
const departmentReport = await Asset.aggregate([
  { $match: { department: mongoose.Types.ObjectId(departmentId) } },
  { $group: {
    _id: '$type',
    totalAmount: { $sum: '$totalAmount' },
    count: { $sum: 1 }
  }},
  { $sort: { totalAmount: -1 } }
]);
```

### 7.2 Connection Optimization
```javascript
// Connection pooling configuration
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0
});
```

## 8. Data Migration & Seeding

### 8.1 Department Seeding
```javascript
// File: backend/seedDepartments.js
const departments = [
  { name: 'Computer Science', code: 'CS', type: 'academic' },
  { name: 'Electronics', code: 'EC', type: 'academic' },
  { name: 'Administration', code: 'ADMIN', type: 'administrative' }
];

const seedDepartments = async () => {
  for (const dept of departments) {
    await Department.findOneAndUpdate(
      { code: dept.code },
      dept,
      { upsert: true, new: true }
    );
  }
};
```

### 8.2 User Seeding
```javascript
// File: backend/seedUsers.js
const defaultAdmin = {
  name: 'System Administrator',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin'
};

const seedUsers = async () => {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (!existingAdmin) {
    await User.create(defaultAdmin);
  }
};
```

---

**End of Part 2**

*Continue to Part 3 for Backend API Architecture & Controllers*