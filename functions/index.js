const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function wordsMatch(wordA, wordB) {
  if (!wordA || !wordB) return false;
  // Strip parentheses and anything inside them (e.g. " (ihdina)") and trim
  const cleanA = wordA.replace(/\s*\([^)]*\)/g, "").trim();
  const cleanB = wordB.replace(/\s*\([^)]*\)/g, "").trim();
  return cleanA === cleanB;
}

function readJSONFileSafe(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return JSON.parse(content);
}

/**
 * Core generation logic for picking a random verse, generating translations, 
 * summary analysis, morphological analysis,Imagen background image, 
 * overlay text, and writing the JSON and JPEG back to storage.
 */
async function fetchTasreefTranslation(surah, verse, lang = "en") {
  try {
    const url = "https://us-central1-quran-tasreef-ai.cloudfunctions.net/getTasreefTranslation";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: { surah, verse, lang }
      })
    });
    if (!response.ok) {
      console.warn(`[TASREEF API] Failed to fetch Surah ${surah}:${verse}. Status: ${response.status}`);
      return null;
    }
    const payload = await response.json();
    return payload.result;
  } catch (err) {
    console.warn(`[TASREEF API ERROR] Failed fetching Surah ${surah}:${verse}:`, err.message);
    return null;
  }
}

