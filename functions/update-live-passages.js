const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
const fs = require("fs");
const path = require("path");

async function run() {
  try {
    console.log("Initializing Firebase Admin SDK...");
    let bucketName = "quran-potd.firebasestorage.app";
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucketName
    });

    let bucket = admin.storage().bucket();

    // Verify bucket connection
    try {
      console.log(`Testing storage bucket '${bucketName}'...`);
      await bucket.getFiles({ maxResults: 1 });
      console.log(`Successfully connected to '${bucketName}'`);
    } catch (err) {
      console.warn(`Could not connect to '${bucketName}', falling back to 'quran-potd.appspot.com'...`);
      await admin.app().delete();
      bucketName = "quran-potd.appspot.com";
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: bucketName
      });
      bucket = admin.storage().bucket();
      await bucket.getFiles({ maxResults: 1 });
      console.log(`Successfully connected to fallback '${bucketName}'`);
    }

    const db = admin.firestore();

    // Load new Uthmani text
    const quranTextPath = path.join(__dirname, "quran-text.json");
    console.log(`Loading new Uthmani text from ${quranTextPath}...`);
    const quranText = JSON.parse(fs.readFileSync(quranTextPath, "utf8"));

    const prefixes = ["archive/en/passage_", "archive/ms/passage_"];
    let totalUpdated = 0;

    for (const prefix of prefixes) {
      console.log(`Listing files with prefix: ${prefix}...`);
      const [files] = await bucket.getFiles({ prefix });
      console.log(`Found ${files.length} files.`);

      for (const file of files) {
        if (!file.name.endsWith(".json")) continue;

        // Skip search index
        if (file.name.includes("search_index")) continue;

        const isDefault = file.name.endsWith("_default.json");
        let dateStr;
        if (isDefault) {
          const dateMatch = file.name.match(/passage_(.*?)_default\.json/);
          dateStr = dateMatch ? dateMatch[1] : null;
        } else {
          const dateMatch = file.name.match(/passage_(.*?)\.json/);
          dateStr = dateMatch ? dateMatch[1] : null;
        }

        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          console.log(`Skipping non-date file: ${file.name}`);
          continue;
        }

        console.log(`Processing file: ${file.name} (Date: ${dateStr})`);

        try {
          const [content] = await file.download();
          const payload = JSON.parse(content.toString("utf8"));

          const surahId = payload.meta.surahId;
          let changed = false;

          if (payload.translations && Array.isArray(payload.translations)) {
            payload.translations = payload.translations.map(t => {
              const verseNum = Number(t.verse);
              const match = quranText.find(
                entry => entry.surah === surahId && entry.verse === verseNum
              );
              if (match && match.text !== t.arabic) {
                t.arabic = match.text;
                changed = true;
              }
              return t;
            });
          }

          if (changed) {
            // Write back to Storage
            await file.save(JSON.stringify(payload, null, 2), {
              contentType: "application/json",
              metadata: { cacheControl: "public, max-age=86400" }
            });
            console.log(` -> Updated Storage file: ${file.name}`);

            // Sync to Firestore
            const lang = prefix.includes("/en/") ? "en" : "ms";
            const docId = isDefault ? `${lang}_${dateStr}_default` : `${lang}_${dateStr}`;
            await db.collection("passages").doc(docId).set(payload);
            console.log(` -> Synced to Firestore doc: ${docId}`);

            totalUpdated++;
          } else {
            console.log(` -> No changes needed for: ${file.name}`);
          }
        } catch (fileErr) {
          console.error(`Error processing file ${file.name}:`, fileErr.message);
        }
      }
    }

    console.log(`\nMigration completed. Total files updated: ${totalUpdated}`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed with fatal error:", error);
    process.exit(1);
  }
}

run();
