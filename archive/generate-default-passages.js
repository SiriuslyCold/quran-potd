const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
const fs = require("fs");
const path = require("path");

async function migrate() {
  try {
    console.log("Initializing Firebase Admin SDK...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "quran-potd.firebasestorage.app"
    });

    let bucket = admin.storage().bucket();

    // Check if the primary bucket works, if not fall back to the appspot domain
    try {
      console.log("Testing storage bucket 'quran-potd.firebasestorage.app'...");
      await bucket.getFiles({ maxResults: 1 });
      console.log("Successfully connected to 'quran-potd.firebasestorage.app'");
    } catch (err) {
      console.warn("Could not connect to primary bucket, falling back to 'quran-potd.appspot.com'...");
      await admin.app().delete();
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "quran-potd.appspot.com"
      });
      bucket = admin.storage().bucket();
      await bucket.getFiles({ maxResults: 1 });
      console.log("Successfully connected to fallback 'quran-potd.appspot.com'");
    }

    const db = admin.firestore();
    const languages = ["en", "ms"];

    for (const lang of languages) {
      console.log(`\n========================================`);
      console.log(`Processing language: ${lang}`);
      console.log(`========================================`);

      const quranDefaultPath = path.join(__dirname, `quran-${lang}.json`);
      if (!fs.existsSync(quranDefaultPath)) {
        console.error(`Local file quran-${lang}.json does not exist. Skipping language ${lang}.`);
        continue;
      }
      
      console.log(`Loading local translation dictionary: ${quranDefaultPath}`);
      let rawText = fs.readFileSync(quranDefaultPath, "utf8");
      if (rawText.charCodeAt(0) === 0xFEFF) {
        rawText = rawText.slice(1);
      }
      const quranDefault = JSON.parse(rawText);

      const prefix = `archive/${lang}/passage_`;
      console.log(`Listing files with prefix: ${prefix}...`);
      const [files] = await bucket.getFiles({ prefix });

      console.log(`Found ${files.length} total files.`);
      
      let processedCount = 0;
      let skippedCount = 0;

      for (const file of files) {
        if (!file.name.endsWith(".json")) continue;
        if (file.name.endsWith("_default.json")) {
          skippedCount++;
          continue;
        }

        const dateMatch = file.name.match(/passage_(.*?)\.json/);
        if (!dateMatch) continue;
        const todayStr = dateMatch[1];

        console.log(`[Processing] Date: ${todayStr} | File: ${file.name}`);

        try {
          const [content] = await file.download();
          const tasreefPayload = JSON.parse(content.toString("utf8"));

          const surahId = tasreefPayload.meta.surahId;

          // Construct default payload
          const defaultPayload = JSON.parse(JSON.stringify(tasreefPayload));
          
          defaultPayload.translations = defaultPayload.translations.map(t => {
            const verseNum = Number(t.verse);
            const match = quranDefault.find(
              entry => entry.surah === surahId && entry.verse === verseNum
            );
            return {
              ...t,
              translation: match ? match.text : t.translation
            };
          });

          // Write default JSON back to storage
          const defaultCachePath = `archive/${lang}/passage_${todayStr}_default.json`;
          const defaultCachedFile = bucket.file(defaultCachePath);
          await defaultCachedFile.save(JSON.stringify(defaultPayload, null, 2), {
            contentType: "application/json",
            metadata: { cacheControl: "public, max-age=86400" }
          });

          // Save to Firestore
          const defaultDocId = `${lang}_${todayStr}_default`;
          await db.collection("passages").doc(defaultDocId).set(defaultPayload);

          processedCount++;
          console.log(` -> Saved default version to Storage and Firestore.`);
        } catch (fileErr) {
          console.error(`Error processing file ${file.name}:`, fileErr.message);
        }
      }

      console.log(`Completed ${lang}. Processed: ${processedCount}, Skipped (already default): ${skippedCount}`);
    }

    console.log("\nMigration script execution completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed with fatal error:", error);
    process.exit(1);
  }
}

migrate();
