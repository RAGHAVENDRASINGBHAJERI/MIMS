# Environment Variables Configuration

## Backend Environment Variables (config.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://ModelGenie:Raghu123@cluster0.dxmpr5a.mongodb.net/assetflow?retryWrites=true&w=majority

# CORS - Switch between localhost and production
CORS_ORIGIN=http://localhost:5173

# JWT Security
JWT_SECRET=9edad5ecfac3a82150001c1324a961606429162c6dc0243ffd850e097c46fb4804276db27ccc55d6626c9c49df1cc1d21700011630e2035ae197c800c5f77d61

# GridFS
GRIDFS_BUCKET=bills

# Production CORS (uncomment for production)
# CORS_ORIGIN=https://your-frontend-domain.netlify.app
```

## Frontend Environment Variables

### Development (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=AssetFlow
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEVTOOLS=true
```

### Production (.env.production)
```env
VITE_API_URL=https://mims-1.onrender.com
VITE_APP_NAME=AssetFlow
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEVTOOLS=false
```

### Local Production Testing (.env.local)
```env
VITE_API_URL=https://mims-1.onrender.com
VITE_APP_NAME=AssetFlow
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEVTOOLS=true
```

## Quick Switch Commands

### Switch to Localhost Development
```bash
# Backend - Update config.env
CORS_ORIGIN=http://localhost:5173

# Frontend - Use .env file
VITE_API_URL=http://localhost:5000
```

### Switch to Production
```bash
# Backend - Update config.env  
CORS_ORIGIN=https://your-frontend-domain.netlify.app

# Frontend - Use .env.production
VITE_API_URL=https://mims-1.onrender.com
```

## Deployment Environment Variables

### Render Backend
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://ModelGenie:Raghu123@cluster0.dxmpr5a.mongodb.net/assetflow?retryWrites=true&w=majority
JWT_SECRET=9edad5ecfac3a82150001c1324a961606429162c6dc0243ffd850e097c46fb4804276db27ccc55d6626c9c49df1cc1d21700011630e2035ae197c800c5f77d61
GRIDFS_BUCKET=bills
CORS_ORIGIN=https://your-frontend-domain.netlify.app
PORT=5000
```

### Netlify Frontend
```env
VITE_API_URL=https://mims-1.onrender.com
VITE_APP_NAME=AssetFlow
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEVTOOLS=false
```