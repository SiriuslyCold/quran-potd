const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

// 1. Initialize Storage with your local Service Account key
const storage = new Storage({
  keyFilename: './service-account.json'
});

// CHANGE THIS to your exact Firebase Storage bucket name (e.g., "your-project-id.appspot.com")
const BUCKET_NAME = 'YOUR_FIREBASE_BUCKET_NAME_HERE'; 
const bucket = storage.bucket(BUCKET_NAME);

async function syncExistingFilesToSearchIndex() {
  try {
    console.log(`Connecting to bucket: ${BUCKET_NAME}...`);
    
    // 2. Fetch all files inside the archive folder
    const [files] = await bucket.getFiles({ prefix: 'archive/' });
    
    // Filter down to only files that match our daily passage pattern
    const passageFiles = files.filter(file => file.name.startsWith('archive/passage_') && file.name.endsWith('.json'));
    
    console.log(`Found ${passageFiles.length} archived passage files to index.`);
    
    const searchIndex = [];

    // 3. Loop through and process each file sequentially
    for (const file of passageFiles) {
      console.log(`Processing: ${file.name}...`);
      
      // Download file content into memory buffer
      const [content] = await file.download();
      const parsedData = JSON.parse(content.toString('utf8'));
      
      // Extract the exact date from the filename (e.g., archive/passage_2026-06-30.json -> 2026-06-30)
      const dateMatch = file.name.match(/passage_(.*?)\.json/);
      const fileDate = dateMatch ? dateMatch[1] : 'Unknown';

      // 4. Extract and sanitize search parameters cleanly
      // Adjust keys if your index.js payload uses slightly different names (e.g., parsedPayload, text, etc.)
      const textTranslation = parsedData.translation || parsedData.text || '';
      const overview = parsedData.overview || '';
      
      // Handle keyword tasreef parsing carefully whether stored as array or strings
      let tasreefKeywords = [];
      if (parsedData.tasreef) {
        tasreefKeywords = Array.isArray(parsedData.tasreef) 
          ? parsedData.tasreef 
          : [parsedData.tasreef];
      } else if (parsedData.keywords) {
        tasreefKeywords = Array.isArray(parsedData.keywords) ? parsedData.keywords : [parsedData.keywords];
      }

      // 5. Append structured searchable row object into master array map
      searchIndex.push({
        date: fileDate,
        translation: textTranslation,
        overview: overview,
        tasreef: tasreefKeywords
      });
    }

    // 6. Write index file locally first for verification
    const localIndexName = 'search_index.json';
    fs.writeFileSync(localIndexName, JSON.stringify(searchIndex, null, 2), 'utf8');
    console.log(`\nSuccessfully built local index with ${searchIndex.length} entries.`);

    // 7. Upload the finalized master index file back to the root of your Storage Bucket
    console.log(`Uploading unified search_index.json back to Firebase Storage root...`);
    await bucket.upload(localIndexName, {
      destination: 'search_index.json',
      metadata: {
        contentType: 'application/json',
        cacheControl: 'public, max-age=3600' // cache for an hour to keep lookups performant
      }
    });

    console.log('Migration Complete! Your frontend client can now fetch this file directly.');

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

syncExistingFilesToSearchIndex();
