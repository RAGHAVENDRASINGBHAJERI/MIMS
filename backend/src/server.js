import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import { initGridFS } from './utils/gridfs.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables
dotenv.config({ path: './config.env' });

// Connect to database
connectDB().then(() => {
  // Initialize GridFS after database connection
  initGridFS();
  console.log('GridFS initialized');
});

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084',
    'http://localhost:8085',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    name: 'AssetFlow API',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);


// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
