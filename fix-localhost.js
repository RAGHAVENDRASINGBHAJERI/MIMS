// Script to replace all localhost URLs in AdminDashboard
const fs = require('fs');

const filePath = 'c:/Users/ratan/Desktop/assetflow-stream/frontend/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all localhost URLs
content = content.replace(/http:\/\/localhost:5000/g, '${API_URL}');

// Add API_URL declaration at the start of each function
const functions = [
  'fetchAnnouncements',
  'toggleAnnouncementStatus', 
  'deleteAnnouncement',
  'handleCreateAnnouncement',
  'fetchDatabaseStats',
  'fetchAuditLogs',
  'exportAuditLogs',
  'approvePasswordReset',
  'rejectPasswordReset'
];

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
console.log('Fixed AdminDashboard.tsx');