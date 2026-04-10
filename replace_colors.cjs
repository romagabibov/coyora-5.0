const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'AdminPanel.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/var\(--color-surface\)/g, '#f9fafb'); // gray-50
content = content.replace(/var\(--color-border\)/g, '#e5e7eb'); // gray-200
content = content.replace(/var\(--color-muted\)/g, '#6b7280'); // gray-500
content = content.replace(/var\(--color-bg\)/g, '#ffffff'); // white
content = content.replace(/var\(--color-text\)/g, '#000000'); // black

fs.writeFileSync(filePath, content);
console.log('Done');
