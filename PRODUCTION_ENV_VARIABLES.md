# Production Environment Variables

## Backend Environment Variables (`config.env`)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/assetflow
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
CORS_ORIGIN=https://your-frontend-domain.netlify.app
```

## Frontend Environment Variables (`.env`)

```env
VITE_API_URL=https://mims-1.onrender.com/api
```

## Deployment Platform Specific

### Render (Backend)
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/assetflow
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
```

### Netlify (Frontend)
```env
VITE_API_URL=https://mims-1.onrender.com/api
```

## Security Notes
- Use strong, unique JWT_SECRET (minimum 32 characters)
- Replace MongoDB credentials with actual production values
- Update CORS_ORIGIN with your actual frontend domain
- Never commit these values to version control