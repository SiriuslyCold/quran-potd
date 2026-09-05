// Toggle simulated subscription for testing (accelerated timelines of 5 minutes)
const IS_TESTING_MODE = false;

// Verified frontend Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAib8FrGuN66PJXvY-4XSoKAy3pEzJDpKU",
    authDomain: "quran-potd.firebaseapp.com",
    projectId: "quran-potd",
    storageBucket: "quran-potd.firebasestorage.app",
    messagingSenderId: "286663652762",
    appId: "1:286663652762:web:7e34d0df3171c8890c7623",
    measurementId: "G-XN3WH4S9C2"
};

// Live production function trigger URL
const FUNCTION_URL = "https://getpassageoftheday-mayya3vt7q-uc.a.run.app";

// Global State
let currentDateInstance = new Date();
const REAL_TODAY_STR = new Date().toISOString().split('T')[0];
let activePassageData = null;
let currentLanguage = localStorage.getItem("appLanguage") || "en";
let currentTranslationType = "default";
try {
    if (localStorage.getItem("appTranslationExplicitTasreef") === "true") {
        currentTranslationType = "tasreef";
    }
} catch (e) {
    console.error(e);
}



// Theme Settings state
let currentThemeSetting = 'system'; // 'light' | 'dark' | 'system'
let isSubscribed = false; // Subscription entitlement status flag
let activePlanType = null; // Plan type: 'monthly', 'yearly', or null
let hideNavArrows = false; // Override flag to force-hide date navigation
let activeAudio = null; // Active HTML5 Audio playback reference instance
let activeAudioButton = null; // Currently playing verse button DOM reference

const OG_DESCRIPTION = "Explore daily linguistic breakdowns, morphological analysis, and clear contextual overviews of the Qur'an.";
const OG_IMAGE = "https://quran-potd.web.app/quran-potd-social.jpg";
const APP_VERSION = "1.6.5";

const SURAH_NAMES = [
    "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
    "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra'", "Al-Kahf", "Maryam", "Ta-Ha",
    "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Asy-Syu'ara'", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum",
    "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
    "Fussilat", "Asy-Syura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
    "Adz-Dzariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah",
    "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
    "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba'", "An-Nazi'at", "'Abasa",
    "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
    "Asy-Syams", "Al-Layl", "Ad-Duha", "Al-Insyirah", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Al-Zalzalah", "Al-'Adiyat",
    "Al-Qari'ah", "At-Takathur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kauthar", "Al-Kafirun", "An-Nasr",
    "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

const locales = {
    "en": {
        "tagline": "Powered by MPV",
        "appTitle": "Qur'an Passage of the Day",
        "dateLocale": "en-GB",
        "todayTab": "Today",
        "archiveTab": "Archive",
        "bookmarksTab": "Bookmarks",
        "searchTab": "Search",
        "settingsTab": "Settings",
        "aboutTab": "About",
        "historicalPassage": "Historical Passage",
        "historicalNote": "You are viewing a historical passage from the Qur'an PoTD archive.",
        "btnReturnToday": "Return to Today",
        "btnBackToToday": "Back to Today's Passage",
        "btnCopy": "Copy",
        "btnShare": "Share",
        "btnListen": "Listen",
        "btnBookmark": "Bookmark",
        "btnNext": "Next",
        "btnPrevious": "Previous",
        "sectionOverview": "Thematic Overview",
        "sectionTasreef": "Key Morphological Analysis (Tasreef)",
        "tasreefTriliteralRoot": "Triliteral Root (جذر):",
        "tasreefPatternWeight": "Pattern Weight (وزن):",
        "concordanceTitle": "Root Occurrences",
        "concordanceOccurrencesOf": "Occurrences of Root: {root}",
        "concordanceTargetWord": "Target Word:",
        "concordanceWaznRoot": "Wazn / Root:",
        "concordanceRootLabel": "Root:",
        "concordanceLoading": "Fetching concordance...",
        "concordanceEmpty": "No occurrences found for this root.",
        "concordanceError": "Failed to load occurrences: {error}",
        "settingsTitle": "Display Settings",
        "settingsTheme": "App Theme",
        "themeAuto": "System",
        "themeLight": "Light",
        "themeDark": "Dark",
        "themeSepia": "Sepia",
        "themeSystem": "System",
        "settingsLanguage": "App Language",
        "settingsTranslationMode": "Translation Mode",
        "translationModeTasreef": "Tasreef (Academic)",
        "translationModeDefault": "Default",
        "settingsArabicSize": "Arabic Text Size",
        "settingsTranslationSize": "Translation Text Size",
        "settingsNotifications": "Daily Notifications",
        "bookmarksUnlock": "Unlock bookmarks with Premium",
        "bookmarksTitle": "Your Bookmarks",
        "bookmarksEmpty": "No bookmarked passages yet.",
        "searchTitle": "Search Archive",
        "searchPlaceholder": "Search keywords, roots, topics...",
        "searchEmpty": "Enter a keyword, topic, or Arabic root to search.",
        "searchNoResults": "No matching passages found. Try checking spelling or different terms.",
        "paywallTitle": "Subscribe to Premium",
        "paywallDescription": "Accessing previous passages, search, and bookmarking are premium features.",
        "paywallFeatNav": "Navigate previous passages",
        "paywallFeatBookmarks": "Bookmark passages",
        "paywallFeatSearch": "Search archive for keyword",
        "paywallFeatRecital": "Audio recital",
        "paywallFeatSupport": "Support progressive values & content development",
        "paywallYearlyPrice": "$19.99 / year",
        "paywallYearlySub": "Includes 7-day free trial • Cancel anytime",
        "paywallMonthlyPrice": "$1.99 / month",
        "paywallMonthlySub": "Billed monthly • Cancel anytime",
        "paywallSave": "Save 16%",
        "paywallRestore": "Restore Purchases",
        "paywallPrivacy": "Privacy Policy",
        "paywallTermsLink": "Terms of Use",
        "paywallTerms": "Payment will be charged to your Apple ID / Google Play account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. Subscriptions may be managed or cancelled in your Account Settings after purchase. Any unused portion of a free trial period, if offered, will be forfeited when purchasing a subscription.",
        "paywallSimulation": "ℹ️ Simulation Mode: Purchases are simulated for evaluation purposes. No real money is charged.",
        "updateTitle": "Update Available",
        "updateDescOptional": "A new version of Qur'an Passage of the Day is available. Please update to enjoy the latest features and enhancements.",
        "updateDescMandatory": "A critical update is available. You must update the app to continue using the service.",
        "updateVersionInfo": "New version: {version}",
        "updateNow": "Update Now",
        "updateLater": "Later",
        "loaderText": "Retrieving passage...",
        "toastBookmarkAdded": "✅ Passage bookmarked!",
        "toastBookmarkRemoved": "❌ Bookmark removed!",
        "toastMaxBookmarks": "Maximum of 50 bookmarks reached",
        "toastSearchEmpty": "Please enter a search query",
        "toastCopySuccess": "Passage copied to clipboard!",
        "toastCopyFail": "Failed to copy passage",
        "toastNativeShareFail": "Sharing failed: ",
        "toastAudioError": "Failed to play audio recital.",
        "toastAudioUnsupported": "Audio format is not supported on this device.",
        "toastAudioNotFound": "Recital audio file could not be found.",
        "toastAudioBlocked": "Audio playback blocked. Please interact with the page first.",
        "toastAudioNetwork": "Network error while loading recital audio.",
        "toastOffline": "📶 Showing offline cached passage",
        "toastConnectionError": "Unable to retrieve today's passage. Please check your network connection and try again.",
        "toastRetry": "Retry",
        "toastCopied": "✅ Passage copied to clipboard!",
        "toastSimulatedUnlock": "Simulated Monthly Subscription Active! Unlocked (active for 5 mins).",
        "toastSimulatedPurchased": "Simulated purchase successful! Premium archive unlocked.",
        "toastSimulatedRestore": "Simulated purchases restored!",
        "toastSimulatedActive": "You already have active simulated premium archive access.",
        "toastPurchaseFailed": "Purchase cancelled or failed.",
        "toastPremiumUnlocked": "Subscription Active! Premium access unlocked.",
        "toastSubActive": "Subscription Active! Premium access unlocked.",
        "toastSyncSuccess": "Archive synchronised successfully.",
        "toastSyncFail": "Sync failed: ",
        "toastAppUpToDate": "App is up to date.",
        "tooltipSettings": "Display & Theme Settings",
        "tooltipAbout": "About This Project",
        "tooltipShare": "Share Passage",
        "tooltipSearch": "Search Passages",
        "tooltipBookmark": "Bookmark Passage",
        "tooltipPrev": "Previous Day",
        "tooltipNext": "Next Day",
        "shareTitle": "Share Passage",
        "shareCopyLabel": "Copy Link & Text",
        "shareDeviceLabel": "Share via Device...",
        "shareTextHeader": "📖 Qur'an Passage of the Day",
        "shareTextVerses": "Verses",
        "shareTextLink": "🔗 View keyword linguistic breakdown and recitations:",
        "subStatusFree": "You are currently on the Free plan.",
        "subStatusSubscribed": "You're currently subscribed to the {plan} plan. Manage your subscription on Google Play/App Store (depending on device).",
        "planMonthly": "monthly",
        "planYearly": "yearly",
        "planPremium": "premium"
    },
    "ms": {
        "tagline": "Dikuasakan oleh MPV",
        "appTitle": "Petikan Al-Qur'an Harian",
        "dateLocale": "ms-MY",
        "todayTab": "Hari Ini",
        "archiveTab": "Arkib",
        "bookmarksTab": "Tanda Buku",
        "searchTab": "Cari",
        "settingsTab": "Tetapan",
        "aboutTab": "Tentang",
        "historicalPassage": "Ayat Arkib",
        "historicalNote": "Anda sedang melihat ayat arkib pilihan daripada arkib Qur'an PoTD.",
        "btnReturnToday": "Kembali ke Hari Ini",
        "btnBackToToday": "Kembali ke Ayat Hari Ini",
        "btnCopy": "Salin",
        "btnShare": "Kongsi",
        "btnListen": "Dengar",
        "btnBookmark": "Tanda Buku",
        "btnNext": "Seterusnya",
        "btnPrevious": "Sebelumnya",
        "sectionOverview": "Gambaran Keseluruhan Tematik",
        "sectionTasreef": "Analisis Morfologi Utama (Tasrif)",
        "tasreefTriliteralRoot": "Kata Dasar Tiga Huruf (جذر):",
        "tasreefPatternWeight": "Pola Timbangan (وزن):",
        "concordanceTitle": "Kemunculan Kata Dasar",
        "concordanceOccurrencesOf": "Kemunculan Kata Dasar: {root}",
        "concordanceTargetWord": "Perkataan Sasaran:",
        "concordanceWaznRoot": "Wazn / Kata Dasar:",
        "concordanceRootLabel": "Kata Dasar:",
        "concordanceLoading": "Memuat turun konkordans...",
        "concordanceEmpty": "Tiada kemunculan ditemui untuk kata dasar ini.",
        "concordanceError": "Gagal memuat turun kemunculan: {error}",
        "settingsTitle": "Tetapan Paparan",
        "settingsTheme": "Tema Aplikasi",
        "themeAuto": "Sistem",
        "themeLight": "Cerah",
        "themeDark": "Gelap",
        "themeSepia": "Sepia",
        "themeSystem": "Sistem",
        "settingsLanguage": "Bahasa Aplikasi",
        "settingsTranslationMode": "Mod Terjemahan",
        "translationModeTasreef": "Tasrif (Akademik)",
        "translationModeDefault": "Lalai",
        "settingsArabicSize": "Saiz Teks Bahasa Arab",
        "settingsTranslationSize": "Saiz Teks Terjemahan",
        "settingsNotifications": "Pemberitahuan Harian",
        "bookmarksUnlock": "Buka kunci tanda buku dengan Premium",
        "bookmarksTitle": "Tanda Buku Anda",
        "bookmarksEmpty": "Tiada ayat yang ditanda buku lagi.",
        "searchTitle": "Cari Arkib",
        "searchPlaceholder": "Cari kata kunci, kata dasar, topik...",
        "searchEmpty": "Masukkan kata kunci, topik, atau kata dasar Arab untuk mencari.",
        "searchNoResults": "Tiada ayat sepadan ditemui. Sila semak ejaan atau istilah lain.",
        "paywallTitle": "Langgan Premium",
        "paywallDescription": "Mengakses ayat terdahulu, carian, dan tanda buku adalah fungsi premium.",
        "paywallFeatNav": "Navigasi ayat terdahulu",
        "paywallFeatBookmarks": "Tanda buku ayat pilihan",
        "paywallFeatSearch": "Cari arkib mengikut kata kunci",
        "paywallFeatRecital": "Alunan audio bacaan",
        "paywallFeatSupport": "Sokong nilai progresif & pembangunan kandungan",
        "paywallYearlyPrice": "RM39.90 / setahun",
        "paywallYearlySub": "Termasuk percubaan percuma 7 hari • Batal bila-bila masa",
        "paywallMonthlyPrice": "RM3.90 / sebulan",
        "paywallMonthlySub": "Dibilkan setiap bulan • Batal bila-bila masa",
        "paywallSave": "Jimat 16%",
        "paywallRestore": "Pulihkan Pembelian",
        "paywallPrivacy": "Dasar Privasi",
        "paywallTermsLink": "Syarat Penggunaan",
        "paywallTerms": "Bayaran akan dicaj ke akaun Apple ID / Google Play anda semasa pengesahan pembelian. Langganan diperbaharui secara automatik melainkan pembaharuan automatik dimatikan sekurang-kurangnya 24 jam sebelum tamat tempoh semasa. Akaun anda akan dicaj untuk pembaharuan dalam tempoh 24 jam sebelum tamat tempoh semasa. Langganan boleh diuruskan atau dibatalkan dalam Tetapan Akaun selepas pembelian. Sebarang bahagian tempoh percubaan percuma yang tidak digunakan akan terbatal apabila membeli langganan.",
        "paywallSimulation": "ℹ️ Mod Simulasi: Pembelian disimulasikan untuk tujuan penilaian. Tiada wang sebenar yang dicaj.",
        "updateTitle": "Kemas Kini Tersedia",
        "updateDescOptional": "Versi baharu Petikan Al-Qur'an Harian telah tersedia. Sila kemas kini untuk menikmati ciri-ciri baharu.",
        "updateDescMandatory": "Kemas kini kritikal tersedia. Anda mesti mengemas kini aplikasi untuk terus menggunakan perkhidmatan ini.",
        "updateVersionInfo": "Versi baharu: {version}",
        "updateNow": "Kemas Kini Sekarang",
        "updateLater": "Nanti",
        "loaderText": "Memuat turun ayat...",
        "toastBookmarkAdded": "✅ Ayat ditanda buku!",
        "toastBookmarkRemoved": "❌ Tanda buku dibuang!",
        "toastMaxBookmarks": "Maksimum 50 tanda buku telah dicapai",
        "toastSearchEmpty": "Sila masukkan pertanyaan carian",
        "toastCopySuccess": "Ayat disalin ke papan klip!",
        "toastCopyFail": "Gagal menyalin ayat",
        "toastNativeShareFail": "Perkongsian gagal: ",
        "toastAudioError": "Gagal memainkan alunan audio.",
        "toastAudioUnsupported": "Format audio tidak disokong pada peranti ini.",
        "toastAudioNotFound": "Fail audio bacaan tidak ditemui.",
        "toastAudioBlocked": "Main semula audio disekat. Sila berinteraksi dengan halaman terlebih dahulu.",
        "toastAudioNetwork": "Ralat rangkaian semasa memuatkan audio bacaan.",
        "toastOffline": "📶 Menunjukkan ayat luar talian yang disimpan",
        "toastConnectionError": "Tidak dapat memuat turun ayat hari ini. Sila periksa sambungan rangkaian anda dan cuba lagi.",
        "toastRetry": "Cuba Lagi",
        "toastCopied": "✅ Ayat disalin ke papan klip!",
        "toastSimulatedUnlock": "Langganan Bulanan Simulasi Aktif! Dibuka (aktif selama 5 minit).",
        "toastSimulatedPurchased": "Pembelian simulasi berjaya! Arkib premium dibuka.",
        "toastSimulatedRestore": "Pembelian simulasi telah dipulihkan!",
        "toastSimulatedActive": "Anda sudah mempunyai akses arkib premium simulasi yang aktif.",
        "toastPurchaseFailed": "Pembelian dibatalkan atau gagal.",
        "toastPremiumUnlocked": "Langganan Aktif! Akses premium dibuka.",
        "toastSubActive": "Langganan Aktif! Akses premium dibuka.",
        "toastSyncSuccess": "Arkib berjaya disegerakkan.",
        "toastSyncFail": "Penyegerakan gagal: ",
        "toastAppUpToDate": "Aplikasi adalah terkini.",
        "tooltipSettings": "Tetapan Paparan & Tema",
        "tooltipAbout": "Mengenai Projek Ini",
        "tooltipShare": "Kongsi Ayat Pilihan",
        "tooltipSearch": "Cari Arkib Ayat",
        "tooltipBookmark": "Tanda Buku Ayat Pilihan",
        "tooltipPrev": "Hari Sebelumnya",
        "tooltipNext": "Hari Seterusnya",
        "shareTitle": "Kongsi Ayat Pilihan",
        "shareCopyLabel": "Salin Pautan & Teks",
        "shareDeviceLabel": "Kongsi melalui Peranti...",
        "shareTextHeader": "📖 Petikan Al-Qur'an Harian",
        "shareTextVerses": "Ayat",
        "shareTextLink": "🔗 Lihat huraian linguistik kata kunci dan bacaan:",
        "subStatusFree": "Anda kini menggunakan pelan Percuma.",
        "subStatusSubscribed": "Anda kini melanggan pelan {plan}. Urus langganan anda di Google Play/AppStore (mengikut peranti).",
        "planMonthly": "Bulanan",
        "planYearly": "Tahunan",
        "planPremium": "Premium"
    }
};

let db = null;
window.buildFlavor = 'gms'; // Default flavor. Will be updated dynamically on startup in Capacitor.

// Google Analytics Event Logger Helper
function logAnalyticsEvent(eventName, eventParams = {}) {
    // 1. Detect active platform
    const platform = (typeof window.Capacitor !== 'undefined' && window.Capacitor.getPlatform)
        ? window.Capacitor.getPlatform()
        : 'web';

    eventParams.platform = platform;

    // 2. Route events based on native vs web targets
    if (platform !== 'web' && window.Capacitor && window.Capacitor.Plugins) {
        if (window.buildFlavor === 'hms') {
            if (window.HMSAnalytics) {
                try {
                    window.HMSAnalytics.onEvent(eventName, eventParams);
                    console.log(`[ANALYTICS] HMS Logged event: ${eventName}`, eventParams);
                } catch (err) {
                    console.error(`[ANALYTICS] HMS event logging failed: ${eventName}`, err);
                }
            } else {
                console.log(`[ANALYTICS] HMS (Simulated) Logged event: ${eventName}`, eventParams);
            }
        } else if (window.Capacitor.Plugins.FirebaseAnalytics) {
            const { FirebaseAnalytics } = window.Capacitor.Plugins;
            FirebaseAnalytics.logEvent({
                name: eventName,
                params: eventParams
            }).then(() => {
                console.log(`[ANALYTICS] Native Logged event: ${eventName}`, eventParams);
            }).catch(err => {
                console.error(`[ANALYTICS] Native event logging failed: ${eventName}`, err);
            });
        }
    } else if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, eventParams);
        console.log(`[ANALYTICS] Web Logged event: ${eventName}`, eventParams);
    } else {
        console.warn(`[ANALYTICS] Analytics SDK not loaded. Skipped: ${eventName}`, eventParams);
    }
}

