const fs = require('fs');
const path = require('path');

const mode = process.argv[2]; // 'local' or 'production'

if (!mode || !['local', 'production'].includes(mode)) {
  console.log('Usage: node switch-env.js [local|production]');
  console.log('  local      - Switch to localhost:5000');
  console.log('  production - Switch to render API');
  process.exit(1);
}

const envFiles = {
  local: {
    frontend: 'VITE_API_URL=http://localhost:5000\nVITE_APP_NAME=AssetFlow\nVITE_APP_VERSION=1.0.0\nVITE_ENABLE_DEVTOOLS=true',
    backend: 'CORS_ORIGIN=http://localhost:5173'
  },
  production: {
    frontend: 'VITE_API_URL=https://mims-1.onrender.com\nVITE_APP_NAME=AssetFlow\nVITE_APP_VERSION=1.0.0\nVITE_ENABLE_DEVTOOLS=false',
    backend: 'CORS_ORIGIN=https://your-frontend-domain.netlify.app'
  }
};

try {
  // Update frontend .env
  fs.writeFileSync('./frontend/.env', envFiles[mode].frontend);
  console.log(`✅ Updated frontend/.env for ${mode} mode`);
  
  // Update backend config.env CORS_ORIGIN line
  const configPath = './backend/config.env';
  if (fs.existsSync(configPath)) {
    let config = fs.readFileSync(configPath, 'utf8');
    config = config.replace(/CORS_ORIGIN=.*/g, envFiles[mode].backend);
    fs.writeFileSync(configPath, config);
    console.log(`✅ Updated backend/config.env CORS_ORIGIN for ${mode} mode`);
  }
  
  console.log(`\n🚀 Environment switched to ${mode.toUpperCase()} mode`);
  if (mode === 'local') {
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend:  http://localhost:5000');
  } else {
    console.log('   Frontend: Deploy to Netlify');
    console.log('   Backend:  https://mims-1.onrender.com');
  }
  
} catch (error) {
  console.error('❌ Error switching environment:', error.message);
}