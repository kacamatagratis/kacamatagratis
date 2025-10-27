// Script to fix automation_settings in Firebase
// Run this with: node scripts/fix-automation-settings.js

const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixAutomationSettings() {
  try {
    const settingsRef = db.collection("automation_settings").doc("config");

    // Update the document with the missing fields
    await settingsRef.update({
      welcome_delay_minutes: 2,
      referrer_alert_delay_minutes: 0,
      event_reminder_hours_before: 1,
      automation_enabled: true,
      automation_engine_interval_seconds: 60,
    });

    console.log("✅ Successfully updated automation_settings/config");
    console.log("Added fields:");
    console.log("  - welcome_delay_minutes: 2");
    console.log("  - referrer_alert_delay_minutes: 0 (instant)");
    console.log("  - event_reminder_hours_before: 1");
    console.log("  - automation_enabled: true");
    console.log("  - automation_engine_interval_seconds: 60");

    // Verify the update
    const doc = await settingsRef.get();
    console.log("\n📄 Current document:");
    console.log(JSON.stringify(doc.data(), null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit();
  }
}

fixAutomationSettings();
