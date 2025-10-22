// Script to replace localStorage with sessionStorage for token retrieval
const fs = require('fs');

const files = [
  'c:/Users/ratan/Desktop/assetflow-stream/frontend/src/services/reportService.ts',
  'c:/Users/ratan/Desktop/assetflow-stream/frontend/src/services/assetService.ts'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/localStorage\.getItem\('token'\)/g, "sessionStorage.getItem('token')");
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  }
});

console.log('All token storage references fixed');