// Safe dynamic initialization of Firebase
async function initFirebase() {
    try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
        const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        const app = initializeApp(firebaseConfig);
        db = initializeFirestore(app, {
            cache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
        });
        console.log("[DEBUG CLIENT] Firebase SDK & Firestore initialized with multi-tab persistent cache.");
    } catch (err) {
        console.warn("[DEBUG CLIENT] Offline or unable to load Firebase SDK. Skipping initialization.", err);
    }
}

// Global Theme Management
function applyTheme(theme) {
    currentThemeSetting = theme;
    localStorage.setItem("themeSetting", theme);

    const body = document.body;
    body.classList.remove("theme-light", "theme-dark");

    let resolvedTheme = theme;
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolvedTheme = prefersDark ? 'dark' : 'light';
    }

    body.classList.add(`theme-${resolvedTheme}`);

    // Toggle active state classes on buttons inside Settings Panel
    ['light', 'dark', 'system'].forEach(t => {
        const btn = document.getElementById(`theme-btn-${t}`);
        if (btn) {
            if (t === theme) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        }
    });

    console.log(`[DEBUG CLIENT] Applied theme: ${resolvedTheme} (Setting: ${theme})`);

    // Synchronize Capacitor Native Status Bar theme if native environment exists
    if (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins) {
        const { StatusBar, BuildInfo } = window.Capacitor.Plugins;
        try {
            const colorHex = resolvedTheme === 'dark' ? '#020617' : '#f8fafc';
            // standard Capacitor StatusBar plugin (used on iOS)
            if (StatusBar) {
                StatusBar.setOverlaysWebView({ overlay: true }).catch(err => console.log(err));
                StatusBar.setBackgroundColor({ color: colorHex }).catch(err => console.log(err));
                StatusBar.setStyle({ style: resolvedTheme === 'dark' ? 'DARK' : 'LIGHT' }).catch(err => console.log(err));
            }
            // custom Android implementation (exposes method in local BuildInfoPlugin)
            if (BuildInfo && typeof BuildInfo.setStatusBarStyle === 'function') {
                BuildInfo.setStatusBarStyle({ style: resolvedTheme === 'dark' ? 'DARK' : 'LIGHT' }).catch(err => console.log(err));
            }
        } catch (err) {
            console.error("Failed to update native status bar theme:", err);
        }
    }
}

