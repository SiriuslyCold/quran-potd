const fs = require('fs');
const path = require('path');

try {
  const src = path.join(__dirname, 'public/index.html');
  const dest = path.join(__dirname, 'functions/index.html');
  fs.copyFileSync(src, dest);
  console.log(`Successfully copied ${src} -> ${dest}`);
} catch (err) {
  console.error('Predeploy copy failed:', err);
  process.exit(1);
}
