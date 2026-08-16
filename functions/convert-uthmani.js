const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../quran-uthmani.txt');
const destPath = path.join(__dirname, 'quran-text.json');

console.log(`Reading from: ${srcPath}`);
const rawText = fs.readFileSync(srcPath, 'utf8');
const lines = rawText.split('\n');
const result = [];
let index = 1;

for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    const parts = line.split('|');
    if (parts.length >= 3) {
        const surah = parseInt(parts[0], 10);
        const verse = parseInt(parts[1], 10);
        const text = parts.slice(2).join('|').trim();
        result.push({
            index: index++,
            surah,
            verse,
            text
        });
    }
}

fs.writeFileSync(destPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`Successfully converted ${result.length} verses to ${destPath}`);
