# Material Inward Management System (MIMS)
## Comprehensive Project Report - Part 5 of 8

---

# PART 5: AUTHENTICATION & SECURITY IMPLEMENTATION

## 1. Authentication Architecture

### 1.1 JWT-Based Authentication System
```javascript
// File: backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

### 1.2 Role-Based Authorization
```javascript
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

// Usage examples
app.get('/api/admin/users', protect, authorize('admin'), getUsersController);
app.get('/api/reports/all', protect, authorize('admin', 'chief-administrative-officer'), getAllReportsController);
```

### 1.3 Password Security Implementation
```javascript
// File: backend/src/models/User.js
import bcrypt from 'bcryptjs';

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

## 2. Frontend Authentication Implementation

### 2.1 Authentication Context with Session Storage
```typescript
// File: frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          sessionStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    sessionStorage.setItem('token', response.token);
    setUser(response.user);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 2.2 Protected Route Implementation
```typescript
// File: frontend/src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user?.role || '')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

## 3. Security Middleware Implementation

### 3.1 Security Headers with Helmet
```javascript
// File: backend/src/server.js
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 3.2 Rate Limiting Implementation
```javascript
import rateLimit from 'express-rate-limit';

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  }
});

app.use(generalLimiter);
app.use('/api/auth', authLimiter);
```

### 3.3 Input Validation and Sanitization
```javascript
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Custom validation middleware
export const validateAssetInput = (req, res, next) => {
  const { vendorName, billNo, contactNumber } = req.body;

  // Sanitize vendor name
  if (vendorName && typeof vendorName === 'string') {
    req.body.vendorName = vendorName.trim().replace(/[<>]/g, '');
  }

  // Validate bill number format
  if (billNo && !/^[A-Za-z0-9\-\/]+$/.test(billNo)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid bill number format'
    });
  }

  // Validate contact number
  if (contactNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(contactNumber)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid contact number format'
    });
  }

  next();
};
```

## 4. Password Reset Security System

### 4.1 Password Reset Request Model
```javascript
// File: backend/src/models/PasswordResetRequest.js
import mongoose from 'mongoose';

const passwordResetRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
```

### 4.2 Secure Password Reset Implementation
```javascript
// File: backend/src/controllers/authController.js
import crypto from 'crypto';

export const requestPasswordReset = async (req, res) => {
  try {
    const { email, reason } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check for existing pending request
    const existingRequest = await PasswordResetRequest.findOne({
      userId: user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'Password reset request already pending'
      });
    }

    // Create password reset request
    await PasswordResetRequest.create({
      userId: user._id,
      reason
    });

    res.json({
      success: true,
      message: 'Password reset request submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const approvePasswordReset = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    // Only admins can approve
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can approve password reset requests'
      });
    }

    const request = await PasswordResetRequest.findById(requestId).populate('userId');
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Password reset request not found'
      });
    }

    // Generate secure temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    // Update user password
    const user = await User.findById(request.userId._id);
    user.password = tempPassword;
    await user.save();

    // Update request status
    request.status = 'approved';
    request.processedAt = new Date();
    request.processedBy = req.user._id;
    request.adminNotes = adminNotes;
    await request.save();

    res.json({
      success: true,
      data: {
        tempPassword,
        message: 'Password reset approved. Temporary password generated.'
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

## 5. File Upload Security

### 5.1 Secure File Upload with GridFS
```javascript
// File: backend/src/middleware/upload.js
import multer from 'multer';
import GridFSBucket from 'mongodb';
import mongoose from 'mongoose';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export const uploadToGridFS = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });

  const uploadStream = bucket.openUploadStream(req.file.originalname, {
    metadata: {
      originalName: req.file.originalname,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    }
  });

  uploadStream.end(req.file.buffer);

  uploadStream.on('finish', () => {
    req.file.id = uploadStream.id;
    next();
  });

  uploadStream.on('error', (error) => {
    res.status(500).json({
      success: false,
      error: 'File upload failed'
    });
  });
};
```

### 5.2 File Access Control
```javascript
export const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Verify user has access to this file
    const asset = await Asset.findOne({ billFileId: fileId });
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check permissions
    if (req.user.role === 'department-officer' && 
        asset.department.toString() !== req.user.department._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    const downloadStream = bucket.openDownloadStream(mongoose.Types.ObjectId(fileId));
    
    downloadStream.on('error', () => {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    });

    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 6. Audit Trail Security

### 6.1 Comprehensive Audit Logging
```javascript
// File: backend/src/middleware/auditLogger.js
import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async (entityType, entityId, action, userId, userName, changes = null, reason = null, officerName = null, req = null) => {
  try {
    const auditData = {
      entityType,
      entityId,
      action,
      userId,
      userName,
      changes,
      reason,
      officerName
    };

    if (req) {
      auditData.ipAddress = req.ip;
      auditData.userAgent = req.get('User-Agent');
    }

    await AuditLog.create(auditData);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// Middleware to automatically log API calls
export const auditMiddleware = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log successful operations
      if (res.statusCode < 400 && req.user) {
        createAuditLog(
          'API_CALL',
          req.params.id || 'N/A',
          action,
          req.user._id,
          req.user.name,
          {
            method: req.method,
            url: req.originalUrl,
            body: req.body
          },
          null,
          null,
          req
        );
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};
```

### 6.2 Audit Log Query Security
```javascript
export const getAuditLogs = async (req, res) => {
  try {
    // Only admins can view audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    const {
      entityType,
      action,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    let query = {};

    if (entityType) query.entityType = entityType;
    if (action) query.action = action;
    if (userId) query.userId = userId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const auditLogs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        auditLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalLogs: total
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

## 7. Session Management

### 7.1 Session Storage Strategy
```typescript
// File: frontend/src/services/authService.ts
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    
    // Store token in sessionStorage (auto-logout on browser close)
    sessionStorage.setItem('token', response.data.data.token);
    
    return response.data.data;
  },

  logout: () => {
    sessionStorage.removeItem('token');
    // Clear any other sensitive data
    sessionStorage.clear();
  },

  getCurrentUser: async () => {
    const token = sessionStorage.getItem('token');
    if (!token) throw new Error('No token found');
    
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  isTokenValid: () => {
    const token = sessionStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }
};
```

### 7.2 Automatic Token Refresh
```typescript
// File: frontend/src/services/api.ts
import axios from 'axios';

// Response interceptor for token handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear invalid token
      sessionStorage.removeItem('token');
      
      // Redirect to login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
```

## 8. Security Best Practices Implemented

### 8.1 Environment Variables Security
```javascript
// File: backend/config.env.template
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/assetflow
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d
```

### 8.2 CORS Configuration
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 8.3 Security Headers Implementation
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

---

**End of Part 5**

*Continue to Part 6 for Key Features & Business Logic*