// Script to replace all localStorage token references with sessionStorage
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
  
  // Replace localStorage.getItem('token') with sessionStorage.getItem('token')
  if (content.includes("localStorage.getItem('token')")) {
    content = content.replace(/localStorage\.getItem\('token'\)/g, "sessionStorage.getItem('token')");
    changed = true;
  }
  
  // Replace localStorage.setItem('token', with sessionStorage.setItem('token',
  if (content.includes("localStorage.setItem('token'")) {
    content = content.replace(/localStorage\.setItem\('token'/g, "sessionStorage.setItem('token'");
    changed = true;
  }
  
  // Replace localStorage.removeItem('token') with sessionStorage.removeItem('token')
  if (content.includes("localStorage.removeItem('token')")) {
    content = content.replace(/localStorage\.removeItem\('token'\)/g, "sessionStorage.removeItem('token')");
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
});

console.log('All token storage references updated to sessionStorage');