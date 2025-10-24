const fs = require('fs');
const path = require('path');

const frontendDir = './frontend/src';
const oldUrl = 'http://localhost:5000';
const newUrl = 'https://mims-1.onrender.com';

function replaceInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(oldUrl)) {
      const updatedContent = content.replace(new RegExp(oldUrl, 'g'), newUrl);
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  });
}

console.log(`Switching from ${oldUrl} to ${newUrl}...`);
processDirectory(frontendDir);
console.log('URL switch completed!');