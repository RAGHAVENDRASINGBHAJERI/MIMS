import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// Rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Data sanitization middleware
export const sanitizeData = [
  mongoSanitize(), // Prevent NoSQL injection
  xss() // Clean user input from malicious HTML
];

// Input validation middleware
export const validateInput = (req, res, next) => {
  // Remove any null bytes
  const sanitizeString = (str) => {
    if (typeof str === 'string') {
      return str.replace(/\0/g, '');
    }
    return str;
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          obj[key] = sanitizeObject(obj[key]);
        }
      }
    } else if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  
  next();
};

// File upload security middleware
export const validateFileUpload = (req, res, next) => {
  if (req.file) {
    const allowedTypes = ['application/pdf']; // Restrict to PDF only
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Only PDF files are allowed for bill uploads'
      });
    }

    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File size too large. Maximum allowed size is ${maxSize / (1024 * 1024)}MB`
      });
    }

    // Additional security checks
    if (req.file.originalname.includes('..') || req.file.originalname.includes('/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }

    // Validate file extension
    const allowedExtensions = ['.pdf'];
    const fileExtension = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        error: 'File must have .pdf extension'
      });
    }
  }
  next();
};
