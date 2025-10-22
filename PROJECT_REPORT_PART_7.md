# Material Inward Management System (MIMS)
## Comprehensive Project Report - Part 7 of 8

---

# PART 7: DEPLOYMENT & CONFIGURATION

## 1. Environment Configuration

### 1.1 Backend Environment Setup
```bash
# File: backend/config.env.production
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mims_production
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com
```

```bash
# File: backend/config.env.development
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mims_development
JWT_SECRET=development-jwt-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 1.2 Frontend Environment Configuration
```bash
# File: frontend/.env.production
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Material Inward Management System
VITE_APP_VERSION=1.0.0
```

```bash
# File: frontend/.env.development
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=MIMS Development
VITE_APP_VERSION=1.0.0-dev
```

## 2. Database Setup & Migration

### 2.1 MongoDB Atlas Configuration
```javascript
// File: backend/src/config/database.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }

    // Create indexes
    await createIndexes();
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1, department: 1 });
    
    // Asset indexes
    await db.collection('assets').createIndex({ department: 1, type: 1 });
    await db.collection('assets').createIndex({ billDate: -1 });
    await db.collection('assets').createIndex({ vendorName: 1 });
    await db.collection('assets').createIndex({ createdAt: -1 });
    
    // Department indexes
    await db.collection('departments').createIndex({ code: 1 }, { unique: true });
    await db.collection('departments').createIndex({ name: 1 }, { unique: true });
    
    // Audit log indexes
    await db.collection('auditlogs').createIndex({ entityType: 1, entityId: 1 });
    await db.collection('auditlogs').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('auditlogs').createIndex({ createdAt: -1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

export default connectDB;
```

### 2.2 Database Seeding Scripts
```javascript
// File: backend/seedProduction.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Department from './src/models/Department.js';
import User from './src/models/User.js';

dotenv.config({ path: './config.env' });

const seedProduction = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed departments
    const departments = [
      { name: 'Computer Science & Engineering', code: 'CSE', type: 'academic' },
      { name: 'Electronics & Communication', code: 'ECE', type: 'academic' },
      { name: 'Mechanical Engineering', code: 'MECH', type: 'academic' },
      { name: 'Civil Engineering', code: 'CIVIL', type: 'academic' },
      { name: 'Administration', code: 'ADMIN', type: 'administrative' },
      { name: 'Library', code: 'LIB', type: 'support' },
      { name: 'Maintenance', code: 'MAINT', type: 'support' }
    ];

    for (const dept of departments) {
      await Department.findOneAndUpdate(
        { code: dept.code },
        dept,
        { upsert: true, new: true }
      );
    }
    console.log('Departments seeded successfully');

    // Create admin user
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'System Administrator',
        email: 'admin@yourdomain.com',
        password: 'ChangeThisPassword123!',
        role: 'admin'
      });
      console.log('Admin user created successfully');
      console.log('IMPORTANT: Change the admin password after first login!');
    }

    console.log('Production seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedProduction();
```

## 3. Build & Deployment Scripts

### 3.1 Backend Deployment Scripts
```json
// File: backend/package.json - Scripts section
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "build": "echo 'No build step required for Node.js'",
    "seed:dev": "node seedDepartments.js && node seedUsers.js",
    "seed:prod": "node seedProduction.js",
    "test": "echo 'Tests not implemented yet'",
    "lint": "eslint src/",
    "deploy": "npm run seed:prod && npm start"
  }
}
```

```bash
# File: backend/deploy.sh
#!/bin/bash

echo "Starting backend deployment..."

# Install dependencies
npm ci --only=production

# Run database seeding (only if needed)
if [ "$SEED_DB" = "true" ]; then
  echo "Seeding database..."
  npm run seed:prod
fi

# Start the application
echo "Starting application..."
npm start
```

### 3.2 Frontend Build Configuration
```typescript
// File: frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['axios', 'framer-motion']
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

