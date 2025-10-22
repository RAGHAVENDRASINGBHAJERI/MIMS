// Script to hardcode API URL for production
const fs = require('fs');
const path = require('path');

function findFiles(dir, extension) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findFiles(fullPath, extension));
    } else if (item.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const srcDir = 'c:/Users/ratan/Desktop/assetflow-stream/frontend/src';
const files = findFiles(srcDir, '.tsx').concat(findFiles(srcDir, '.ts'));

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Replace environment variable references with hardcoded URL
  if (content.includes("import.meta.env.VITE_API_URL || 'https://mims-1.onrender.com'")) {
    content = content.replace(/import\.meta\.env\.VITE_API_URL \|\| 'https:\/\/mims-1\.onrender\.com'/g, "'https://mims-1.onrender.com'");
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
});

console.log('All environment variable references hardcoded');