async function generatePassageForDate(todayStr, lang, bucket, selection = null) {
  const cachePath = `archive/${lang}/passage_${todayStr}.json`;
  const cachedFile = bucket.file(cachePath);

  // Load local asset structures
  const quranMeta = JSON.parse(fs.readFileSync(path.join(__dirname, "quran-meta.json"), "utf8"));
  const quranText = JSON.parse(fs.readFileSync(path.join(__dirname, "quran-text.json"), "utf8"));

  // ==========================================
  // DEBUG 2: RANDOMISATION LOGIC
  // ==========================================
  console.log(`[DEBUG 2] Starting Randomisation sequence...`);
  let surahId, surahName, targetVerse, startVerse, endVerse;
  if (selection) {
    surahId = selection.surahId;
    surahName = selection.surahName;
    targetVerse = selection.targetVerse;
    startVerse = selection.startVerse;
    endVerse = selection.endVerse;
    console.log(`[DEBUG 2] Using provided selection: Surah ${surahName} (${surahId}), Verse: ${targetVerse}. Selection Range: ${startVerse}-${endVerse}`);
  } else {
    const randomSurah = quranMeta[Math.floor(Math.random() * quranMeta.length)];
    surahId = randomSurah.id;
    surahName = randomSurah.name;
    const maxVerses = randomSurah.verseCount;

    targetVerse = Math.floor(Math.random() * maxVerses) + 1;
    startVerse = Math.max(1, targetVerse - 2);
    endVerse = Math.min(maxVerses, targetVerse + 2);
    console.log(`[DEBUG 2] Randomised Target: Surah ${surahName} (${surahId}), Verse: ${targetVerse}. Selection Range: ${startVerse}-${endVerse}`);
  }

  // Gather text elements from local file
  const passageArray = quranText.filter(
    (entry) => entry.surah === surahId && entry.verse >= startVerse && entry.verse <= endVerse
  );

  const stringifiedPassage = passageArray
    .map((v) => `[Verse ${v.verse}]: ${v.text}`)
    .join("\n");

  console.log(`[DEBUG 2] Isolated Local Passage Text Window:\n${stringifiedPassage}`);

  // ==========================================
  // FETCH TRANSLATIONS FROM QURAN-TASREEF-AI
  // ==========================================
  console.log(`[TASREEF API] Fetching translations from quran-tasreef-ai for Surah ${surahId}, verses ${startVerse}-${endVerse} in language ${lang}...`);
  const tasreefFetches = passageArray.map(v => fetchTasreefTranslation(surahId, v.verse, lang));
  const tasreefResults = await Promise.all(tasreefFetches);

  // Create mapping of verse -> translation object
  const tasreefMap = {};
  tasreefResults.forEach(res => {
    if (res && res.verse) {
      tasreefMap[res.verse] = res;
    }
  });

  // Format retrieved translations for prompt injection and output reference
  const providedTranslationsStr = passageArray
    .map(v => {
      const tRes = tasreefMap[v.verse];
      const translationText = tRes ? tRes.simple_translation : "[Pending generation]";
      return `[Verse ${v.verse}]: ${translationText}`;
    })
    .join("\n");

  const targetTasreefRes = tasreefMap[targetVerse];
  let wordAnalysisStr = "";
  if (targetTasreefRes && targetTasreefRes.word_analysis) {
    wordAnalysisStr = JSON.stringify(targetTasreefRes.word_analysis, null, 2);
  } else {
    wordAnalysisStr = "None available. Please generate from scratch.";
  }

  const languageNames = {
    'en': 'English',
    'ms': 'Malay',
    'id': 'Indonesian',
    'af': 'Afrikaans',
    'fa': 'Farsi',
    'ur': 'Urdu',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'tl': 'Tagalog',
    'fr': 'French',
    'it': 'Italian',
    'tr': 'Turkish',
    'bs': 'Bosnian',
    'cs': 'Czech',
    'nl': 'Dutch',
    'de': 'German',
    'el': 'Greek',
    'es': 'Spanish',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'he': 'Hebrew'
  };
  const fullLanguageName = languageNames[lang] || lang;

  // ==========================================
  // DEBUG 3: GEN AI CALL
  // ==========================================
  console.log(`[DEBUG 3] Preparing prompt payload for Gemini model "gemini-3.1-flash-lite"...`);

  const prompt = `
    You are an elite Islamic scholar and expert Arabic morphologist specialized in Classical Sarf/Tasreef.
    Analyze this specific text window from Surah ${surahName} (Surah ID: ${surahId}), focusing strictly on Target Verse ${targetVerse} as the anchor.

    Text Verses provided:
    ${stringifiedPassage}

    We have fetched existing translations and word analyses from the reference Tasreef database.
    Existing translations to use (DO NOT translate these from scratch; use them exactly as provided):
    ${providedTranslationsStr}

    Existing word-level morphological analysis for Target Verse ${targetVerse} to use (DO NOT regenerate these; use this structure):
    ${wordAnalysisStr}

    [STRICT RULE] Output language: ${fullLanguageName}.
    The ISO code provided is "${lang}", which stands for ${fullLanguageName}. All explanations, translations, titles, summaries, and text in the JSON (except Arabic keys/names) MUST be written in ${fullLanguageName}.

    Instructions:
    1. For the "translations" field in the JSON response, output the translation block. Fill in any missing translations if marked as "[Pending generation]". Make sure to output exactly the provided translation if it is given. All translation text must be in ${fullLanguageName}.
    2. Construct a brief contextual summary overview detailing how these surrounding verses tie together, written entirely in ${fullLanguageName}. The overview must end with a thoughtful, reflective prompt (call to action) that is separated from the main overview by a paragraph break (a double newline / blank line: \n\n).
       For both the summary overview and the reflective prompt call to action, you MUST strictly adhere to the following tone guidelines:
       - Provide a non-religious, descriptive rendering that translates the core systemic function into clear, warm, and easily understood language.
       - Explain the concept as a practical, real-world commitment to living by the system's principles and maintaining shared balance, integrity, and harmony.
       - Avoid robotic, mechanical, or overly abstract terminology (e.g., "feedback loop", "data point matrix", "socio-dynamic homeostasis"). Frame the synthesis in human-centric terms that relate directly to everyday choices and community well-being.
       - Keep the reflection question simple, direct, and practical for daily life, encouraging self-reflection or constructive real-world actions.
    3. For the "tasreef" field in the JSON response:
       - Map the provided word-level morphological analysis (if available) into the output format.
       - [CRITICAL LIMIT] If the provided word-level morphological analysis contains more than 5 words, select and output strictly the 5 most relevant words that best align with and illustrate the thematic overview of this passage.
       - Each item in the output "tasreef" array must follow the schema:
         {
           "word": "Arabic word",
           "root": "Root letters",
           "wazn": "Pattern weight (determine from the word/root)",
           "morphology_breakdown": "Explanation notes (use the exact notes provided in the input word_analysis if available, translated to ${fullLanguageName} if they are not already)"
         }
       - If word analysis was not provided, isolate up to 5 key significant action words within the main Target Verse ${targetVerse} and deliver a deep, highly academic, and rigorous 'Tasreef' morphological analysis breakdown mapping the Triliteral Root characters (Root / جذر), the structural pattern weight (Wazn / وزن), and its grammatical class designation and morphology properties (Form I-X, tense aspect, voice). Deliver this breakdown description in the "morphology_breakdown" field. Format "morphology_breakdown" strictly by writing the grammatical morphology properties first, followed by a double newline (\n\n), and then the translation meaning in ${fullLanguageName} (e.g., "Form II (taf'il) perfect verb, active voice, first-person plural.\n\nMeaning: replacing or substituting.").
    4. Use the Minimal Uthmanic Rasm from your memory.
    5. Derive meanings and linguistic context strictly from the immediate text provided.
    6. Add a short, creative, descriptive title (maximum 4-5 words) summarizing this passage's thematic overview in ${fullLanguageName}.

    Format the output response strictly as a clean, valid JSON object following this blueprint shape exactly:
    {
      "meta": { "surahId": ${surahId}, "surahName": "${surahName}", "targetVerse": ${targetVerse}, "range": "${startVerse}-${endVerse}" },
      "title": "Short descriptive passage title here",
      "translations": [ { "verse": "number", "arabic": "Arabic text", "translation": "Translation text" } ],
      "overview": "Contextual thematic overview paragraph here",
      "tasreef": [ { "word": "Arabic word", "root": "Root letters", "wazn": "Pattern weight", "morphology_breakdown": "Explanation" } ]
    }
  `;

  console.log(`[DEBUG 3] Dispatching asynchronous payload request to Gemini API with strict JSON schema...`);
  const model = ai.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

  const aiResult = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          meta: {
            type: "OBJECT",
            properties: {
              surahId: { type: "INTEGER" },
              surahName: { type: "STRING" },
              targetVerse: { type: "INTEGER" },
              range: { type: "STRING" }
            },
            required: ["surahId", "surahName", "targetVerse", "range"]
          },
          translations: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                verse: { type: "INTEGER" },
                arabic: { type: "STRING" },
                translation: { type: "STRING" }
              },
              required: ["verse", "arabic", "translation"]
            }
          },
          overview: { type: "STRING" },
          title: { type: "STRING" },
          tasreef: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                word: { type: "STRING" },
                root: { type: "STRING" },
                wazn: { type: "STRING" },
                morphology_breakdown: { type: "STRING" }
              },
              required: ["word", "root", "wazn", "morphology_breakdown"]
            }
          }
        },
        required: ["meta", "title", "translations", "overview", "tasreef"]
      }
    }
  });

  console.log(`[DEBUG 3] Gen AI Response received successfully.`);

  let rawText = aiResult.response.text().trim();
  if (rawText.startsWith("```json")) {
    rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
  }

  const parsedPayload = JSON.parse(rawText);
  parsedPayload.meta.dateGenerated = todayStr;

  // Post-processing mapping to guarantee the exact translations and word analysis from quran-tasreef-ai
  parsedPayload.translations = parsedPayload.translations.map(t => {
    const verseNum = Number(t.verse);
    const localEntry = quranText.find(
      (entry) => entry.surah === surahId && entry.verse === verseNum
    );
    
    const tRes = tasreefMap[verseNum];
    const finalTranslation = (tRes && tRes.simple_translation) ? tRes.simple_translation : t.translation;

    return {
      index: localEntry ? localEntry.index : null,
      surah: surahId,
      verse: verseNum,
      arabic: localEntry ? localEntry.text : t.arabic,
      translation: finalTranslation
    };
  });

  if (targetTasreefRes && targetTasreefRes.word_analysis) {
    if (targetTasreefRes.word_analysis.length > 5) {
      // Database has more than 5 items: Map only the 5 most relevant items selected by Gemini
      parsedPayload.tasreef = (parsedPayload.tasreef || [])
        .slice(0, 5)
        .map(g => {
          const dbMatch = targetTasreefRes.word_analysis.find(w => wordsMatch(w.word, g.word) || w.root === g.root);
          return {
            word: dbMatch ? dbMatch.word : g.word,
            root: dbMatch ? dbMatch.root : g.root,
            wazn: g.wazn,
            morphology_breakdown: dbMatch ? dbMatch.notes : g.morphology_breakdown
          };
        });
    } else {
      // Database has 5 or fewer items: Map all of them
      parsedPayload.tasreef = targetTasreefRes.word_analysis.map(w => {
        const generatedMatch = (parsedPayload.tasreef || []).find(g => wordsMatch(g.word, w.word) || g.root === w.root);
        return {
          word: w.word,
          root: w.root,
          wazn: generatedMatch ? generatedMatch.wazn : "",
          morphology_breakdown: w.notes
        };
      });
    }
  } else {
    // If no database, just ensure Gemini's output is capped at 5
    parsedPayload.tasreef = (parsedPayload.tasreef || []).slice(0, 5);
  }

  // Image generation skipped - Map to static social fallback card
  parsedPayload.meta.imageUrl = "https://quran-potd.web.app/img/quran-potd-social.jpg";

  // ==========================================
  // DEBUG 4: WRITE TO STORAGE & FIRESTORE CACHE
  // ==========================================
  console.log(`[DEBUG 4] Writing processed payload data blueprint to Firebase Storage archive...`);
  await cachedFile.save(JSON.stringify(parsedPayload, null, 2), {
    contentType: "application/json",
    metadata: { cacheControl: "public, max-age=86400" }
  });
  
  try {
    console.log(`[SEARCH INDEX] Appending passage to search index...`);
    await updateSearchIndex(parsedPayload, lang, bucket);
  } catch (indexErr) {
    console.error(`[SEARCH INDEX ERROR] Failed to update index:`, indexErr.message);
  }
  console.log(`[DEBUG 4] Storage archive write transaction committed successfully.`);

  try {
    const db = admin.firestore();
    const docId = `${lang}_${todayStr}`;
    console.log(`[FIRESTORE] Writing payload to passages/${docId}...`);
    await db.collection("passages").doc(docId).set(parsedPayload);
    console.log(`[FIRESTORE] Document write committed successfully.`);
  } catch (fsErr) {
    console.error(`[FIRESTORE ERROR] Failed to write document:`, fsErr.message);
  }

  // Generate default passage files if language is en or ms using the same metadata and overview
  if (lang === "en" || lang === "ms") {
    try {
      console.log(`[DEFAULT GENERATION] Creating default passage file for ${lang}...`);
      const defaultPayload = JSON.parse(JSON.stringify(parsedPayload)); // Deep clone
      const defaultJsonPath = path.join(__dirname, `quran-${lang}.json`);
      if (fs.existsSync(defaultJsonPath)) {
        const defaultTranslations = readJSONFileSafe(defaultJsonPath);
        defaultPayload.translations = defaultPayload.translations.map(t => {
          const verseNum = Number(t.verse);
          const match = defaultTranslations.find(
            entry => entry.surah === surahId && entry.verse === verseNum
          );
          return {
            ...t,
            translation: match ? match.text : t.translation
          };
        });
      }

      const defaultCachePath = `archive/${lang}/passage_${todayStr}_default.json`;
      const defaultCachedFile = bucket.file(defaultCachePath);
      await defaultCachedFile.save(JSON.stringify(defaultPayload, null, 2), {
        contentType: "application/json",
        metadata: { cacheControl: "public, max-age=86400" }
      });
      console.log(`[DEFAULT GENERATION] Default GCS archive write committed successfully.`);

      const db = admin.firestore();
      const defaultDocId = `${lang}_${todayStr}_default`;
      await db.collection("passages").doc(defaultDocId).set(defaultPayload);
      console.log(`[DEFAULT GENERATION] Default Firestore document write committed successfully.`);
    } catch (defaultErr) {
      console.error(`[DEFAULT GENERATION ERROR] Failed to generate default passage:`, defaultErr.message);
    }
  }

  return parsedPayload;
}

