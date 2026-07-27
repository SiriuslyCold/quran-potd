const fs = require('fs');
const path = require('path');

// 1. Define paths to your target files
const inputPath = path.join(__dirname, 'quran-text.json');
const outputPath = path.join(__dirname, 'quran-text-indexed.json');

try {
  // 2. Read and parse the current JSON structure
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const versesArray = JSON.parse(rawData);

  console.log(`Loaded ${versesArray.length} verses. Injecting sequential indices...`);

  // 3. Map through the array and inject the 1-based index property
  const indexedArray = versesArray.map((verse, idx) => {
    return {
      index: idx + 1, // Creates a sequence from 1 to 6236
      ...verse        // Spreads out your existing fields (surah, verse, text)
    };
  });

  // 4. Save the modified payload into a new file format cleanly
  fs.writeFileSync(outputPath, JSON.stringify(indexedArray, null, 2), 'utf8');
  console.log(`Success! New indexed file saved to: ${outputPath}`);

} catch (error) {
  console.error('An error occurred during processing:', error.message);
}