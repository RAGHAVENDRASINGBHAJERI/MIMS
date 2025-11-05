# Deployment Guide

## Quick Environment Switching

### Using the Switch Script
```bash
# Switch to localhost development
node switch-env.js local

# Switch to production (Render API)
node switch-env.js production
```

## Manual Environment Configuration

### For Localhost Development
```bash
# Frontend (.env)
VITE_API_URL=http://localhost:5000

# Backend (config.env)
CORS_ORIGIN=http://localhost:5173
```

### For Production Deployment
```bash
# Frontend (.env.production)
VITE_API_URL=https://mims-1.onrender.com

# Backend (config.env)
CORS_ORIGIN=https://your-frontend-domain.netlify.app
```

## Development Workflow

1. **Local Development:**
   ```bash
   node switch-env.js local
   cd backend && npm start
   cd frontend && npm run dev
   ```

2. **Production Testing:**
   ```bash
   node switch-env.js production
   cd frontend && npm run build && npm run preview
   ```

3. **Deploy to Production:**
   ```bash
   # Backend: Already deployed on Render
   # Frontend: Deploy to Netlify with .env.production
   cd frontend && npm run build
   ```

## Environment Files Structure

```
assetflow-stream/
├── backend/
│   └── config.env                 # Backend environment
├── frontend/
│   ├── .env                      # Development (localhost)
│   ├── .env.local                # Local production testing
│   ├── .env.production           # Production deployment
│   └── .env.template             # Template file
├── switch-env.js                 # Environment switcher
└── ENVIRONMENT_VARIABLES.md      # Full documentation
```

## Current Configuration Status

- ✅ Backend: Supports both localhost and Render
- ✅ Frontend: Multiple environment files ready
- ✅ Auto-switching script available
- ✅ Production deployment files ready