exports.getPassageOfTheDay = onRequest({ cors: true }, async (req, res) => {
  try {
    const bucket = admin.storage().bucket();

    // Extract todayStr, lang, and translationType parameters
    const todayStr = req.query.date || new Date().toISOString().split('T')[0];
    const lang = req.query.lang || "en";
    const translationType = req.query.translationType || "tasreef"; // 'tasreef' or 'default'

    // ==========================================
    // STEP 0: CALCULATE & VERIFY NEIGHBOURING FLAGS FIRST
    // ==========================================
    const currentUTC = new Date(todayStr);
    currentUTC.setUTCDate(currentUTC.getUTCDate() - 1);
    const yesterdayStr = currentUTC.toISOString().split('T')[0];
    const yesterdayStoragePath = `archive/${lang}/passage_${yesterdayStr}.json`;
    const [hasPreviousDay] = await bucket.file(yesterdayStoragePath).exists();

    const nextUTC = new Date(todayStr);
    nextUTC.setUTCDate(nextUTC.getUTCDate() + 1);
    const tomorrowStr = nextUTC.toISOString().split('T')[0];
    const tomorrowStoragePath = `archive/${lang}/passage_${tomorrowStr}.json`;
    const [hasNextDay] = await bucket.file(tomorrowStoragePath).exists();

    console.log(`[DEBUG 6] Timeline Navigation Audit for [${todayStr}] in lang [${lang}] -> hasPreviousDay: ${hasPreviousDay} | hasNextDay: ${hasNextDay}`);

    let cachePath = `archive/${lang}/passage_${todayStr}.json`;
    if (translationType === "default" && (lang === "en" || lang === "ms")) {
      cachePath = `archive/${lang}/passage_${todayStr}_default.json`;
    }
    const cachedFile = bucket.file(cachePath);

    // ==========================================
    // FETCH FROM STORAGE CACHE OR GENERATE FRESH
    // ==========================================
    console.log(`[DEBUG 1] Checking Storage Cache path: "${cachePath}"`);
    let [exists] = await cachedFile.exists();

    let parsedPayload;
    if (exists) {
      console.log(`[DEBUG 1] CACHE HIT! Fetching existing file from Storage...`);
      const [content] = await cachedFile.download();
      parsedPayload = JSON.parse(content.toString());

      // Lazy synchronize into Firestore if missing from Firestore collection
      try {
        const db = admin.firestore();
        const docId = (translationType === "default" && (lang === "en" || lang === "ms"))
          ? `${lang}_${todayStr}_default`
          : `${lang}_${todayStr}`;
        const docRef = db.collection("passages").doc(docId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
          console.log(`[FIRESTORE SYNC] Lazy synchronizing passage for ${docId}...`);
          await docRef.set(parsedPayload);
        }
      } catch (syncErr) {
        console.error(`[FIRESTORE SYNC ERROR] Failed to lazy sync:`, syncErr.message);
      }
    } else {
      // Check if we are requesting default and we can generate it from the tasreef file
      let defaultGeneratedFromTasreef = false;
      if (translationType === "default" && (lang === "en" || lang === "ms")) {
        const tasreefCachePath = `archive/${lang}/passage_${todayStr}.json`;
        const tasreefFile = bucket.file(tasreefCachePath);
        const [tasreefExists] = await tasreefFile.exists();
        if (tasreefExists) {
          console.log(`[DEBUG 1] Tasreef passage exists, but default does not. Generating default from tasreef passage...`);
          const [tasreefContent] = await tasreefFile.download();
          const tasreefPayload = JSON.parse(tasreefContent.toString());
          
          // Construct default payload
          const defaultPayload = JSON.parse(JSON.stringify(tasreefPayload));
          const quranDefault = readJSONFileSafe(path.join(__dirname, `quran-${lang}.json`));
          
          defaultPayload.translations = defaultPayload.translations.map(t => {
            const verseNum = Number(t.verse);
            const defaultEntry = quranDefault.find(
              (entry) => entry.surah === defaultPayload.meta.surahId && entry.verse === verseNum
            );
            return {
              ...t,
              translation: defaultEntry ? defaultEntry.text : t.translation
            };
          });

          // Save default to storage
          await cachedFile.save(JSON.stringify(defaultPayload, null, 2), {
            contentType: "application/json",
            metadata: { cacheControl: "public, max-age=86400" }
          });

          // Save to Firestore
          const db = admin.firestore();
          const docId = `${lang}_${todayStr}_default`;
          await db.collection("passages").doc(docId).set(defaultPayload);

          parsedPayload = defaultPayload;
          defaultGeneratedFromTasreef = true;
        }
      }

      if (!defaultGeneratedFromTasreef) {
        console.log(`[DEBUG 1] CACHE MISS. Moving to fresh generation.`);
        let selection = null;
        if (lang !== "en") {
          const enCachePath = `archive/en/passage_${todayStr}.json`;
          const enFile = bucket.file(enCachePath);
          const [enExists] = await enFile.exists();
          if (enExists) {
            console.log(`[DEBUG 1] English passage exists for date. Reusing selection to generate ${lang}...`);
            const [enContent] = await enFile.download();
            const enPassage = JSON.parse(enContent.toString());
            selection = {
              surahId: enPassage.meta.surahId,
              surahName: enPassage.meta.surahName,
              targetVerse: enPassage.meta.targetVerse,
              startVerse: Number(enPassage.meta.range.split("-")[0]),
              endVerse: Number(enPassage.meta.range.split("-")[1])
            };
          }
        }
        parsedPayload = await generatePassageForDate(todayStr, lang, bucket, selection);
        if (translationType === "default" && (lang === "en" || lang === "ms")) {
          // Load the default version we just wrote in generatePassageForDate
          const defaultCachePath = `archive/${lang}/passage_${todayStr}_default.json`;
          const [defaultContent] = await bucket.file(defaultCachePath).download();
          parsedPayload = JSON.parse(defaultContent.toString());
        }
      }
    }

    // Inject dynamic navigation flags (not persisted in JSON storage file)
    parsedPayload.hasPreviousDay = hasPreviousDay;
    parsedPayload.hasNextDay = hasNextDay;

    console.log(`[DEBUG 5] SENDING TO DISPLAY: Surah ${parsedPayload.meta.surahName}`);
    return res.status(200).json(parsedPayload);

  } catch (error) {
    console.error(`[FATAL ERROR TRACE] Pipeline crashed during execution context:`, error);
    return res.status(500).json({ error: "Pipeline failure.", details: error.message });
  }
});

