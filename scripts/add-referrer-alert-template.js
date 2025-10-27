// Add referrer_alert template to Firebase
// Run with: node scripts/add-referrer-alert-template.js

const admin = require('firebase-admin');

// Check if already initialized
if (!admin.apps.length) {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addReferrerAlertTemplate() {
  try {
    const templatesRef = db.collection('message_templates');
    
    // Check if referrer_alert template already exists
    const existingQuery = await templatesRef.where('type', '==', 'referrer_alert').get();
    
    if (!existingQuery.empty) {
      console.log('⏭️  Referrer alert template already exists!');
      console.log('Template ID:', existingQuery.docs[0].id);
      return;
    }

    // Create the template
    const template = {
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
    };

    const docRef = await templatesRef.add(template);
    
    console.log('✅ Referrer alert template created successfully!');
    console.log('Template ID:', docRef.id);
    console.log('\nTemplate content:');
    console.log(template.content);
    console.log('\nVariables:', template.variables.join(', '));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

addReferrerAlertTemplate();
