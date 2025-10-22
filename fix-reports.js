// Script to replace all localhost URLs in Reports
const fs = require('fs');

const filePath = 'c:/Users/ratan/Desktop/assetflow-stream/frontend/src/pages/Reports.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all localhost URLs
content = content.replace(/http:\/\/localhost:5000/g, '${API_URL}');

// Add API_URL declaration at the start of functions that use it
const functions = ['downloadSingleBill', 'handleItemUpdate', 'handleItemDelete'];

functions.forEach(funcName => {
  const regex = new RegExp(`(const ${funcName} = async \\([^)]*\\) => {\\s*)((?:(?!const API_URL).)*)(\\$\\{API_URL\\})`, 'gs');
  content = content.replace(regex, (match, start, middle, apiUrl) => {
    if (!middle.includes('const API_URL')) {
      return start + '\n    const API_URL = import.meta.env.VITE_API_URL || \'https://mims-1.onrender.com\';\n    ' + middle + apiUrl;
    }
    return match;
  });
});

fs.writeFileSync(filePath, content);
console.log('Fixed Reports.tsx');