```bash
# File: frontend/deploy.sh
#!/bin/bash

echo "Starting frontend deployment..."

# Install dependencies
npm ci

# Build for production
npm run build

# Copy built files to web server directory
if [ -d "dist" ]; then
  echo "Build successful, copying files..."
  cp -r dist/* /var/www/html/
  echo "Frontend deployment completed"
else
  echo "Build failed!"
  exit 1
fi
```

## 4. Docker Configuration

### 4.1 Backend Dockerfile
```dockerfile
# File: backend/Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### 4.2 Frontend Dockerfile
```dockerfile
# File: frontend/Dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 4.3 Docker Compose Configuration
```yaml
# File: docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: mims-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: mims
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    ports:
      - "27017:27017"
    networks:
      - mims-network

  backend:
    build: ./backend
    container_name: mims-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:${MONGO_ROOT_PASSWORD}@mongodb:27017/mims?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    networks:
      - mims-network
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build: ./frontend
    container_name: mims-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - mims-network

volumes:
  mongodb_data:

networks:
  mims-network:
    driver: bridge
```

### 4.4 Environment Variables for Docker
```bash
# File: .env
MONGO_ROOT_PASSWORD=your-secure-mongo-password
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
```

## 5. Nginx Configuration

### 5.1 Production Nginx Configuration
```nginx
# File: frontend/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api/ {
            proxy_pass http://backend:5000/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Security
        location ~ /\. {
            deny all;
        }
    }
}
```

## 6. SSL/HTTPS Configuration

### 6.1 Let's Encrypt SSL Setup
```bash
# File: ssl-setup.sh
#!/bin/bash

# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Add cron job for automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 6.2 HTTPS Nginx Configuration
```nginx
# File: nginx-ssl.conf
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;

    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    root /usr/share/nginx/html;
    index index.html;

    # Rest of configuration...
}
```

## 7. Monitoring & Logging

### 7.1 Application Logging
```javascript
// File: backend/src/utils/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mims-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### 7.2 Health Check Endpoints
```javascript
// File: backend/src/routes/healthRoutes.js
import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };

  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = error.message;
    res.status(503).json(healthCheck);
  }
});

router.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

export default router;
```

## 8. Backup & Recovery

### 8.1 Database Backup Script
```bash
# File: backup.sh
#!/bin/bash

# Configuration
MONGO_HOST="localhost"
MONGO_PORT="27017"
MONGO_DB="mims"
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mongodump --host $MONGO_HOST:$MONGO_PORT --db $MONGO_DB --out $BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/mims_backup_$DATE.tar.gz -C $BACKUP_DIR $DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mims_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: mims_backup_$DATE.tar.gz"
```

### 8.2 Automated Backup with Cron
```bash
# Add to crontab (crontab -e)
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/mims-backup.log 2>&1

# Weekly full backup at 3 AM on Sundays
0 3 * * 0 /path/to/full-backup.sh >> /var/log/mims-backup.log 2>&1
```

## 9. Performance Optimization

### 9.1 Database Optimization
```javascript
// File: backend/src/config/database.js - Optimized connection
const connectDB = async () => {
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    bufferMaxEntries: 0,
    // Enable compression
    compressors: ['snappy', 'zlib'],
    // Read preference
    readPreference: 'secondaryPreferred',
    // Write concern
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 1000
    }
  };

  await mongoose.connect(process.env.MONGODB_URI, options);
};
```

### 9.2 Frontend Performance Optimization
```typescript
// File: frontend/src/utils/performance.ts
import { lazy } from 'react';

// Lazy load components
export const LazyAdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
export const LazyReports = lazy(() => import('@/pages/Reports'));
export const LazyCapitalForm = lazy(() => import('@/pages/CapitalForm'));

// Image optimization
export const optimizeImage = (file: File, maxWidth: number = 800): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        resolve(new File([blob!], file.name, { type: file.type }));
      }, file.type, 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
};
```

---

**End of Part 7**

*Continue to Part 8 for Testing, Performance & Future Enhancements*