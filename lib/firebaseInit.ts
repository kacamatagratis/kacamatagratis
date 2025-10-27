import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  limit,
} from "firebase/firestore";

/**
 * Initialize Firebase with default data
 * Run this once when setting up a new Firebase project
 */
export async function initializeFirebaseData() {
  try {
    console.log("🚀 Starting Firebase initialization...");

    // 1. Initialize Admin Settings
    await initializeAdminSettings();

    // 2. Initialize Message Templates
    await initializeMessageTemplates();

    // 3. Initialize DripSender Keys (placeholder)
    await initializeDripSenderKeys();

    // 4. Initialize Automation Settings
    await initializeAutomationSettings();

    console.log("✅ Firebase initialization complete!");
    return { success: true, message: "Firebase initialized successfully" };
  } catch (error) {
    console.error("❌ Error initializing Firebase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if data already exists in a collection
 */
async function collectionHasData(collectionName: string): Promise<boolean> {
  const q = query(collection(db, collectionName), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Initialize admin credentials
 */
async function initializeAdminSettings() {
  console.log("📝 Initializing admin settings...");

  // Check if admin settings already exist
  if (await collectionHasData("adminsetting")) {
    console.log("⏭️  Admin settings already exist, skipping...");
    return;
  }

  // Create default admin credential
  await setDoc(doc(db, "adminsetting", "credential"), {
    username: "admin",
    password: "admin123", // Change this in production!
    created_at: new Date().toISOString(),
  });

  console.log(
    "✅ Admin settings initialized (username: admin, password: admin123)"
  );
}

/**
 * Initialize message templates
 */
async function initializeMessageTemplates() {
  console.log("📝 Initializing message templates...");

  // Check if templates already exist
  if (await collectionHasData("message_templates")) {
    console.log("⏭️  Message templates already exist, skipping...");
    return;
  }

  const templates = [
    {
      name: "Welcome Message",
      type: "welcome",
      content: `Halo {sapaan} {name}! 👋

Terima kasih sudah mendaftar di Kacamata Gratis! 🎉

📍 Kota: {city}

🔗 Link Referral Anda:
{referral_code}

Bagikan link di atas ke teman dan keluarga untuk mendapatkan reward menarik!

Kami akan segera menghubungi Anda untuk informasi lebih lanjut.

Salam,
Tim Kacamata Gratis`,
      variables: ["sapaan", "name", "city", "referral_code"],
      created_at: new Date().toISOString(),
    },
    {
      name: "Event Notification",
      type: "event",
      content: `Halo {sapaan} {name}! 🎉

Ada event menarik untuk Anda:

📅 {event_title}
🔗 Link Zoom: {zoom_link}

Jangan lewatkan kesempatan ini!

Sampai jumpa di event! 👋`,
      variables: ["sapaan", "name", "event_title", "zoom_link"],
      created_at: new Date().toISOString(),
    },
    {
      name: "Referrer Alert",
      type: "referrer_alert",
      content: `Selamat {sapaan} {name}! 🎊

Anda berhasil mengajak {new_participant_name} untuk bergabung!

📊 Total Referral Anda: {referral_count} orang
🎯 Ini adalah referral ke-{referrer_sequence} Anda

Terus bagikan kode referral Anda untuk mendapatkan lebih banyak reward!

Terima kasih! 🙏`,
      variables: ["sapaan", "name", "new_participant_name", "referral_count", "referrer_sequence"],
      created_at: new Date().toISOString(),
    },
    {
      name: "Referral Success",
      type: "referral",
      content: `Selamat {sapaan} {name}! 🎊

Seseorang baru saja mendaftar menggunakan kode referral Anda!

📊 Total Referral: {referral_count} orang

Terus bagikan kode referral Anda untuk mendapatkan lebih banyak reward!

Terima kasih! 🙏`,
      variables: ["sapaan", "name", "referral_count"],
      created_at: new Date().toISOString(),
    },
    {
      name: "Broadcast Template",
      type: "broadcast",
      content: `Halo {sapaan} {name}! 👋

Ini adalah pesan broadcast dari Kacamata Gratis.

Lokasi Anda: {city}

Silakan edit template ini sesuai kebutuhan Anda.

Salam,
Tim Kacamata Gratis`,
      variables: ["sapaan", "name", "city"],
      created_at: new Date().toISOString(),
    },
  ];

  for (const template of templates) {
    await setDoc(doc(collection(db, "message_templates")), template);
  }

  console.log(`✅ ${templates.length} message templates initialized`);
}

/**
 * Initialize DripSender API keys (placeholder)
 */
async function initializeDripSenderKeys() {
  console.log("📝 Initializing DripSender keys...");

  // Check if keys already exist
  if (await collectionHasData("dripsender_keys")) {
    console.log("⏭️  DripSender keys already exist, skipping...");
    return;
  }

  // Create placeholder API key
  await setDoc(doc(collection(db, "dripsender_keys")), {
    label: "API Key 1",
    api_key: "YOUR_API_KEY_HERE", // Replace with actual API key
    is_active: false, // Set to false until real key is added
    usage_count: 0,
    health_status: "unknown",
    health_checked_at: null,
    health_error: null,
    created_at: new Date().toISOString(),
    last_used: null,
  });

  console.log(
    "✅ DripSender keys initialized (Please add your real API keys and test them!)"
  );
}

/**
 * Initialize automation settings
 */
async function initializeAutomationSettings() {
  console.log("📝 Initializing automation settings...");

  // Check if automation settings already exist
  if (await collectionHasData("automation_settings")) {
    console.log("⏭️  Automation settings already exist, skipping...");
    return;
  }

  await setDoc(doc(db, "automation_settings", "config"), {
    enabled: false, // Disabled by default
    check_interval_minutes: 5, // Check every 5 minutes
    welcome_message_enabled: true,
    event_notification_enabled: true,
    referral_notification_enabled: true,
    last_check: null,
    created_at: new Date().toISOString(),
  });

  console.log("✅ Automation settings initialized");
}

/**
 * Check if Firebase needs initialization
 */
export async function checkFirebaseInitialization(): Promise<{
  needsInit: boolean;
  missingCollections: string[];
}> {
  const requiredCollections = [
    "adminsetting",
    "message_templates",
    "dripsender_keys",
    "automation_settings",
  ];

  const missingCollections: string[] = [];

  for (const collectionName of requiredCollections) {
    const hasData = await collectionHasData(collectionName);
    if (!hasData) {
      missingCollections.push(collectionName);
    }
  }

  return {
    needsInit: missingCollections.length > 0,
    missingCollections,
  };
}