/**
 * Scheduled Cloud Function to generate the passage of the day automatically 
 * every day at 00:00 UTC
 */
exports.scheduledGeneratePassage = onSchedule({
  schedule: "0 0 * * *",
  timeZone: "Etc/GMT-12",
  timeoutSeconds: 540     // Added headroom timeout execution window to generate both en & ms sequences
}, async (event) => {
  try {
    const bucket = admin.storage().bucket();

    // 🛡️ TIMEZONE SHIFT: Add 12 hours to match the true target cron frontier date
    const targetTimezoneTimestamp = new Date(new Date().getTime() + (12 * 60 * 60 * 1000));
    const todayStr = targetTimezoneTimestamp.toISOString().split('T')[0];

    console.log(`[CRON] Scheduled generate triggered for date ${todayStr} at 00:00 UTC+12 (Server UTC timestamp: ${new Date().toISOString()})`);

    let selection = null;

    // 1. Process English
    const enCachePath = `archive/en/passage_${todayStr}.json`;
    const enFile = bucket.file(enCachePath);
    const [enExists] = await enFile.exists();
    
    let enPassage;
    if (enExists) {
      console.log(`[CRON] Passage for ${todayStr} (en) already exists. Downloading selection...`);
      const [content] = await enFile.download();
      enPassage = JSON.parse(content.toString());
    } else {
      console.log(`[CRON] Cache miss (en). Generating primary passage for ${todayStr}...`);
      enPassage = await generatePassageForDate(todayStr, "en", bucket);
      console.log(`[CRON] Successfully generated passage and artwork assets for ${todayStr} (en).`);
    }

    selection = {
      surahId: enPassage.meta.surahId,
      surahName: enPassage.meta.surahName,
      targetVerse: enPassage.meta.targetVerse,
      startVerse: Number(enPassage.meta.range.split("-")[0]),
      endVerse: Number(enPassage.meta.range.split("-")[1])
    };

    // 2. Process Malay
    const msCachePath = `archive/ms/passage_${todayStr}.json`;
    const msFile = bucket.file(msCachePath);
    const [msExists] = await msFile.exists();

    if (msExists) {
      console.log(`[CRON] Passage for ${todayStr} (ms) already exists. Skipping Malay generation.`);
    } else {
      console.log(`[CRON] Generating Malay passage for ${todayStr} with synchronized selection...`);
      await generatePassageForDate(todayStr, "ms", bucket, selection);
      console.log(`[CRON] Successfully generated Malay passage for ${todayStr}.`);
    }

  } catch (error) {
    console.error(`[CRON FATAL] Scheduled passage generation failed:`, error);
  }
});