// System theme listener
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');
try {
    systemPrefersDark.addEventListener('change', () => {
        if (currentThemeSetting === 'system') {
            applyTheme('system');
        }
    });
} catch (err) {
    // Fallback support for older WebViews
    systemPrefersDark.addListener(() => {
        if (currentThemeSetting === 'system') {
            applyTheme('system');
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("[DEBUG CLIENT] DOM Fully Loaded. Initializing...");

    // Helper to format Date objects as local YYYY-MM-DD strings
    function getLocalDateString(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    let lastCheckedTodayStr = getLocalDateString(new Date());
    function checkAndRefreshDate() {
        const todayStr = getLocalDateString(new Date());
        if (todayStr !== lastCheckedTodayStr) {
            console.log(`[DEBUG CLIENT] Date changed from ${lastCheckedTodayStr} to ${todayStr}. Refreshing to today's passage...`);
            lastCheckedTodayStr = todayStr;
            currentDateInstance = new Date();
            loadPassageForDate(currentDateInstance);
        }
    }

    // Web visibility change listener
    document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "visible") {
            checkAndRefreshDate();
            await checkSubscriptionStatus();
        }
    });

    // Cache Migration: clear old cached items to wipe hardcoded date comparison flags
    const CURRENT_CACHE_VERSION = "2.0.1";
    if (localStorage.getItem("app_cache_version") !== CURRENT_CACHE_VERSION) {
        console.log("[DEBUG CLIENT] Migrating local cache. Clearing cached passages to refresh navigation flags...");
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith("passage_") || key === "last_loaded_date") {
                localStorage.removeItem(key);
            }
        });
        localStorage.setItem("app_cache_version", CURRENT_CACHE_VERSION);
    }

    // Initialize Firebase SDK
    initFirebase();

    // DOM Element References
    const prevBtn = document.getElementById("prev-date-btn");
    const nextBtn = document.getElementById("next-date-btn");
    const appContent = document.getElementById("app-content");
    const loader = document.getElementById("loading");



    // Settings Panel Controls
    const settingsBtn = document.getElementById("settings-btn");
    const settingsPanel = document.getElementById("settings-panel");
    const settingsCloseBtn = document.getElementById("settings-close-btn");
    const arabicFontSlider = document.getElementById("arabic-font-slider");
    const englishFontSlider = document.getElementById("english-font-slider");
    const langSelect = document.getElementById("lang-select");
    const translationTypeSelect = document.getElementById("translation-type-select");

    // Theme selector buttons inside panel
    const themeBtnLight = document.getElementById("theme-btn-light");
    const themeBtnDark = document.getElementById("theme-btn-dark");
    const themeBtnSystem = document.getElementById("theme-btn-system");

    // Modal & Clipboard Elements
    const aboutBtn = document.getElementById("about-btn");
    const aboutModal = document.getElementById("about-modal");
    const closeModalX = document.querySelector(".close-btn");
    const shareBtn = document.getElementById("share-btn");
    const copyToast = document.getElementById("copy-toast");
    const offlineBanner = document.getElementById("offline-banner");

    // Share Modal Elements
    const shareModal = document.getElementById("share-modal");
    const shareModalCloseBtn = document.getElementById("share-modal-close-btn");
    const sharePreviewText = document.getElementById("share-preview-text");
    const shareCopyBtn = document.getElementById("share-copy-btn");
    const shareNativeBtn = document.getElementById("share-native-btn");

    // Paywall Elements
    const paywallModal = document.getElementById("paywall-modal");
    const paywallCloseBtn = document.getElementById("paywall-close-btn");
    const paywallSubscribeMonthlyBtn = document.getElementById("paywall-subscribe-monthly-btn");
    const paywallSubscribeYearlyBtn = document.getElementById("paywall-subscribe-yearly-btn");
    const paywallRestoreBtn = document.getElementById("paywall-restore-btn");

    // Bookmark Elements
    const bookmarkBtn = document.getElementById("bookmark-btn");
    const bookmarkIcon = document.getElementById("bookmark-icon");
    const bookmarksGatedView = document.getElementById("bookmarks-gated-view");
    const settingsViewBookmarksBtn = document.getElementById("settings-view-bookmarks-btn");
    const bookmarksCount = document.getElementById("bookmarks-count");
    const bookmarksModal = document.getElementById("bookmarks-modal");
    const bookmarksCloseBtn = document.getElementById("bookmarks-close-btn");
    const bookmarksModalList = document.getElementById("bookmarks-modal-list");
    let bookmarks = [];

    // Notification Elements
    const notificationsToggle = document.getElementById("notifications-toggle");

    // Search Elements
    const searchTriggerBtn = document.getElementById("search-trigger-btn");
    const searchModal = document.getElementById("search-modal");
    const searchCloseBtn = document.getElementById("search-close-btn");
    const searchInput = document.getElementById("search-input");
    const searchResultsList = document.getElementById("search-results-list");
    let localSearchIndex = [];

    // Concordance Elements
    const concordanceModal = document.getElementById("concordance-modal");
    const concordanceCloseBtn = document.getElementById("concordance-close-btn");
    const concordanceResultsList = document.getElementById("concordance-results-list");
    const concordanceLoading = document.getElementById("concordance-loading");
    const concordanceError = document.getElementById("concordance-error");
    const concordanceErrorMsg = document.getElementById("concordance-error-msg");
    const concordanceModalTitle = document.getElementById("concordance-modal-title");
    const concordanceWordInfo = document.getElementById("concordance-word-info");

    // Set default metadata tags
    updateMetadata(OG_DESCRIPTION, OG_IMAGE);

    // ==========================================
    // 📶 OFFLINE & CACHING IMPLEMENTATION
    // ==========================================
    function checkNetworkStatus() {
        if (!navigator.onLine) {
            offlineBanner.classList.remove("hidden");
        } else {
            offlineBanner.classList.add("hidden");
        }
    }

    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);
    checkNetworkStatus(); // Initial run

    // ==========================================
    // 🎨 INITIALIZE CONFIGURATIONS
    // ==========================================
    // Initialize Theme
    const storedTheme = localStorage.getItem("themeSetting") || "system";
    applyTheme(storedTheme);

    // Theme Click Event Handlers
    if (themeBtnLight) themeBtnLight.onclick = () => applyTheme('light');
    if (themeBtnDark) themeBtnDark.onclick = () => applyTheme('dark');
    if (themeBtnSystem) themeBtnSystem.onclick = () => applyTheme('system');

    // Initialize Font Size Scales
    const cachedArabicScale = localStorage.getItem("arabicFontScale") || "1.45";
    const cachedEnglishScale = localStorage.getItem("englishFontScale") || "1.05";

    document.documentElement.style.setProperty('--arabic-font-size', `${cachedArabicScale}rem`);
    document.documentElement.style.setProperty('--english-font-size', `${cachedEnglishScale}rem`);
    if (arabicFontSlider) arabicFontSlider.value = cachedArabicScale;
    if (englishFontSlider) englishFontSlider.value = cachedEnglishScale;

    // Font Adjustment input handlers
    if (arabicFontSlider) {
        arabicFontSlider.oninput = (e) => {
            const val = e.target.value;
            document.documentElement.style.setProperty('--arabic-font-size', `${val}rem`);
            localStorage.setItem("arabicFontScale", val);
        };
    }

    if (englishFontSlider) {
        englishFontSlider.oninput = (e) => {
            const val = e.target.value;
            document.documentElement.style.setProperty('--english-font-size', `${val}rem`);
            localStorage.setItem("englishFontScale", val);
        };
    }

    // Initialize App Language dropdown
    if (langSelect) {
        langSelect.value = currentLanguage;
        langSelect.onchange = (e) => {
            const newLang = e.target.value;
            currentLanguage = newLang;
            localStorage.setItem("appLanguage", newLang);
            logAnalyticsEvent("language_changed", { language: newLang });
            console.log(`[DEBUG CLIENT] Language changed to: ${newLang}`);

            // Apply new localization
            applyLocalization(newLang);

            // Clear search index cache since language changed
            localSearchIndex = [];

            // Reload passage
            loadPassageForDate(currentDateInstance);
        };
    }

    // Initialize App Translation Mode dropdown
    if (translationTypeSelect) {
        translationTypeSelect.value = currentTranslationType;
        translationTypeSelect.onchange = (e) => {
            const newType = e.target.value;
            currentTranslationType = newType;
            localStorage.setItem("appTranslationType", newType);
            localStorage.setItem("appTranslationExplicitTasreef", newType === "tasreef" ? "true" : "false");
            logAnalyticsEvent("translation_type_changed", { type: newType });
            console.log(`[DEBUG CLIENT] Translation mode changed to: ${newType}`);

            // Reload passage
            loadPassageForDate(currentDateInstance);
        };
    }

    // Initialize Daily Notifications toggle state
    let notificationsEnabled = true;
    try {
        const savedSetting = localStorage.getItem("app_notifications_enabled");
        if (savedSetting !== null) {
            notificationsEnabled = savedSetting === "true";
        }
    } catch (err) {
        console.error("[DEBUG CLIENT] Failed to load notification settings:", err);
    }
    if (notificationsToggle) {
        notificationsToggle.checked = notificationsEnabled;
        notificationsToggle.onchange = () => {
            const enabled = notificationsToggle.checked;
            localStorage.setItem("app_notifications_enabled", enabled ? "true" : "false");
            console.log(`[DEBUG CLIENT] Daily notifications toggle changed to: ${enabled}`);

            if (isSubscribed) {
                if (enabled) {
                    scheduleDailyNotification();
                } else {
                    cancelDailyNotifications();
                }
            }
        };
    }

    // Toggle Settings panel visibility
    if (settingsBtn && settingsPanel) {
        settingsBtn.onclick = (e) => {
            e.stopPropagation();
            settingsPanel.classList.toggle("hidden");
            const isHidden = settingsPanel.classList.contains("hidden");
            logAnalyticsEvent(isHidden ? 'settings_close_click' : 'settings_open_click');
            console.log("[DEBUG CLIENT] Settings button clicked. Panel hidden status:", isHidden);
            if (!isHidden) {
                renderBookmarksList();
            }
        };
    }

    if (settingsCloseBtn && settingsPanel) {
        settingsCloseBtn.onclick = (e) => {
            e.stopPropagation();
            settingsPanel.classList.add("hidden");
            logAnalyticsEvent('settings_close_click');
        };
    }

    // Close settings panel if clicked outside
    document.addEventListener("click", (e) => {
        const isClickInsideButton = settingsBtn && settingsBtn.contains(e.target);
        const isClickInsidePanel = settingsPanel && settingsPanel.contains(e.target);

        if (settingsPanel && !settingsPanel.classList.contains("hidden") && !isClickInsidePanel && !isClickInsideButton) {
            settingsPanel.classList.add("hidden");
            console.log("[DEBUG CLIENT] Clicked outside. Closed settings panel.");
        }
    });

    // ==========================================
    // 📱 CAPACITOR NATIVE WRAPPER HANDLERS
    // ==========================================
    const isCapacitor = typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins;
    if (isCapacitor) {
        console.log("[DEBUG CLIENT] Initializing Capacitor native plugins...");
        const { App } = window.Capacitor.Plugins;

        // Configure native status bar on start
        applyTheme(storedTheme);

        // Native Android back button listener
        if (App) {
            App.addListener('backButton', () => {
                App.exitApp();
            });
            App.addListener('appStateChange', async ({ isActive }) => {
                if (isActive) {
                    console.log("[DEBUG CLIENT] Capacitor App resumed to foreground.");
                    checkAndRefreshDate();
                    await checkSubscriptionStatus();
                }
            });
        }
    }

    // ==========================================
    // 📖 DATA LOADING & RENDER SYSTEM
    // ==========================================
    async function loadPassageForDate(dateObj) {
        const dateStr = getLocalDateString(dateObj);
        const localTodayStr = getLocalDateString(new Date());

        // Redirect to today if attempting to load a past date without active subscription
        if (dateStr < localTodayStr && !isSubscribed && !hideNavArrows) {
            console.warn(`[DEBUG CLIENT] Access denied to historical date [${dateStr}]. Redirecting to today.`);
            currentDateInstance = new Date();
            showPaywall('history_date');
            return loadPassageForDate(currentDateInstance);
        }

        console.log(`[DEBUG CLIENT] Fetching Passage For: [${dateStr}] in language [${currentLanguage}]`);

        // Stop any active audio playback when date changes
        if (activeAudio) {
            console.log("[DEBUG CLIENT] Intercepted date shift: pausing current audio");
            activeAudio.pause();
            activeAudio = null;
            activeAudioButton = null;
        }

        // Format header display date using local timezone components
        const dateLocale = (locales[currentLanguage] && locales[currentLanguage].dateLocale) || "en-GB";
        const displayString = dateObj.toLocaleDateString(dateLocale, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        document.getElementById("today-date").innerText = displayString;

        // Visual loading trigger
        loader.classList.remove("hidden");
        appContent.classList.add("hidden");

        const requestUrl = `${FUNCTION_URL}?date=${dateStr}&lang=${currentLanguage}&translationType=${currentTranslationType}`;

        try {
            // 1. Primary path: query HTTP endpoint to guarantee Storage existence verification
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 9000);

            const response = await fetch(requestUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP status code error: ${response.status}`);

            const data = await response.json();
            console.log("[DEBUG CLIENT] Passage payload received via HTTP:", data);

            // Cache successful payload in localStorage as extra fallback layer
            localStorage.setItem(`passage_${currentLanguage}_${currentTranslationType}_${dateStr}`, JSON.stringify(data));
            localStorage.setItem("last_loaded_date", dateStr);
            activePassageData = data;

            // Trigger a background getDoc to populate the Firestore local IndexedDB cache automatically (allowed under secure read rules)
            if (db) {
                try {
                    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                    const docId = (currentTranslationType === "default" && (currentLanguage === "en" || currentLanguage === "ms"))
                        ? `${currentLanguage}_${dateStr}_default`
                        : `${currentLanguage}_${dateStr}`;
                    const docRef = doc(db, "passages", docId);
                    getDoc(docRef).then(() => {
                        console.log("[DEBUG CLIENT] Cached passage in Firestore IndexedDB via background read.");
                    }).catch(fsReadErr => {
                        console.warn("[DEBUG CLIENT] Background Firestore cache read failed:", fsReadErr);
                    });
                } catch (importErr) {
                    console.warn("[DEBUG CLIENT] Firestore import failed:", importErr);
                }
            }

            renderPassage(data);
            configureNavArrows(data, dateStr);

        } catch (error) {
            console.warn("[DEBUG CLIENT] HTTP fetch failed. Falling back to offline Firestore persistence cache...", error);

            // 2. Secondary path: Query Firestore (retrieving from offline persistence IndexedDB cache)
            if (db) {
                try {
                    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                    const docId = (currentTranslationType === "default" && (currentLanguage === "en" || currentLanguage === "ms"))
                        ? `${currentLanguage}_${dateStr}_default`
                        : `${currentLanguage}_${dateStr}`;
                    const docRef = doc(db, "passages", docId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        console.log("[DEBUG CLIENT] Read passage from offline Firestore cache:", data);

                        activePassageData = data;
                        renderPassage(data);
                        configureNavArrows(data, dateStr);

                        showToast("📶 Showing offline cached passage");
                        return; // Completed successfully!
                    }
                } catch (fsReadErr) {
                    console.error("[DEBUG CLIENT] Offline Firestore cache read failed:", fsReadErr);
                }
            }

            // 3. Tertiary path: Fallback to local storage cache
            const cachedData = localStorage.getItem(`passage_${currentLanguage}_${currentTranslationType}_${dateStr}`);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                activePassageData = parsed;
                renderPassage(parsed);
                configureNavArrows(parsed, dateStr);

                showToast("📶 Showing offline cached passage");
            } else {
                console.error("[DEBUG CLIENT] No cached passage available for date:", dateStr);
                // Render placeholder error
                document.getElementById("passage-heading").innerText = "Connection Error";
                document.getElementById("verses-container").innerHTML = `
                    <div style="text-align:center; padding: 2rem; color:var(--text-muted);">
                        <i class="fa-solid fa-cloud-bolt" style="font-size: 3rem; margin-bottom:1rem; color:var(--gold);"></i>
                        <p>Unable to retrieve today's passage. Please check your network connection and try again.</p>
                        <button id="retry-btn" class="header-meta-row" style="cursor:pointer; display:inline-flex; border-color:var(--accent);">
                            <i class="fa-solid fa-arrows-rotate"></i> Retry
                        </button>
                    </div>
                `;
                document.getElementById("retry-btn").onclick = () => loadPassageForDate(dateObj);

                prevBtn.classList.add("hidden");
                nextBtn.classList.add("hidden");

                loader.classList.add("hidden");
                appContent.classList.remove("hidden");
            }
        }
    }

    function configureNavArrows(data, activeDateStr) {
        if (hideNavArrows) {
            if (prevBtn) prevBtn.classList.add("hidden");
            if (nextBtn) nextBtn.classList.add("hidden");
            return;
        }

        if (data && data.hasPreviousDay) prevBtn.classList.remove("hidden");
        else prevBtn.classList.add("hidden");

        const localTodayStr = new Date().toLocaleDateString('sv');
        if (data && data.hasNextDay && activeDateStr < localTodayStr) {
            nextBtn.classList.remove("hidden");
        } else {
            nextBtn.classList.add("hidden");
        }
    }

    async function showConcordance(item) {
        console.log("[DEBUG CONCORDANCE] showConcordance called with item:", item);
        if (!item || !item.root) {
            console.warn("[DEBUG CONCORDANCE] showConcordance received invalid or empty item.");
            return;
        }
        let cleanRoot = item.root.trim();
        const match = cleanRoot.match(/\(([^)]+)\)/);
        if (match) {
            cleanRoot = match[1].trim();
        }
        console.log("[DEBUG CONCORDANCE] Extracted cleanRoot for API:", cleanRoot);

        const strings = getLanguageStrings(currentLanguage);
        concordanceModalTitle.innerText = strings.concordanceOccurrencesOf.replace("{root}", item.root.trim());
        concordanceModal.classList.remove("hidden");
        concordanceLoading.classList.remove("hidden");
        concordanceResultsList.innerHTML = "";
        concordanceError.classList.add("hidden");
        concordanceWordInfo.classList.add("hidden");

        try {
            let wordArabic = item.word;
            let wordTranslit = "";
            const translitMatch = item.word.match(/^(.*?)\s*\((.*?)\)$/);
            if (translitMatch) {
                wordArabic = translitMatch[1].trim();
                wordTranslit = translitMatch[2].trim();
            }

            let meaningHtml = "";
            const breakdown = item.morphology_breakdown || "";
            if (breakdown.includes("\n")) {
                const parts = breakdown.split(/\n+/).map(p => p.trim()).filter(Boolean);
                if (parts.length >= 2) {
                    meaningHtml = parts.slice(1).join("<br>");
                } else {
                    meaningHtml = breakdown;
                }
            } else {
                const match = breakdown.match(/(.*)\s*(?:,|\.)\s*(meaning|denoting|signifies|indicates|signifying|refers to|denotes)\s+(.*)/i);
                if (match) {
                    meaningHtml = `${match[2].trim().charAt(0).toUpperCase() + match[2].trim().slice(1)} ${match[3].trim()}`;
                } else {
                    meaningHtml = breakdown;
                }
            }

            concordanceWordInfo.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-weight: 700; color: var(--accent);">${strings.concordanceTargetWord}</span>
                    <span style="font-family: 'Amiri', serif; font-size: 1.2rem; color: var(--tasreef-word-color); direction: rtl; text-align: right;">
                        ${wordArabic} ${wordTranslit ? `<span style="font-size: 0.8rem; font-family: inherit; color: var(--text-muted);">(${wordTranslit})</span>` : ""}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-weight: 700; color: var(--accent);">${strings.concordanceWaznRoot}</span>
                    <span style="color: var(--text-main);">${item.wazn} (${strings.concordanceRootLabel} <strong style="color: var(--gold);">${item.root}</strong>)</span>
                </div>
                ${meaningHtml ? `
                <div style="border-top: 1px dashed var(--card-border); padding-top: 0.5rem; margin-top: 0.5rem; color: var(--text-muted); line-height: 1.25rem;">
                    ${meaningHtml}
                </div>` : ""}
            `;
            concordanceWordInfo.classList.remove("hidden");
        } catch (parseErr) {
            console.error("Failed to parse clicked word info:", parseErr);
        }

        try {
            const url = `https://concordance-api-qlnayz4vaq-uc.a.run.app/concordance_api?root=${encodeURIComponent(cleanRoot)}&limit=5`;
            console.log("[DEBUG CONCORDANCE] Fetching from URL:", url);
            const response = await fetch(url);
            console.log("[DEBUG CONCORDANCE] Response received. Status:", response.status, "OK:", response.ok);
            if (!response.ok) {
                if (response.status === 404) {
                    console.log("[DEBUG CONCORDANCE] Root not found in database (404):", cleanRoot);
                    concordanceLoading.classList.add("hidden");
                    concordanceResultsList.innerHTML = `<p style="text-align: center; font-size: 0.85rem; color: var(--text-muted); padding: 2rem; margin: 0;">${strings.concordanceEmpty}</p>`;
                    return;
                }
                throw new Error(`Server returned status ${response.status}`);
            }
            const data = await response.json();
            console.log("[DEBUG CONCORDANCE] Successfully parsed response data:", data);
            concordanceLoading.classList.add("hidden");

            if (!data.instances || data.instances.length === 0) {
                console.log("[DEBUG CONCORDANCE] No concordance instances found for root:", cleanRoot);
                concordanceResultsList.innerHTML = `<p style="text-align: center; font-size: 0.85rem; color: var(--text-muted); padding: 2rem; margin: 0;">${strings.concordanceEmpty}</p>`;
                return;
            }

            data.instances.forEach(inst => {
                const item = document.createElement("div");
                item.style.borderBottom = "1px solid var(--card-border)";
                item.style.padding = "1rem 0";

                let arabicHtml = inst.snippet || inst.uthmanic_rasm || "";
                if (inst.uthmanic_rasm && arabicHtml.includes(inst.uthmanic_rasm)) {
                    arabicHtml = arabicHtml.replace(
                        inst.uthmanic_rasm,
                        `<span style="color: var(--gold); font-weight: 700; border-bottom: 1.5px solid var(--gold); padding-bottom: 1px;">${inst.uthmanic_rasm}</span>`
                    );
                } else if (inst.bare_rasm && arabicHtml.includes(inst.bare_rasm)) {
                    arabicHtml = arabicHtml.replace(
                        inst.bare_rasm,
                        `<span style="color: var(--gold); font-weight: 700; border-bottom: 1.5px solid var(--gold); padding-bottom: 1px;">${inst.bare_rasm}</span>`
                    );
                }

                let translationHtml = inst.translation || "";
                if (translationHtml) {
                    translationHtml = translationHtml.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--gold); font-weight: 700;">$1</strong>');
                }

                const surahName = SURAH_NAMES[inst.surah - 1] || `Surah ${inst.surah}`;
                const waznInfo = (inst.wazn && inst.wazn.category) ? ` • ${inst.wazn.category}` : "";

                item.innerHTML = `
                    <div style="font-family: 'Amiri', serif; font-size: 1.3rem; margin-bottom: 0.5rem; line-height: 2.2rem; direction: rtl; text-align: right; color: var(--text-main);">
                        ${arabicHtml}
                    </div>
                    ${translationHtml ? `
                    <div style="font-size: 0.85rem; color: var(--text-muted); text-align: left; line-height: 1.3rem; margin-bottom: 0.5rem; direction: ltr;">
                        ${translationHtml}
                    </div>` : ''}
                    <div style="font-size: 0.75rem; color: var(--gold); text-align: left; direction: ltr; font-weight: 600;">
                        ${surahName} ${inst.surah}:${inst.ayah}${waznInfo}
                    </div>
                `;
                concordanceResultsList.appendChild(item);
            });

        } catch (err) {
            console.error("[DEBUG CONCORDANCE] Concordance Fetch Error:", err);
            concordanceLoading.classList.add("hidden");
            concordanceError.classList.remove("hidden");
            concordanceErrorMsg.innerText = strings.concordanceError.replace("{error}", err.message);
        }
    }

    function renderPassage(data) {
        const { meta, translations, overview, tasreef } = data;
        const strings = getLanguageStrings(currentLanguage);

        // Set Heading Info
        const versesLabel = currentLanguage === "ms" ? "ayat" : "verses";
        document.getElementById("passage-heading").innerText = `Surah ${meta.surahId} ${meta.surahName} (${versesLabel} ${meta.range})`;

        // Populate Verses
        const versesContainer = document.getElementById("verses-container");
        versesContainer.innerHTML = "";

        translations.forEach(v => {
            const verseElement = document.createElement("div");
            verseElement.className = `verse-block fade-in-el`;

            const verseNumHtml = `<span class="verse-num-badge">${v.verse}</span>`;
            const audioTriggerHtml = isSubscribed
                ? `<button class="verse-audio-btn" title="Listen" data-verse="${v.verse}"><i class="fa-solid fa-volume-high fa-flip-horizontal"></i></button>`
                : "";

            verseElement.innerHTML = `
                <div class="arabic-text">${v.arabic} <div class="verse-meta-indicators">${audioTriggerHtml}${verseNumHtml}</div></div>
                <div class="translation-text">${v.translation}</div>
            `;
            versesContainer.appendChild(verseElement);
        });

        // Set audio listeners on verse audio trigger buttons
        const audioButtons = versesContainer.querySelectorAll(".verse-audio-btn");
        audioButtons.forEach(btn => {
            btn.onclick = () => {
                const verseNumber = btn.getAttribute("data-verse");
                playVerseAudio(meta.surahId, verseNumber, btn);
            };
        });

        // Populate Overview
        const overviewContainer = document.getElementById("overview-content");
        overviewContainer.innerHTML = "";
        if (overview) {
            const paragraphs = overview.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
            paragraphs.forEach((pText, index) => {
                const pEl = document.createElement("p");
                pEl.innerText = pText;
                if (index === paragraphs.length - 1 && paragraphs.length > 1) {
                    pEl.className = "overview-prompt";
                }
                overviewContainer.appendChild(pEl);
            });
        }

        // Populate Tasreef Morphology Cards
        const tasreefContainer = document.getElementById("tasreef-container");
        tasreefContainer.innerHTML = "";

        tasreef.forEach(item => {
            const card = document.createElement("div");
            card.className = "tasreef-card fade-in-el";
            // Split morphology and meaning (supporting legacy and new double-newline formats)
            let morphologyDescHtml = "";
            const breakdown = item.morphology_breakdown || "";

            if (breakdown.includes("\n")) {
                const parts = breakdown.split(/\n+/).map(p => p.trim()).filter(Boolean);
                if (parts.length >= 2) {
                    const morphText = parts[0];
                    const meaningText = parts.slice(1).join("<br>");
                    morphologyDescHtml = `
                        <div class="tasreef-morphology">${morphText}</div>
                        <div class="tasreef-meaning">${meaningText}</div>
                    `;
                } else {
                    morphologyDescHtml = `<div class="tasreef-morphology">${breakdown}</div>`;
                }
            } else {
                // Legacy parser fallback: search for transition words (e.g. meaning, denoting, signifies, etc.)
                const match = breakdown.match(/(.*)\s*(?:,|\.)\s*(meaning|denoting|signifies|indicates|signifying|refers to|denotes)\s+(.*)/i);
                if (match) {
                    const morphologyPart = match[1].trim();
                    const transitionWord = match[2].trim();
                    const meaningPart = match[3].trim();
                    const capitalizedTransition = transitionWord.charAt(0).toUpperCase() + transitionWord.slice(1);
                    morphologyDescHtml = `
                        <div class="tasreef-morphology">${morphologyPart}</div>
                        <div class="tasreef-meaning">${capitalizedTransition} ${meaningPart}</div>
                    `;
                } else {
                    morphologyDescHtml = `<div class="tasreef-morphology">${breakdown}</div>`;
                }
            }

            // Split word and transliteration if format is Arabic (transliteration)
            let wordArabic = item.word;
            let wordTransliteration = "";
            const translitMatch = item.word.match(/^(.*?)\s*\((.*?)\)$/);
            if (translitMatch) {
                wordArabic = translitMatch[1].trim();
                wordTransliteration = translitMatch[2].trim();
            }

            let wordHtml = "";
            if (wordTransliteration) {
                wordHtml = `<div class="tasreef-word">${wordArabic} <span class="tasreef-word-translit">(${wordTransliteration})</span></div>`;
            } else {
                wordHtml = `<div class="tasreef-word">${wordArabic}</div>`;
            }

            card.innerHTML = `
                ${wordHtml}
                <div class="tasreef-detail-row">
                    <span class="tasreef-label">${strings.tasreefTriliteralRoot}</span> 
                    <span class="tasreef-value-highlight">${item.root}</span>
                </div>
                <div class="tasreef-detail-row">
                    <span class="tasreef-label">${strings.tasreefPatternWeight}</span> 
                    <span class="tasreef-value">${item.wazn}</span>
                </div>
                ${morphologyDescHtml}
            `;
            card.onclick = () => {
                if (card.classList.contains("premium-locked")) {
                    showPaywall('tasreef_card');
                    return;
                }
                logAnalyticsEvent('concordance_card_click', { root: item.root, word: item.word });
                showConcordance(item);
            };

            tasreefContainer.appendChild(card);
        });

        // Metadata tags update
        updateMetadata(`Surah ${meta.surahName} (verses ${meta.range}) Context Analysis`, OG_IMAGE);

        // Hide spinner, show content
        loader.classList.add("hidden");
        appContent.classList.remove("hidden");

        // Update header bookmark icon status
        updateBookmarkIconState();
    }

    function playVerseAudio(surahId, verseNumber, btn) {
        logAnalyticsEvent('audio_play_click', { surah_id: surahId, verse_number: verseNumber });
        // 1. If this exact verse is already playing, pause it
        if (activeAudio && activeAudioButton === btn) {
            console.log("[DEBUG CLIENT] Toggling pause on current audio");
            activeAudio.pause();
            return;
        }

        // 2. Stop any running audio
        if (activeAudio) {
            activeAudio.pause();
        }

        // 3. Construct source URL
        const audioUrl = `https://the-quran-project.github.io/Quran-Audio/Data/1/${surahId}_${verseNumber}.mp3`;
        console.log("[DEBUG CLIENT] Attempting play audio from:", audioUrl);

        // Update CSS button states
        document.querySelectorAll(".verse-audio-btn").forEach(b => b.classList.remove("playing"));
        btn.classList.add("playing");

        // Instantiate
        const audioInstance = new Audio(audioUrl);
        activeAudio = audioInstance;
        activeAudioButton = btn;

        // Binds
        audioInstance.onended = () => {
            btn.classList.remove("playing");
            if (activeAudio === audioInstance) {
                activeAudio = null;
                activeAudioButton = null;
            }
            console.log("[DEBUG CLIENT] Audio ended.");
        };

        audioInstance.onpause = () => {
            btn.classList.remove("playing");
            if (activeAudio === audioInstance) {
                activeAudio = null;
                activeAudioButton = null;
            }
            console.log("[DEBUG CLIENT] Audio paused.");
        };

        audioInstance.onerror = (e) => {
            btn.classList.remove("playing");
            if (activeAudio === audioInstance) {
                activeAudio = null;
                activeAudioButton = null;
            }
            console.error("[DEBUG CLIENT] Audio loading error:", e);
            showToast("⚠️ Audio file not found or failed to load");
        };

        // Execution
        audioInstance.play().catch(err => {
            console.error("[DEBUG CLIENT] Audio play failed:", err);
            btn.classList.remove("playing");
            if (activeAudio === audioInstance) {
                activeAudio = null;
                activeAudioButton = null;
            }
            showToast("⚠️ Playback failed. Check network.");
        });
    }

    function updateMetadata(description, imageUrl) {
        const descTags = document.querySelectorAll('meta[property="og:description"], meta[property="twitter:description"], meta[name="description"]');
        descTags.forEach(tag => tag.setAttribute("content", description));

        const imageTags = document.querySelectorAll('meta[property="og:image"], meta[property="twitter:image"]');
        imageTags.forEach(tag => tag.setAttribute("content", imageUrl));
    }

    async function showDeveloperDiagnostics() {
        let diagInfo = `--- Diagnostics ---\n`;
        diagInfo += `Flavor: ${window.buildFlavor}\n`;
        diagInfo += `IsSubscribed: ${isSubscribed}\n`;
        diagInfo += `ActivePlanType: ${activePlanType}\n`;
        diagInfo += `IsCapacitor: ${isCapacitor}\n`;
        diagInfo += `Testing Mode (IS_TESTING_MODE): ${IS_TESTING_MODE}\n`;

        if (isCapacitor) {
            diagInfo += `Platform: ${window.Capacitor.getPlatform()}\n`;
            try {
                const { Purchases } = window.Capacitor.Plugins;
                if (Purchases) {
                    const uidResult = await Purchases.getAppUserID();
                    const uid = (uidResult && typeof uidResult === 'object') ? (uidResult.appUserID || JSON.stringify(uidResult)) : uidResult;
                    diagInfo += `RC AppUserID: ${uid}\n`;
                    
                    const infoResult = await Purchases.getCustomerInfo();
                    const info = (infoResult && infoResult.customerInfo) ? infoResult.customerInfo : infoResult;
                    diagInfo += `RC Active Subs: ${JSON.stringify(info ? info.activeSubscriptions : null)}\n`;
                    diagInfo += `RC All Purchased: ${JSON.stringify(info ? info.allPurchasedProductIdentifiers : null)}\n`;
                    diagInfo += `RC Entitlements: ${JSON.stringify((info && info.entitlements && info.entitlements.active) ? Object.keys(info.entitlements.active) : null)}\n`;
                }
            } catch (err) {
                diagInfo += `RC Error: ${err.message || JSON.stringify(err)}\n`;
            }
        }
        
        alert(diagInfo);
    }

    function getSubscriptionTermsText(lang) {
        const isIos = (typeof window.Capacitor !== 'undefined' && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'ios');
        const isAndroid = (typeof window.Capacitor !== 'undefined' && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'android');
        
        if (lang === "ms") {
            const storeAccount = isIos ? "akaun Apple ID" : (isAndroid ? "akaun Google Play" : "akaun");
            const storeSettings = isIos ? "Tetapan Akaun App Store" : (isAndroid ? "Tetapan Akaun Google Play" : "Tetapan Akaun");
            return `Bayaran akan dicaj ke ${storeAccount} anda semasa pengesahan pembelian. Langganan diperbaharui secara automatik melainkan pembaharuan automatik dimatikan sekurang-kurangnya 24 jam sebelum tamat tempoh semasa. Akaun anda akan dicaj untuk pembaharuan dalam tempoh 24 jam sebelum tamat tempoh semasa. Langganan boleh diuruskan atau dibatalkan dalam ${storeSettings} selepas pembelian. Sebarang bahagian tempoh percubaan percuma yang tidak digunakan akan terbatal apabila membeli langganan.`;
        } else {
            const storeAccount = isIos ? "your Apple ID account" : (isAndroid ? "your Google Play account" : "your account");
            const storeSettings = isIos ? "your App Store Account Settings" : (isAndroid ? "your Google Play Account Settings" : "your Account Settings");
            return `Payment will be charged to ${storeAccount} at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. Subscriptions may be managed or cancelled in ${storeSettings} after purchase. Any unused portion of a free trial period, if offered, will be forfeited when purchasing a subscription.`;
        }
    }

    function getLanguageStrings(lang = currentLanguage) {
        return Object.assign({}, locales["en"], locales[lang] || {});
    }

    function applyLocalization(lang) {
        const strings = getLanguageStrings(lang);

        // Header & Titles
        const appTitleHeader = document.getElementById("app-title-header");
        if (appTitleHeader) appTitleHeader.innerText = strings.appTitle;
        if (strings.appTitle) document.title = strings.appTitle;

        const overviewHeadingLabel = document.getElementById("overview-heading-label");
        if (overviewHeadingLabel) overviewHeadingLabel.innerText = strings.sectionOverview;

        const tasreefHeadingLabel = document.getElementById("tasreef-heading-label");
        if (tasreefHeadingLabel) tasreefHeadingLabel.innerText = strings.sectionTasreef;

        // Settings Panel
        const settingsTitleLabel = document.getElementById("settings-title-label");
        if (settingsTitleLabel) settingsTitleLabel.innerText = strings.settingsTitle;

        const settingsThemeLabel = document.getElementById("settings-theme-label");
        if (settingsThemeLabel) settingsThemeLabel.innerText = strings.settingsTheme;

        // Theme Buttons
        const themeBtnLight = document.getElementById("theme-btn-light");
        if (themeBtnLight) themeBtnLight.innerHTML = `<i class="fa-solid fa-sun"></i> ${strings.themeLight}`;

        const themeBtnDark = document.getElementById("theme-btn-dark");
        if (themeBtnDark) themeBtnDark.innerHTML = `<i class="fa-solid fa-moon"></i> ${strings.themeDark}`;

        const themeBtnSystem = document.getElementById("theme-btn-system");
        if (themeBtnSystem) themeBtnSystem.innerHTML = `<i class="fa-solid fa-mobile-screen"></i> ${strings.themeSystem}`;

        const settingsLangLabel = document.getElementById("settings-lang-label");
        if (settingsLangLabel) settingsLangLabel.innerText = strings.settingsLanguage;

        const settingsTranslationModeLabel = document.getElementById("settings-translation-type-label");
        if (settingsTranslationModeLabel) settingsTranslationModeLabel.innerText = strings.settingsTranslationMode;

        const translationTypeSelect = document.getElementById("translation-type-select");
        if (translationTypeSelect) {
            translationTypeSelect.options[0].text = strings.translationModeDefault;
            translationTypeSelect.options[1].text = strings.translationModeTasreef;
        }

        const settingsArabicSizeLabel = document.getElementById("settings-arabic-size-label");
        if (settingsArabicSizeLabel) settingsArabicSizeLabel.innerText = strings.settingsArabicSize;

        const settingsTranslationSizeLabel = document.getElementById("settings-translation-size-label");
        if (settingsTranslationSizeLabel) settingsTranslationSizeLabel.innerText = strings.settingsTranslationSize;

        const settingsNotificationsLabel = document.getElementById("settings-notifications-label");
        if (settingsNotificationsLabel) settingsNotificationsLabel.innerText = strings.settingsNotifications;

        // Bookmarks settings section
        const bookmarksUnlockLabel = document.getElementById("bookmarks-unlock-label");
        if (bookmarksUnlockLabel) bookmarksUnlockLabel.innerHTML = `<i class="fa-solid fa-lock"></i> ${strings.bookmarksUnlock}`;

        // Bookmarks count label
        const bookmarksBtnLabel = document.getElementById("bookmarks-btn-label");
        if (bookmarksBtnLabel) {
            const countVal = bookmarks ? bookmarks.length : 0;
            const localizedBtnText = strings.bookmarksTab || strings.bookmarksTitle.replace(" Penanda Buku Anda", " Penanda Buku").replace("Tanda Buku Anda", "Tanda Buku").replace("Your Bookmarks", "Bookmarks");
            bookmarksBtnLabel.innerHTML = `<i class="fa-solid fa-bookmark" style="color: var(--gold);"></i> ${localizedBtnText} (<span id="bookmarks-count">${countVal}</span>)`;
        }

        // Loader
        const loaderTextLabel = document.getElementById("loader-text-label");
        if (loaderTextLabel) loaderTextLabel.innerText = strings.loaderText;

        // Paywall Modal
        const paywallTitleLabel = document.getElementById("paywall-title-label");
        if (paywallTitleLabel) paywallTitleLabel.innerText = strings.paywallTitle;

        const paywallDescriptionLabel = document.getElementById("paywall-description-label");
        if (paywallDescriptionLabel) paywallDescriptionLabel.innerText = strings.paywallDescription;

        const paywallFeatNav = document.getElementById("paywall-feat-nav");
        if (paywallFeatNav) paywallFeatNav.innerText = strings.paywallFeatNav;

        const paywallFeatBookmarks = document.getElementById("paywall-feat-bookmarks");
        if (paywallFeatBookmarks) paywallFeatBookmarks.innerText = strings.paywallFeatBookmarks;

        const paywallFeatSearch = document.getElementById("paywall-feat-search");
        if (paywallFeatSearch) paywallFeatSearch.innerText = strings.paywallFeatSearch;

        const paywallFeatRecital = document.getElementById("paywall-feat-recital");
        if (paywallFeatRecital) paywallFeatRecital.innerText = strings.paywallFeatRecital;

        const paywallFeatSupport = document.getElementById("paywall-feat-support");
        if (paywallFeatSupport) paywallFeatSupport.innerText = strings.paywallFeatSupport;

        const paywallYearlyBtnPrice = document.getElementById("paywall-yearly-btn-price");
        if (paywallYearlyBtnPrice && !paywallYearlyBtnPrice.dataset.dynamic) paywallYearlyBtnPrice.innerText = strings.paywallYearlyPrice;

        const paywallYearlyBtnSub = document.getElementById("paywall-yearly-btn-sub");
        if (paywallYearlyBtnSub) paywallYearlyBtnSub.innerText = strings.paywallYearlySub;

        const paywallMonthlyBtnPrice = document.getElementById("paywall-monthly-btn-price");
        if (paywallMonthlyBtnPrice && !paywallMonthlyBtnPrice.dataset.dynamic) paywallMonthlyBtnPrice.innerText = strings.paywallMonthlyPrice;

        const paywallMonthlyBtnSub = document.getElementById("paywall-monthly-btn-sub");
        if (paywallMonthlyBtnSub) paywallMonthlyBtnSub.innerText = strings.paywallMonthlySub;

        const paywallSaveBadgeLabel = document.getElementById("paywall-save-badge-label");
        if (paywallSaveBadgeLabel) paywallSaveBadgeLabel.innerText = strings.paywallSave;

        const paywallRestoreBtnLabel = document.getElementById("paywall-restore-btn-label");
        if (paywallRestoreBtnLabel) paywallRestoreBtnLabel.innerText = strings.paywallRestore;

        const paywallTermsLabel = document.getElementById("paywall-terms-label");
        if (paywallTermsLabel) paywallTermsLabel.innerText = getSubscriptionTermsText(lang);

        const paywallPrivacyLink = document.getElementById("paywall-privacy-link");
        if (paywallPrivacyLink) paywallPrivacyLink.innerText = strings.paywallPrivacy;

        const paywallTermsLink = document.getElementById("paywall-terms-link");
        if (paywallTermsLink) paywallTermsLink.innerText = strings.paywallTermsLink;

        const aboutPrivacyLink = document.getElementById("about-privacy-link");
        if (aboutPrivacyLink) aboutPrivacyLink.innerText = strings.paywallPrivacy;

        const aboutTermsLink = document.getElementById("about-terms-link");
        if (aboutTermsLink) aboutTermsLink.innerText = strings.paywallTermsLink;

        const paywallSimulationLabel = document.getElementById("paywall-simulation-label");
        if (paywallSimulationLabel) {
            paywallSimulationLabel.innerText = strings.paywallSimulation;
            if (IS_TESTING_MODE) {
                paywallSimulationLabel.classList.remove("hidden");
            } else {
                paywallSimulationLabel.classList.add("hidden");
            }
        }

        // Bookmarks Modal
        const bookmarksModalTitle = document.getElementById("bookmarks-modal-title");
        if (bookmarksModalTitle) bookmarksModalTitle.innerText = strings.bookmarksTitle;

        // Search Modal
        const searchModalTitleText = document.getElementById("search-modal-title-text");
        if (searchModalTitleText) searchModalTitleText.innerText = strings.searchTitle;

        const searchInput = document.getElementById("search-input");
        if (searchInput) searchInput.placeholder = strings.searchPlaceholder;

        const searchResultsPlaceholderLabel = document.getElementById("search-results-placeholder-label");
        if (searchResultsPlaceholderLabel) searchResultsPlaceholderLabel.innerText = strings.searchEmpty;

        // Action Button Tooltips
        const settingsBtn = document.getElementById("settings-btn");
        if (settingsBtn) settingsBtn.setAttribute("title", strings.tooltipSettings);

        const aboutBtn = document.getElementById("about-btn");
        if (aboutBtn) aboutBtn.setAttribute("title", strings.tooltipAbout);

        const shareBtn = document.getElementById("share-btn");
        if (shareBtn) shareBtn.setAttribute("title", strings.tooltipShare);

        const searchTriggerBtn = document.getElementById("search-trigger-btn");
        if (searchTriggerBtn) searchTriggerBtn.setAttribute("title", strings.tooltipSearch);

        const bookmarkBtn = document.getElementById("bookmark-btn");
        if (bookmarkBtn) bookmarkBtn.setAttribute("title", strings.tooltipBookmark);

        const prevBtn = document.getElementById("prev-date-btn");
        if (prevBtn) prevBtn.setAttribute("title", strings.tooltipPrev);

        const nextBtn = document.getElementById("next-date-btn");
        if (nextBtn) nextBtn.setAttribute("title", strings.tooltipNext);

        // Share Modal Labels
        const shareModalTitle = document.getElementById("share-modal-title");
        if (shareModalTitle) shareModalTitle.innerText = strings.shareTitle;

        const shareCopyBtnLabel = document.getElementById("share-copy-btn-label");
        if (shareCopyBtnLabel) shareCopyBtnLabel.innerText = strings.shareCopyLabel;

        const shareNativeBtnLabel = document.getElementById("share-native-btn-label");
        if (shareNativeBtnLabel) shareNativeBtnLabel.innerText = strings.shareDeviceLabel;

        // Concordance Modal Labels
        const concordanceModalTitle = document.getElementById("concordance-modal-title");
        if (concordanceModalTitle) concordanceModalTitle.innerText = strings.concordanceTitle;

        const concordanceLoadingText = document.getElementById("concordance-loading-text");
        if (concordanceLoadingText) concordanceLoadingText.innerText = strings.concordanceLoading;

        // About Modal version number
        const aboutVersionLabel = document.getElementById("about-version-label");
        if (aboutVersionLabel) {
            aboutVersionLabel.innerText = `${lang === "ms" ? "Versi" : "Version"} ${APP_VERSION}`;
            
            // Hidden developer diagnostics tool (tap 5 times)
            let versionClickCount = 0;
            aboutVersionLabel.onclick = () => {
                versionClickCount++;
                if (versionClickCount >= 5) {
                    versionClickCount = 0;
                    showDeveloperDiagnostics();
                }
            };
        }

        // About Modal subscription status
        const subStatusEl = document.getElementById("about-subscription-status");
        if (subStatusEl) {
            if (isSubscribed && activePlanType) {
                const planName = activePlanType === "yearly" ? (strings.planYearly || "yearly") : (activePlanType === "monthly" ? (strings.planMonthly || "monthly") : (strings.planPremium || "premium"));
                const template = strings.subStatusSubscribed || "You're currently subscribed to the {plan} plan.";
                subStatusEl.innerText = template.replace("{plan}", planName);
                subStatusEl.style.color = "var(--accent)";
            } else {
                subStatusEl.innerText = strings.subStatusFree || "You are currently on the Free plan.";
                subStatusEl.style.color = "var(--text-muted)";
            }
        }
    }

    function showToast(message) {
        const strings = getLanguageStrings(currentLanguage);
        let finalMessage = message;
        // Translate common notifications
        if (message.includes("copied to clipboard")) {
            finalMessage = strings.toastCopied;
        } else if (message.includes("Showing offline cached passage")) {
            finalMessage = strings.toastOffline;
        } else if (message.includes("Passage bookmarked") || message.includes("bookmarked")) {
            finalMessage = strings.toastBookmarkAdded;
        } else if (message.includes("Bookmark removed") || message.includes("removed")) {
            finalMessage = strings.toastBookmarkRemoved;
        } else if (message.includes("Active! Unlocked (active for 5 mins)")) {
            finalMessage = strings.toastSimulatedUnlock;
        } else if (message.includes("purchases restored")) {
            finalMessage = strings.toastSimulatedRestore;
        } else if (message.includes("cancelled or failed")) {
            finalMessage = strings.toastPurchaseFailed || "Purchase cancelled or failed.";
        } else if (message.includes("Premium access unlocked") || message.includes("unlocked")) {
            finalMessage = strings.toastPremiumUnlocked || "Subscription Active! Premium access unlocked.";
        }

        copyToast.innerText = finalMessage;
        copyToast.classList.remove("hidden");
        setTimeout(() => {
            copyToast.classList.add("hidden");
        }, 2800);
    }

    // ==========================================
    // 🎮 NAVIGATION HOOKS
    // ==========================================
    if (prevBtn) {
        prevBtn.onclick = () => {
            logAnalyticsEvent('prev_day_click_attempt');
            if (!isSubscribed) {
                console.log("[DEBUG CLIENT] Gating history: showing subscription paywall");
                logAnalyticsEvent('prev_day_click_gated');
                showPaywall('prev_day_nav');
                return;
            }
            currentDateInstance.setDate(currentDateInstance.getDate() - 1);
            const dateStr = getLocalDateString(currentDateInstance);
            logAnalyticsEvent('prev_day_click_success', { target_date: dateStr });
            loadPassageForDate(currentDateInstance);
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            logAnalyticsEvent('next_day_click_attempt');
            const localTodayStr = getLocalDateString(new Date());
            const activeDateStr = getLocalDateString(currentDateInstance);
            if (activeDateStr < localTodayStr && !isSubscribed) {
                console.log("[DEBUG CLIENT] Gating next button on historical date: showing paywall");
                logAnalyticsEvent('next_day_click_gated');
                showPaywall('next_day_nav');
                return;
            }
            currentDateInstance.setDate(currentDateInstance.getDate() + 1);
            const dateStr = getLocalDateString(currentDateInstance);
            logAnalyticsEvent('next_day_click_success', { target_date: dateStr });
            loadPassageForDate(currentDateInstance);
        };
    }

    // ==========================================
    // ℹ️ ABOUT & PREMIUM PAYWALL MODALS
    // ==========================================
    if (aboutBtn) {
        aboutBtn.onclick = () => {
            logAnalyticsEvent('about_open_click');
            aboutModal.classList.remove("hidden");
        };
    }
    if (closeModalX) {
        closeModalX.onclick = () => {
            logAnalyticsEvent('about_close_click');
            aboutModal.classList.add("hidden");
        };
    }

    function showPaywall(triggerSource = 'direct') {
        if (paywallModal) {
            logAnalyticsEvent('paywall_open', { trigger: triggerSource });
            const paywallSimLabel = document.getElementById("paywall-simulation-label");
            const paywallTitle = document.getElementById("paywall-title-label");
            const paywallDesc = document.getElementById("paywall-description-label");
            const paywallActions = paywallModal.querySelector(".paywall-actions");
            const paywallTerms = document.getElementById("paywall-terms-label");
            const paywallLinksContainer = document.getElementById("paywall-links-container");
            const paywallWebPromo = document.getElementById("paywall-web-promo");

            // Apply current localized strings
            const strings = getLanguageStrings(currentLanguage);
            if (paywallTitle) paywallTitle.innerText = strings.paywallTitle;
            if (paywallDesc) paywallDesc.innerText = strings.paywallDescription;

            if (paywallActions) paywallActions.classList.remove("hidden");
            if (paywallTerms) {
                paywallTerms.innerText = getSubscriptionTermsText(currentLanguage);
                paywallTerms.classList.remove("hidden");
            }
            if (paywallLinksContainer) paywallLinksContainer.classList.remove("hidden");
            if (paywallWebPromo) paywallWebPromo.classList.add("hidden");

            if (!isCapacitor) {
                // Web mode: Show simulation note so visitors know payments are in testing/simulation mode
                if (paywallSimLabel) paywallSimLabel.classList.remove("hidden");
            } else {
                // Native App environment
                updatePaywallOfferings();
                if (paywallSimLabel) {
                    if (IS_TESTING_MODE) {
                        paywallSimLabel.classList.remove("hidden");
                    } else {
                        paywallSimLabel.classList.add("hidden");
                    }
                }
            }
            paywallModal.classList.remove("hidden");
        }
    }

    // Expose helpers on window for developer testing
    window.getSubscriptionTermsText = getSubscriptionTermsText;
    window.showPaywall = showPaywall;

    if (paywallCloseBtn) {
        paywallCloseBtn.onclick = () => {
            logAnalyticsEvent('paywall_close');
            paywallModal.classList.add("hidden");
        };
    }

    if (concordanceCloseBtn) {
        concordanceCloseBtn.onclick = () => {
            logAnalyticsEvent('concordance_close_click');
            concordanceModal.classList.add("hidden");
        };
    }

    window.addEventListener("click", (e) => {
        if (e.target === aboutModal) aboutModal.classList.add("hidden");
        if (e.target === paywallModal) {
            logAnalyticsEvent('paywall_close');
            paywallModal.classList.add("hidden");
        }
        if (e.target === bookmarksModal) bookmarksModal.classList.add("hidden");
        if (e.target === searchModal) searchModal.classList.add("hidden");
        if (e.target === shareModal) shareModal.classList.add("hidden");
        if (e.target === concordanceModal) concordanceModal.classList.add("hidden");
    });

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (aboutModal) aboutModal.classList.add("hidden");
            if (paywallModal && !paywallModal.classList.contains("hidden")) {
                logAnalyticsEvent('paywall_close');
                paywallModal.classList.add("hidden");
            }
            if (bookmarksModal) bookmarksModal.classList.add("hidden");
            if (searchModal) searchModal.classList.add("hidden");
            if (shareModal) shareModal.classList.add("hidden");
            if (concordanceModal) concordanceModal.classList.add("hidden");
        }
    });

    // ==========================================
    // 📤 NATIVE & WEB SHARE SHEET
    // ==========================================
    if (shareBtn) {
        shareBtn.onclick = () => {
            if (!activePassageData) return;
            const { meta, overview } = activePassageData;
            const activeDateStr = getLocalDateString(currentDateInstance);
            logAnalyticsEvent('share_passage_click', { date: activeDateStr, surah: meta.surahName });

            const strings = getLanguageStrings(currentLanguage);
            const shareText = `${strings.shareTextHeader}\n\n✨ Surah ${meta.surahName} (${strings.shareTextVerses} ${meta.range})\n\n"${overview}"\n\n${strings.shareTextLink}\nhttps://quran-potd.web.app/?date=${activeDateStr}`;

            if (sharePreviewText) sharePreviewText.innerText = shareText;
            if (shareModal) shareModal.classList.remove("hidden");
            if (settingsPanel) settingsPanel.classList.add("hidden");
        };
    }

    if (shareModalCloseBtn) {
        shareModalCloseBtn.onclick = () => {
            if (shareModal) shareModal.classList.add("hidden");
        };
    }

    if (shareCopyBtn) {
        shareCopyBtn.onclick = async () => {
            if (!activePassageData) return;
            const { meta, overview } = activePassageData;
            const activeDateStr = getLocalDateString(currentDateInstance);
            const strings = getLanguageStrings(currentLanguage);
            const shareText = `${strings.shareTextHeader}\n\n✨ Surah ${meta.surahName} (${strings.shareTextVerses} ${meta.range})\n\n"${overview}"\n\n${strings.shareTextLink}\nhttps://quran-potd.web.app/?date=${activeDateStr}`;

            try {
                await navigator.clipboard.writeText(shareText);
                showToast("✅ Passage copied to clipboard!");
                if (shareModal) shareModal.classList.add("hidden");
            } catch (err) {
                console.error("[DEBUG CLIENT] Clipboard transaction failed:", err);
            }
        };
    }

    if (shareNativeBtn) {
        shareNativeBtn.onclick = async () => {
            if (!activePassageData) return;
            const { meta, overview } = activePassageData;
            const activeDateStr = getLocalDateString(currentDateInstance);
            const strings = getLanguageStrings(currentLanguage);
            const shareTitle = strings.appTitle;
            const shareText = `${strings.shareTextHeader}\n\n✨ Surah ${meta.surahName} (${strings.shareTextVerses} ${meta.range})\n\n"${overview}"\n\n${strings.shareTextLink}\nhttps://quran-potd.web.app/?date=${activeDateStr}`;

            if (isCapacitor && window.Capacitor.Plugins.Share) {
                const { Share } = window.Capacitor.Plugins;
                try {
                    await Share.share({
                        title: shareTitle,
                        text: shareText,
                        dialogTitle: 'Share Passage of the Day'
                    });
                    if (shareModal) shareModal.classList.add("hidden");
                    return;
                } catch (err) {
                    console.error("[DEBUG CLIENT] Native share failed:", err);
                }
            }

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: shareTitle,
                        text: shareText
                    });
                    if (shareModal) shareModal.classList.add("hidden");
                    return;
                } catch (err) {
                    console.warn("[DEBUG CLIENT] Web Share API failed or cancelled:", err);
                }
            }

            // Fallback for desktop browser copy if native is unsupported
            try {
                await navigator.clipboard.writeText(shareText);
                showToast("✅ Passage copied to clipboard!");
                if (shareModal) shareModal.classList.add("hidden");
            } catch (err) {
                console.error("[DEBUG CLIENT] Clipboard transaction failed:", err);
            }
        };
    }

    // ==========================================
    // 🔖 BOOKMARKS ENGINE
    // ==========================================
    function loadBookmarks() {
        try {
            const saved = localStorage.getItem("app_bookmarks");
            bookmarks = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("[DEBUG CLIENT] Failed to load bookmarks:", e);
            bookmarks = [];
        }
    }

    function saveBookmarks() {
        localStorage.setItem("app_bookmarks", JSON.stringify(bookmarks));
    }

    function renderBookmarksList() {
        const countEl = document.getElementById("bookmarks-count");
        if (countEl) {
            countEl.innerText = bookmarks.length;
        }
        if (!bookmarksModalList) return;
        bookmarksModalList.innerHTML = "";

        if (bookmarks.length === 0) {
            bookmarksModalList.innerHTML = `
                <p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-top: 1.2rem; padding: 1rem;">
                    No bookmarked passages yet.
                </p>
            `;
            return;
        }

        bookmarks.forEach(bm => {
            const item = document.createElement("div");
            item.className = "bookmark-item";

            const displayTitle = bm.title || bm.heading;
            const subtext = bm.title ? bm.heading : bm.date;

            item.innerHTML = `
                <div class="bookmark-info">
                    <span class="bookmark-title-label">${displayTitle}</span>
                    <span class="bookmark-coords-sub">${subtext}</span>
                </div>
                <button class="bookmark-delete-btn" title="Delete Bookmark">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;

            item.querySelector(".bookmark-info").onclick = (e) => {
                e.stopPropagation();
                if (settingsPanel) settingsPanel.classList.add("hidden");
                if (bookmarksModal) bookmarksModal.classList.add("hidden");
                const parts = bm.date.split('-');
                currentDateInstance = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                hideNavArrows = false; // Restore navigation arrows when navigating from bookmarks
                loadPassageForDate(currentDateInstance);
            };

            item.querySelector(".bookmark-delete-btn").onclick = (e) => {
                e.stopPropagation();
                removeBookmark(bm.date);
            };

            bookmarksModalList.appendChild(item);
        });
    }

    function removeBookmark(dateStr) {
        bookmarks = bookmarks.filter(bm => bm.date !== dateStr);
        saveBookmarks();
        renderBookmarksList();
        updateBookmarkIconState();
    }

    function updateBookmarkIconState() {
        if (!bookmarkIcon) return;
        const activeDateStr = getLocalDateString(currentDateInstance);
        const isBookmarked = bookmarks.some(bm => bm.date === activeDateStr);

        if (isBookmarked) {
            bookmarkIcon.className = "fa-solid fa-bookmark bookmark-active";
        } else {
            bookmarkIcon.className = "fa-regular fa-bookmark";
        }
    }

    function toggleBookmark() {
        if (!activePassageData) return;
        const activeDateStr = getLocalDateString(currentDateInstance);
        const isBookmarked = bookmarks.some(bm => bm.date === activeDateStr);

        if (isBookmarked) {
            bookmarks = bookmarks.filter(bm => bm.date !== activeDateStr);
            logAnalyticsEvent('bookmark_removed', { date: activeDateStr });
            showToast("Bookmark removed");
        } else {
            const headingText = `Surah ${activePassageData.meta.surahId} ${activePassageData.meta.surahName} (verses ${activePassageData.meta.range})`;
            bookmarks.push({
                date: activeDateStr,
                title: activePassageData.title || "",
                heading: headingText
            });
            logAnalyticsEvent('bookmark_added', { date: activeDateStr });
            showToast("Passage bookmarked");
        }
        saveBookmarks();
        renderBookmarksList();
        updateBookmarkIconState();
    }

    if (bookmarkBtn) {
        bookmarkBtn.onclick = () => {
            logAnalyticsEvent('bookmark_click_attempt');
            if (!isSubscribed) {
                console.log("[DEBUG CLIENT] Gating bookmarks: showing subscription paywall");
                logAnalyticsEvent('bookmark_click_gated');
                showPaywall('bookmark_action');
                return;
            }
            toggleBookmark();
        };
    }

    if (bookmarksGatedView) {
        bookmarksGatedView.onclick = () => {
            console.log("[DEBUG CLIENT] Gating bookmarks view: showing subscription paywall");
            showPaywall('bookmarks_view');
        };
    }

    if (settingsViewBookmarksBtn) {
        settingsViewBookmarksBtn.onclick = () => {
            if (settingsPanel) settingsPanel.classList.add("hidden");
            if (bookmarksModal) bookmarksModal.classList.remove("hidden");
            renderBookmarksList();
        };
    }

    if (bookmarksCloseBtn) {
        bookmarksCloseBtn.onclick = () => {
            if (bookmarksModal) bookmarksModal.classList.add("hidden");
        };
    }

    // ==========================================
    // 🔔 LOCAL NOTIFICATIONS ENGINE (1:00 AM DAILY)
    // ==========================================
    async function scheduleDailyNotification() {
        if (!isCapacitor) return;

        // Check local toggle status
        const isEnabled = notificationsToggle ? notificationsToggle.checked : true;
        if (!isEnabled) {
            console.log("[DEBUG CLIENT] Daily notifications are disabled via settings. Cancelling active schedules.");
            cancelDailyNotifications();
            return;
        }

        const { LocalNotifications } = window.Capacitor.Plugins;
        if (!LocalNotifications) return;

        try {
            // Check & request permissions first
            const perms = await LocalNotifications.checkPermissions();
            if (perms.display !== 'granted') {
                const req = await LocalNotifications.requestPermissions();
                if (req.display !== 'granted') {
                    console.log("[DEBUG CLIENT] Notification permissions denied by user.");
                    return;
                }
            }

            // Cancel previous schedules to avoid duplication
            await LocalNotifications.cancel({ notifications: [{ id: 101 }, { id: 102 }] });

            // Calculate tomorrow's date representation
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            // Silent fetch for tomorrow's passage title
            let passageTitle = "Reflect on today's verses and linguistic breakdown.";
            try {
                const res = await fetch(`https://getpassageoftheday-mayya3vt7q-uc.a.run.app?date=${tomorrowStr}&lang=${currentLanguage}&translationType=${currentTranslationType}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.title) {
                        passageTitle = data.title;
                    }
                }
            } catch (err) {
                console.log("[DEBUG CLIENT] Silent fetch tomorrow's title failed. Fallback title scheduled.", err);
            }

            // Set custom target time: tomorrow at 1:00 AM local time
            const targetTriggerTime = new Date();
            targetTriggerTime.setDate(targetTriggerTime.getDate() + 1);
            targetTriggerTime.setHours(1, 0, 0, 0);

            console.log(`[DEBUG CLIENT] Scheduling tomorrow's notification (ID 101) for ${targetTriggerTime.toString()} with title: "${passageTitle}"`);

            // Schedule the single custom notification for tomorrow, and a recurring notification as a long-term fallback
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: `Qur'an POTD: ${tomorrowStr}`,
                        body: passageTitle,
                        id: 101,
                        schedule: {
                            at: targetTriggerTime,
                            allowWhileIdle: true
                        }
                    },
                    {
                        title: "Qur'an Passage of the Day",
                        body: "Your new daily passage is ready. Tap to read and reflect.",
                        id: 102,
                        schedule: {
                            on: { hour: 1, minute: 0 },
                            repeats: true,
                            allowWhileIdle: true
                        }
                    }
                ]
            });
        } catch (e) {
            console.error("[DEBUG CLIENT] Local notification scheduling pipeline crashed:", e);
        }
    }

    async function cancelDailyNotifications() {
        if (!isCapacitor) return;
        const { LocalNotifications } = window.Capacitor.Plugins;
        if (!LocalNotifications) return;

        try {
            await LocalNotifications.cancel({ notifications: [{ id: 101 }, { id: 102 }] });
            console.log("[DEBUG CLIENT] Canceled all scheduled notifications.");
        } catch (e) {
            console.error("[DEBUG CLIENT] Failed to cancel notifications:", e);
        }
    }

    // ==========================================
    // 🔍 SEARCH ENGINE (CLIENT-SIDE GCS INDEXED SEARCH)
    // ==========================================
    async function loadSearchIndex() {
        if (localSearchIndex.length > 0) return;

        console.log("[SEARCH] Fetching search index from GCS storage via endpoint...");
        try {
            const indexUrl = `https://getsearchindex-mayya3vt7q-uc.a.run.app?lang=${currentLanguage}`;
            const response = await fetch(indexUrl);
            if (response.ok) {
                localSearchIndex = await response.json();
                console.log(`[SEARCH] Loaded search index containing ${localSearchIndex.length} entries.`);
            } else {
                console.warn("[SEARCH] Storage search index fetch failed with status:", response.status);
            }
        } catch (err) {
            console.error("[SEARCH] Failed to fetch search index:", err);
        }
    }

    function performSearch(query) {
        if (!searchResultsList) return;
        searchResultsList.innerHTML = "";

        if (!query || query.trim() === "") {
            searchResultsList.innerHTML = `
                <p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-top: 1.5rem; padding: 1rem; line-height: 1.3rem;">
                    Enter a keyword, topic, or Arabic root to search.
                </p>
            `;
            return;
        }

        const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        if (terms.length === 0) return;

        // Perform substring matching for all terms
        const results = localSearchIndex.filter(entry => {
            return terms.every(term => entry.searchText.includes(term));
        });

        if (results.length === 0) {
            searchResultsList.innerHTML = `
                <p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-top: 1.5rem; padding: 1rem; line-height: 1.3rem;">
                    No matching passages found. Try checking spelling or different terms.
                </p>
            `;
            return;
        }

        results.forEach(res => {
            const card = document.createElement("div");
            card.className = "bookmark-item";
            card.innerHTML = `
                <div class="bookmark-info">
                    <span class="bookmark-title-label">${res.title}</span>
                    <span class="bookmark-coords-sub">${res.reference} (${res.date})</span>
                </div>
            `;

            card.onclick = () => {
                if (searchModal) searchModal.classList.add("hidden");
                const parts = res.date.split('-');
                currentDateInstance = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                hideNavArrows = false; // Restore navigation arrows when navigating from search
                loadPassageForDate(currentDateInstance);
            };

            searchResultsList.appendChild(card);
        });
    }

    if (searchTriggerBtn) {
        searchTriggerBtn.onclick = () => {
            logAnalyticsEvent('search_click_attempt');
            if (!isSubscribed) {
                console.log("[DEBUG CLIENT] Gating search: showing subscription paywall");
                logAnalyticsEvent('search_click_gated');
                showPaywall('search_feature');
                return;
            }
            logAnalyticsEvent('search_open_click');
            if (settingsPanel) settingsPanel.classList.add("hidden");
            if (searchModal) {
                searchModal.classList.remove("hidden");
                // Focus input immediately on open
                setTimeout(() => {
                    if (searchInput) searchInput.focus();
                }, 50);
            }
            loadSearchIndex(); // Load the index silently on open
        };
    }

    if (searchCloseBtn) {
        searchCloseBtn.onclick = () => {
            logAnalyticsEvent('search_close_click');
            if (searchModal) searchModal.classList.add("hidden");
        };
    }

    if (searchInput) {
        searchInput.oninput = (e) => {
            performSearch(e.target.value);
        };
    }

    // ==========================================

    // ==========================================
    // 💳 IN-APP SUBSCRIPTIONS (REVENUECAT)
    // ==========================================
    // Helper to evaluate active entitlements or active direct subscriptions from RevenueCat CustomerInfo
    function hasActiveEntitlement(infoOrResult) {
        if (!infoOrResult) return null;
        
        let customerInfo = infoOrResult;
        if (infoOrResult && infoOrResult.customerInfo) {
            customerInfo = infoOrResult.customerInfo;
        }
        
        console.log("[DEBUG CLIENT] Checking active entitlements. Raw activeSubscriptions:", 
            JSON.stringify(customerInfo ? customerInfo.activeSubscriptions : null), 
            "Active Entitlements:", 
            JSON.stringify((customerInfo && customerInfo.entitlements) ? customerInfo.entitlements.active : null)
        );

        if (!customerInfo) return null;

        // 1. Check preferred entitlement
        if (customerInfo.entitlements && customerInfo.entitlements.active && customerInfo.entitlements.active['premium_access']) {
            return customerInfo.entitlements.active['premium_access'];
        }

        // 2. Check any active entitlement
        if (customerInfo.entitlements && customerInfo.entitlements.active) {
            const activeKeys = Object.keys(customerInfo.entitlements.active);
            if (activeKeys.length > 0) {
                console.log(`[DEBUG CLIENT] Fallback: Using active entitlement '${activeKeys[0]}'`);
                return customerInfo.entitlements.active[activeKeys[0]];
            }
        }

        // 3. Check any active subscriptions directly (failsafe if entitlement not configured in dashboard)
        if (customerInfo.activeSubscriptions && customerInfo.activeSubscriptions.length > 0) {
            const activeSubProdId = customerInfo.activeSubscriptions[0];
            console.log(`[DEBUG CLIENT] Fallback: Found direct active subscription product in RevenueCat: '${activeSubProdId}'`);
            return {
                productIdentifier: activeSubProdId,
                isActive: true
            };
        }

        return null;
    }

    // Helper to commit premium access and update views
    function unlockPremiumAccess(message) {
        isSubscribed = true;
        logAnalyticsEvent('subscription_unlocked', { source: message });
        if (paywallModal) paywallModal.classList.add("hidden");
        showToast(message);

        // Remove gray out / gated styling from header buttons
        if (bookmarkBtn) bookmarkBtn.classList.remove("gated-premium-btn");
        if (searchTriggerBtn) searchTriggerBtn.classList.remove("gated-premium-btn");

        // Update bookmarks visibility states
        if (settingsViewBookmarksBtn) settingsViewBookmarksBtn.classList.remove("hidden");
        if (bookmarksGatedView) bookmarksGatedView.classList.add("hidden");
        renderBookmarksList();

        // Schedule daily local notifications
        scheduleDailyNotification();

        if (activePassageData) {
            console.log("[DEBUG CLIENT] Unlocked! Instantly unblurring premium sections...");
            renderPassage(activePassageData);
        }

        // Revalidate subscription to determine the active plan type and refresh the About modal
        checkSubscriptionStatus();
    }

    async function purchaseHuaweiSubscription(productId) {
        console.log(`[HMS IAP] Initiating purchase for HMS product: ${productId}`);
        if (window.HMSIAP) {
            try {
                const envReadyResult = await window.HMSIAP.isEnvReady();
                if (envReadyResult.returnCode === 0) {
                    const purchaseIntentReq = {
                        priceType: 2, // 2 = subscription
                        productId: productId,
                        developerPayload: "quran-potd-hms-purchase"
                    };
                    const purchaseResult = await window.HMSIAP.createPurchaseIntent(purchaseIntentReq);
                    if (purchaseResult.returnCode === 0 && purchaseResult.inAppPurchaseData) {
                        const purchaseData = JSON.parse(purchaseResult.inAppPurchaseData);
                        if (purchaseData.payState === 0) {
                            logAnalyticsEvent('purchase_success', { plan: 'hms', product_id: productId });
                            unlockPremiumAccess("Subscription Active! Premium access unlocked via Huawei AppGallery.");
                            return;
                        }
                    }
                    logAnalyticsEvent('purchase_failed', { plan: 'hms', product_id: productId, code: purchaseResult.returnCode });
                    showToast(`Huawei Purchase result code: ${purchaseResult.returnCode}`);
                } else {
                    logAnalyticsEvent('purchase_failed', { plan: 'hms', product_id: productId, error: 'env_not_ready' });
                    showToast(`Huawei HMS environment not ready (Code ${envReadyResult.returnCode})`);
                }
            } catch (err) {
                console.error("[HMS IAP] Error during Huawei IAP purchase:", err);
                const detail = err ? (err.message || JSON.stringify(err)) : "Unknown error";
                logAnalyticsEvent('purchase_failed', { plan: 'hms', product_id: productId, error: detail });
                showToast(`Huawei Billing error: ${detail}`);
            }
        } else {
            console.warn("[HMS IAP] Huawei IAP plugin not detected. Simulating HMS purchase...");
            const expiryTime = Date.now() + 5 * 60 * 1000;
            localStorage.setItem("simulated_subscription_expiry", expiryTime);
            logAnalyticsEvent('purchase_success', { plan: 'hms', is_simulation: true });
            unlockPremiumAccess(`[MOCK HMS] Subscription Active! Unlocked (active for 5 mins).`);
        }
    }

    async function purchaseSubscription(packageType, fallbackProductId) {
        console.log(`[DEBUG CLIENT] Purchase requested for packageType: ${packageType}`);
        if (isCapacitor && !IS_TESTING_MODE) {
            if (window.buildFlavor === 'hms') {
                await purchaseHuaweiSubscription(fallbackProductId);
                return;
            }
            try {
                const { Purchases } = window.Capacitor.Plugins;
                if (Purchases) {
                    const offerings = await Purchases.getOfferings();
                    const rcPackageKey = (packageType === 'yearly' || packageType === 'trial') ? 'annual' : packageType;
                    if (offerings.current && offerings.current[rcPackageKey]) {
                        const pkg = offerings.current[rcPackageKey];
                        const purchaseResult = await Purchases.purchasePackage({
                            aPackage: pkg
                        });
                        if (hasActiveEntitlement(purchaseResult.customerInfo)) {
                            logAnalyticsEvent('purchase_success', {
                                plan: packageType,
                                product_id: pkg.product ? pkg.product.identifier : fallbackProductId
                            });
                            unlockPremiumAccess("Subscription Active! Premium access unlocked.");
                            return;
                        }
                    } else {
                        // Fallback product purchases if offering configs are pending validation
                        const purchaseResult = await Purchases.purchaseProduct({
                            productId: fallbackProductId
                        });
                        if (hasActiveEntitlement(purchaseResult.customerInfo)) {
                            logAnalyticsEvent('purchase_success', {
                                plan: packageType,
                                product_id: fallbackProductId
                            });
                            unlockPremiumAccess("Subscription Active! Premium access unlocked.");
                            return;
                        }
                    }
                }
            } catch (err) {
                console.error("[DEBUG CLIENT] RevenueCat purchase failed:", err);
                if (err && err.userCancelled) {
                    logAnalyticsEvent('purchase_cancelled', { plan: packageType });
                    showToast("Purchase cancelled.");
                } else {
                    const errMsg = err ? (err.message || err.readableErrorCode || JSON.stringify(err)) : "Unknown error";
                    logAnalyticsEvent('purchase_failed', { plan: packageType, error: errMsg });
                    showToast(`Purchase failed: ${errMsg}`);
                }
            }
        } else {
            // Browser testing simulation or forced simulation triggers simulated purchase and sets subscriber flag true
            console.log(`[DEBUG CLIENT] Simulation mode: unlocking premium access via ${packageType} option`);
            const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes in ms
            localStorage.setItem("simulated_subscription_expiry", expiryTime);
            localStorage.setItem("simulated_subscription_plan", packageType);
            logAnalyticsEvent('purchase_success', { plan: packageType, is_simulation: true });
            unlockPremiumAccess(`Simulated ${packageType.toUpperCase()} Subscription Active! Unlocked (active for 5 mins).`);
        }
    }

    async function updatePaywallOfferings() {
        if (isCapacitor && !IS_TESTING_MODE && window.buildFlavor !== 'hms') {
            try {
                const { Purchases } = window.Capacitor.Plugins;
                if (Purchases) {
                    const offerings = await Purchases.getOfferings();
                    if (offerings && offerings.current) {
                        const yearlyPkg = offerings.current.annual;
                        const monthlyPkg = offerings.current.monthly;
                        const yearlyPriceEl = document.getElementById("paywall-yearly-btn-price");
                        const monthlyPriceEl = document.getElementById("paywall-monthly-btn-price");

                        if (yearlyPkg && yearlyPkg.product && yearlyPkg.product.priceString && yearlyPriceEl) {
                            yearlyPriceEl.innerText = `${yearlyPkg.product.priceString} / ${currentLanguage === 'ms' ? 'setahun' : 'year'}`;
                            yearlyPriceEl.dataset.dynamic = "true";
                        }
                        if (monthlyPkg && monthlyPkg.product && monthlyPkg.product.priceString && monthlyPriceEl) {
                            monthlyPriceEl.innerText = `${monthlyPkg.product.priceString} / ${currentLanguage === 'ms' ? 'sebulan' : 'month'}`;
                            monthlyPriceEl.dataset.dynamic = "true";
                        }
                    }
                }
            } catch (e) {
                console.warn("[PAYWALL] Failed to update dynamic offering prices:", e);
            }
        }
    }

    if (paywallSubscribeMonthlyBtn) {
        paywallSubscribeMonthlyBtn.onclick = () => {
            logAnalyticsEvent('subscribe_monthly_click');
            logAnalyticsEvent('subscribe_click', { plan: 'monthly' });
            const fallbackId = isCapacitor && window.Capacitor.getPlatform() === 'ios'
                ? 'premium_archive_monthly'
                : 'premium_archive_monthly:monthly-base-plan';
            purchaseSubscription('monthly', fallbackId);
        };
    }

    if (paywallSubscribeYearlyBtn) {
        paywallSubscribeYearlyBtn.onclick = () => {
            logAnalyticsEvent('subscribe_yearly_click');
            logAnalyticsEvent('subscribe_click', { plan: 'yearly' });
            const fallbackId = isCapacitor && window.Capacitor.getPlatform() === 'ios'
                ? 'premium_archive_yearly'
                : 'premium_archive_yearly:yearly-base-plan';
            purchaseSubscription('yearly', fallbackId);
        };
    }

    if (paywallRestoreBtn) {
        paywallRestoreBtn.onclick = async () => {
            logAnalyticsEvent('restore_purchases_click');
            console.log("[DEBUG CLIENT] Restore purchases clicked");
            if (isCapacitor) {
                try {
                    const { Purchases } = window.Capacitor.Plugins;
                    if (Purchases) {
                        const customerInfo = await Purchases.restorePurchases();
                        if (hasActiveEntitlement(customerInfo)) {
                            unlockPremiumAccess("Purchases restored successfully!");
                        } else {
                            showToast("No active premium subscription found to restore.");
                        }
                    }
                } catch (err) {
                    console.error("[DEBUG CLIENT] RevenueCat restore failed:", err);
                    const errMsg = err ? (err.message || err.readableErrorCode || JSON.stringify(err)) : "Unknown error";
                    showToast(`Restore failed: ${errMsg}`);
                }
            } else {
                showToast("Web Simulation: No purchases to restore.");
            }
        };
    }

    async function checkHuaweiActiveSubscriptions() {
        console.log("[HMS IAP] Checking active subscriptions...");
        if (window.HMSIAP) {
            try {
                const envReadyResult = await window.HMSIAP.isEnvReady();
                if (envReadyResult.returnCode === 0) {
                    const ownedReq = { priceType: 2 }; // 2 = subscription
                    const ownedResult = await window.HMSIAP.obtainOwnedPurchases(ownedReq);
                    if (ownedResult.returnCode === 0 && ownedResult.itemList) {
                        if (ownedResult.itemList.length > 0) {
                            isSubscribed = true;
                            console.log("[HMS IAP] User is subscribed to premium archive access via HMS.");
                            return true;
                        }
                    }
                }
            } catch (err) {
                console.warn("[HMS IAP] Failed to validate HMS subscription on startup:", err);
            }
        }
        return false;
    }

    async function checkSubscriptionStatus() {
        let subscriptionActive = false;
        let planType = null;

        // Check if simulated subscription is still active (5-minute persistence)
        const simulatedExpiry = localStorage.getItem("simulated_subscription_expiry");
        if (simulatedExpiry) {
            if (Number(simulatedExpiry) > Date.now()) {
                subscriptionActive = true;
                planType = localStorage.getItem("simulated_subscription_plan") || "monthly";
                console.log("[DEBUG CLIENT] Stored simulated subscription is active. Plan: " + planType);
            } else {
                localStorage.removeItem("simulated_subscription_expiry");
                localStorage.removeItem("simulated_subscription_plan");
                console.log("[DEBUG CLIENT] Stored simulated subscription expired.");
            }
        }

        // Validate subscription status if in Capacitor wrapper
        if (isCapacitor && !IS_TESTING_MODE) {
            // Reset simulated subscription state for native environment
            subscriptionActive = false;
            planType = null;

            if (window.buildFlavor === 'hms') {
                subscriptionActive = await checkHuaweiActiveSubscriptions();
                if (subscriptionActive) {
                    if (window.HMSIAP) {
                        try {
                            const ownedReq = { priceType: 2 };
                            const ownedResult = await window.HMSIAP.obtainOwnedPurchases(ownedReq);
                            if (ownedResult.returnCode === 0 && ownedResult.itemList && ownedResult.itemList.length > 0) {
                                const hasYearly = ownedResult.itemList.some(item => item.productId.includes("yearly"));
                                planType = hasYearly ? "yearly" : "monthly";
                            }
                        } catch (err) {
                            planType = "monthly";
                        }
                    }
                }
            } else {
                const { Purchases } = window.Capacitor.Plugins;
                if (Purchases) {
                    try {
                        const apiKey = window.Capacitor.getPlatform() === 'ios'
                            ? "appl_puVnUAMslLndYXRpNNqygcmWyzd"
                            : "goog_fucCDqVdLJYzzgZIuccubFtEgvv";

                        if (typeof Purchases.setLogLevel === 'function') {
                            await Purchases.setLogLevel({ level: "DEBUG" });
                        }
                        await Purchases.configure({ apiKey: apiKey });
                        console.log("[DEBUG CLIENT] RevenueCat configured.");
                        updatePaywallOfferings();

                        const customerInfo = await Purchases.getCustomerInfo();
                        const activeEnt = hasActiveEntitlement(customerInfo);
                        if (activeEnt) {
                            subscriptionActive = true;
                            const prodId = activeEnt.productIdentifier || "";
                            if (prodId.includes("yearly") || prodId.includes("annual")) {
                                planType = "yearly";
                            } else if (prodId.includes("monthly")) {
                                planType = "monthly";
                            } else {
                                planType = "premium";
                            }
                            console.log(`[DEBUG CLIENT] User is subscribed. Active plan: ${planType}`);
                        } else {
                            console.log("[DEBUG CLIENT] User is not subscribed.");
                        }
                    } catch (err) {
                        console.warn("[DEBUG CLIENT] RevenueCat validation failed:", err);
                    }
                }
            }
        }

        isSubscribed = subscriptionActive;
        activePlanType = planType;

        // Apply localization to update the subscription label on the About modal
        applyLocalization(currentLanguage);

        // Update bookmarks drawer display status and notifications based on active entitlement check
        if (isSubscribed) {
            if (settingsViewBookmarksBtn) settingsViewBookmarksBtn.classList.remove("hidden");
            if (bookmarksGatedView) bookmarksGatedView.classList.add("hidden");
            if (bookmarkBtn) bookmarkBtn.classList.remove("gated-premium-btn");
            if (searchTriggerBtn) searchTriggerBtn.classList.remove("gated-premium-btn");
            renderBookmarksList();

            // Schedule daily local notifications
            scheduleDailyNotification();
        } else {
            if (settingsViewBookmarksBtn) settingsViewBookmarksBtn.classList.add("hidden");
            if (bookmarksGatedView) bookmarksGatedView.classList.remove("hidden");
            if (bookmarkBtn) bookmarkBtn.classList.add("gated-premium-btn");
            if (searchTriggerBtn) searchTriggerBtn.classList.add("gated-premium-btn");

            // Cancel any previously scheduled alerts
            cancelDailyNotifications();

            // Redirect to today if viewing historical date
            const activeDateStr = getLocalDateString(currentDateInstance);
            const localTodayStr = getLocalDateString(new Date());
            if (activeDateStr < localTodayStr) {
                console.warn(`[DEBUG CLIENT] Active date [${activeDateStr}] is gated and user is unsubscribed. Redirecting to today's date.`);
                currentDateInstance = new Date();
                loadPassageForDate(currentDateInstance);
            }
        }
    }

    function isNewerVersion(local, latest) {
        if (!local || !latest) return false;
        const localParts = local.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);
        for (let i = 0; i < Math.max(localParts.length, latestParts.length); i++) {
            const localVal = localParts[i] || 0;
            const latestVal = latestParts[i] || 0;
            if (latestVal > localVal) return true;
            if (latestVal < localVal) return false;
        }
        return false;
    }

    async function checkAppUpdate() {
        if (!isCapacitor) return;

        try {
            const versionUrl = "https://quran-potd.web.app/version.json";
            const response = await fetch(versionUrl, { cache: "no-store" });
            if (!response.ok) throw new Error("Network status code: " + response.status);
            const data = await response.json();

            const latest = data.latest;
            const minRequired = data.minRequired;

            if (isNewerVersion(APP_VERSION, latest)) {
                console.log(`[UPDATE] New version available: ${latest} (Current: ${APP_VERSION})`);
                
                const updateModal = document.getElementById("update-modal");
                const updateCloseBtn = document.getElementById("update-close-btn");
                const updateTitleLabel = document.getElementById("update-title-label");
                const updateDescLabel = document.getElementById("update-description-label");
                const updateVersionInfoText = document.getElementById("update-version-info");
                const updateNowBtn = document.getElementById("update-now-btn");
                const updateLaterBtn = document.getElementById("update-later-btn");

                if (!updateModal) return;

                const isMandatory = isNewerVersion(APP_VERSION, minRequired);

                // Setup texts
                updateTitleLabel.innerText = strings.updateTitle;
                updateDescLabel.innerText = isMandatory ? strings.updateDescMandatory : strings.updateDescOptional;
                updateVersionInfoText.innerText = strings.updateVersionInfo.replace("{version}", latest);
                updateNowBtn.innerText = strings.updateNow;
                updateLaterBtn.innerText = strings.updateLater;

                // Handle visibility based on mandatory status
                if (isMandatory) {
                    if (updateCloseBtn) updateCloseBtn.classList.add("hidden");
                    if (updateLaterBtn) updateLaterBtn.classList.add("hidden");
                } else {
                    if (updateCloseBtn) {
                        updateCloseBtn.classList.remove("hidden");
                        updateCloseBtn.onclick = () => updateModal.classList.add("hidden");
                    }
                    if (updateLaterBtn) {
                        updateLaterBtn.classList.remove("hidden");
                        updateLaterBtn.onclick = () => updateModal.classList.add("hidden");
                    }
                }

                // Handle update click
                updateNowBtn.onclick = async () => {
                    const isIos = window.Capacitor.getPlatform() === 'ios';
                    const storeUrl = isIos 
                        ? (data.url.ios || "https://apps.apple.com/app/id6795434967") 
                        : (data.url.android || "https://play.google.com/store/apps/details?id=com.mpv.quran_potd");
                    window.open(storeUrl, "_system");
                };

                updateModal.classList.remove("hidden");
            }
        } catch (err) {
            console.warn("[UPDATE] Failed to check for updates:", err);
        }
    }

    // Async startup sequence to check query date parameters and authenticate subscriptions safely
    async function startApp() {
        // Load bookmarks on startup
        loadBookmarks();

        // Apply localization table
        applyLocalization(currentLanguage);

        // Fetch active build flavor from native plugin bridge
        if (isCapacitor && window.Capacitor.Plugins.BuildInfo) {
            try {
                const info = await window.Capacitor.Plugins.BuildInfo.getBuildFlavor();
                window.buildFlavor = info.flavor || 'gms';
            } catch (err) {
                console.warn("[DEBUG CLIENT] Failed to fetch build flavor from native plugin:", err);
            }
        }
        console.log("[DEBUG CLIENT] Active build flavor:", window.buildFlavor);

        // Fetch and apply subscription status
        await checkSubscriptionStatus();

        // Show permanent web app store badges if running on standard web browser
        if (!isCapacitor) {
            const webBadges = document.getElementById("web-appstore-badges");
            if (webBadges) webBadges.classList.remove("hidden");
        }

        // Check query date parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlDateStr = urlParams.get("date");

        if (urlDateStr && /^\d{4}-\d{2}-\d{2}$/.test(urlDateStr)) {
            // Shared link landing: bypass gating check, load the specific passage, and hide date nav arrows
            const parts = urlDateStr.split('-');
            currentDateInstance = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            hideNavArrows = true;

            // Encourage installing the app if landing on web
            if (!isCapacitor) {
                const sharedPromo = document.getElementById("shared-landing-promo");
                if (sharedPromo) sharedPromo.classList.remove("hidden");
            }

            // Clear URL date query parameter after parsing to avoid sticky url state on reload
            try {
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
                console.log("[DEBUG CLIENT] Cleared date query parameter from URL bar.");
            } catch (historyErr) {
                console.warn("[DEBUG CLIENT] Failed to replace state:", historyErr);
            }
        } else {
            currentDateInstance = new Date();
        }

        // Load passage
        loadPassageForDate(currentDateInstance);

        // Check for application updates (async, non-blocking)
        checkAppUpdate();
    }

    // Begin App Execution
    startApp();
});