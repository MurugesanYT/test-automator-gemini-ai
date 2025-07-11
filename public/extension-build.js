
// This file helps organize the extension files for Chrome
// Run this after building your React app to prepare the extension

const fs = require('fs');
const path = require('path');

// Copy necessary files to extension folder
const extensionDir = path.join(__dirname, 'extension');

// Create extension directory if it doesn't exist
if (!fs.existsSync(extensionDir)) {
  fs.mkdirSync(extensionDir, { recursive: true });
}

// Copy manifest.json
fs.copyFileSync(
  path.join(__dirname, 'manifest.json'),
  path.join(extensionDir, 'manifest.json')
);

// Copy background.js
fs.copyFileSync(
  path.join(__dirname, 'background.js'),
  path.join(extensionDir, 'background.js')
);

// Copy content.js
fs.copyFileSync(
  path.join(__dirname, 'content.js'),
  path.join(extensionDir, 'content.js')
);

// Copy content.css
fs.copyFileSync(
  path.join(__dirname, 'content.css'),
  path.join(extensionDir, 'content.css')
);

console.log('Extension files copied to public/extension/');