/**
 * Helper function to update search_index.json inside GCS bucket
 */
async function updateSearchIndex(newPassage, lang, bucket) {
  const indexPath = `archive/${lang}/search_index.json`;
  const indexFile = bucket.file(indexPath);
  let searchIndex = [];

  try {
    const [exists] = await indexFile.exists();
    if (exists) {
      const [content] = await indexFile.download();
      searchIndex = JSON.parse(content.toString());
    }
  } catch (err) {
    console.warn("Failed to load existing search index, starting fresh.", err.message);
  }

  // Deduplicate
  searchIndex = searchIndex.filter(entry => entry.date !== newPassage.meta.dateGenerated);

  // Compile searchable text fields
  const translationText = newPassage.translations.map(t => t.translation).join(" ");
  const tasreefWords = newPassage.tasreef.map(t => `${t.word} ${t.root} ${t.wazn} ${t.morphology_breakdown}`).join(" ");
  const searchableContent = `${newPassage.title || ""} Surah ${newPassage.meta.surahName} ${translationText} ${newPassage.overview} ${tasreefWords}`.toLowerCase();

  // Push record
  searchIndex.push({
    date: newPassage.meta.dateGenerated,
    title: newPassage.title || `Surah ${newPassage.meta.surahName}`,
    reference: `Surah ${newPassage.meta.surahId} (verses ${newPassage.meta.range})`,
    searchText: searchableContent
  });

  // Save back to bucket
  await indexFile.save(JSON.stringify(searchIndex), {
    contentType: "application/json",
    metadata: { cacheControl: "public, max-age=3600" }
  });
  console.log(`[SEARCH INDEX] Updated search index for ${lang} with entry for date: ${newPassage.meta.dateGenerated}`);
}

