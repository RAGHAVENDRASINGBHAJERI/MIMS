// Script to switch all API URLs back to localhost:5000
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

const srcDir = './frontend/src';
const files = findFiles(srcDir, '.tsx').concat(findFiles(srcDir, '.ts'));

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Replace production URL with localhost
  if (content.includes("'https://mims-1.onrender.com'")) {
    content = content.replace(/'https:\/\/mims-1\.onrender\.com'/g, "'http://localhost:5000'");
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Switched to localhost: ${filePath}`);
  }
});

console.log('All API URLs switched to localhost:5000');