/**
 * Temporary HTTP Admin trigger to parse all existing passages and build search_index.json
 */
exports.rebuildSearchIndex = onRequest(async (req, res) => {
  try {
    const bucket = admin.storage().bucket();
    const lang = req.query.lang || "en";
    const prefix = `archive/${lang}/passage_`;
    const [files] = await bucket.getFiles({ prefix });

    console.log(`Found ${files.length} passages for language ${lang}. Rebuilding index...`);
    let searchIndex = [];

    for (const file of files) {
      if (!file.name.endsWith(".json")) continue;
      
      const dateStr = file.name.replace(prefix, "").replace(".json", "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

      console.log(`Processing ${dateStr}...`);
      const [content] = await file.download();
      const passage = JSON.parse(content.toString());

      const translationText = passage.translations.map(t => {
        return t.translation;
      }).join(" ");
      const tasreefWords = passage.tasreef.map(t => `${t.word} ${t.root} ${t.wazn} ${t.morphology_breakdown}`).join(" ");
      const searchableContent = `${passage.title || ""} Surah ${passage.meta.surahName} ${translationText} ${passage.overview} ${tasreefWords}`.toLowerCase();

      searchIndex.push({
        date: dateStr,
        title: passage.title || `Surah ${passage.meta.surahName}`,
        reference: `Surah ${passage.meta.surahId} (verses ${passage.meta.range})`,
        searchText: searchableContent
      });
    }

    const indexPath = `archive/${lang}/search_index.json`;
    await bucket.file(indexPath).save(JSON.stringify(searchIndex), {
      contentType: "application/json",
      metadata: { cacheControl: "public, max-age=3600" }
    });

    console.log(`Successfully completed index compilation: ${searchIndex.length} entries.`);
    return res.status(200).send(`Search index successfully compiled and written to storage with ${searchIndex.length} entries for language ${lang}.`);
  } catch (error) {
    console.error("Failed compiling search index:", error);
    return res.status(500).send(`Failed compiling search index: ${error.message}`);
  }
});

/**
 * HTTP endpoint to securely serve search_index.json to client applications
 */
exports.getSearchIndex = onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  try {
    const bucket = admin.storage().bucket();
    const lang = req.query.lang || "en";
    const indexFile = bucket.file(`archive/${lang}/search_index.json`);
    const [exists] = await indexFile.exists();

    if (!exists) {
      console.warn(`[SEARCH INDEX] Index file does not exist for language ${lang} in Storage bucket.`);
      return res.status(404).json({ error: `Search index not found for language ${lang}.` });
    }

    const [content] = await indexFile.download();
    const indexData = JSON.parse(content.toString());

    console.log(`[SEARCH INDEX] Serving search index for ${lang} with ${indexData.length} entries.`);
    return res.status(200)
      .set("Cache-Control", "public, max-age=1800") // cache for 30 minutes in browser
      .json(indexData);
  } catch (error) {
    console.error("[SEARCH INDEX ERROR] Failed to fetch index:", error);
    return res.status(500).json({ error: "Failed to retrieve search index.", details: error.message });
  }
});

