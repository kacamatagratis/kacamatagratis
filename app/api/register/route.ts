import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { sapaan, name, city, profession, phone, referrerPhone, choices } =
      await request.json();

    // Validate required fields
    if (!name || !city || !profession || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^(\+?62|0)[0-9]{9,12}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Normalize phone to check format (remove +, convert 0 to 62)
    let normalizedPhone = phone;
    if (phone.startsWith("0")) {
      normalizedPhone = "+62" + phone.substring(1);
    } else if (!phone.startsWith("+")) {
      normalizedPhone = "+" + phone;
    }

    // Check if phone already exists (check both formats)
    const phoneWithoutPlus = normalizedPhone.replace(/\+/g, "");
    const existingQuery = query(
      collection(db, "participants"),
      where("phone", "in", [phone, normalizedPhone, phoneWithoutPlus])
    );
    const existingSnap = await getDocs(existingQuery);

    if (!existingSnap.empty) {
      return NextResponse.json(
        { error: "Nomor WhatsApp sudah terdaftar dalam sistem" },
        { status: 409 }
      );
    }

    // Validate WhatsApp number is active using DripSender
    const formattedPhone = normalizedPhone.replace(/\+/g, "");
    try {
      // Get an active API key for validation
      const keysRef = collection(db, "dripsender_keys");
      const keysQuery = query(keysRef, where("is_active", "==", true));
      const keysSnap = await getDocs(keysQuery);

      if (!keysSnap.empty) {
        const apiKey = keysSnap.docs[0].data().api_key;

        // Check if WhatsApp number exists using DripSender check API
        const checkResponse = await fetch("https://api.dripsender.id/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: apiKey,
            phone: formattedPhone,
          }),
        });

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();

          // If WhatsApp not registered or not active
          if (!checkData.registered || checkData.registered === false) {
            return NextResponse.json(
              {
                error:
                  "Nomor WhatsApp tidak aktif atau tidak terdaftar di WhatsApp",
              },
              { status: 400 }
            );
          }
        }
      }
    } catch (checkError) {
      console.error("WhatsApp validation error:", checkError);
      // Continue registration even if validation fails (to avoid blocking legitimate users)
    }

    // Calculate referrer sequence if referrer exists
    let referrerSequence = 0;
    if (referrerPhone) {
      const referrerQuery = query(
        collection(db, "participants"),
        where("referrer_phone", "==", referrerPhone)
      );
      const referrerSnap = await getDocs(referrerQuery);
      referrerSequence = referrerSnap.size + 1;
    }

    // normalizedPhone is already set above (no need to redeclare)
    // Phone is already in E.164 format from earlier normalization

    // Create participant document
    const participantData = {
      sapaan: sapaan || "Rekan",
      name,
      city,
      profession,
      phone: normalizedPhone,
      choices: choices || [],
      referral_code: normalizedPhone.replace(/\+/g, ""),
      referrer_phone: referrerPhone || null,
      referrer_sequence: referrerSequence,
      registered_at: new Date().toISOString(),
      status: "belum_join",
      unsubscribed: false,
    };

    const docRef = await addDoc(
      collection(db, "participants"),
      participantData
    );

    // Create pending welcome notification log so automation can pick it up
    try {
      await addDoc(collection(db, "notifications_log"), {
        participant_id: docRef.id,
        target_phone: participantData.phone,
        type: "welcome",
        api_key_used: null,
        status: "pending",
        message_content: null,
        error: null,
        event_id: null,
        created_at: new Date().toISOString(),
        metadata: participantData,
      });
    } catch (err) {
      console.error("Failed to create pending notification log:", err);
    }

    // Generate referral URL using general settings
    let referralDomain = "www.kacamatagratis.org"; // Default
    try {
      const settingsRef = doc(db, "general_settings", "config");
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists() && settingsDoc.data().referral_domain) {
        referralDomain = settingsDoc.data().referral_domain;
      }
    } catch (settingsError) {
      console.error(
        "Failed to fetch referral domain, using default:",
        settingsError
      );
    }

    const referralUrl = `https://${referralDomain}?ref=${participantData.referral_code}`;

    // Create pending referrer alert notification if there's a referrer
    if (referrerPhone) {
      try {
        console.log(
          `[REGISTER] Creating pending referrer alert for ${referrerPhone} (new participant: ${name})`
        );
        await addDoc(collection(db, "notifications_log"), {
          participant_id: docRef.id,
          target_phone: referrerPhone,
          type: "referrer_alert",
          api_key_used: null,
          status: "pending",
          message_content: null,
          error: null,
          event_id: null,
          created_at: new Date().toISOString(),
          metadata: {
            ...participantData,
            new_participant_name: name,
            new_participant_city: city,
            phone: normalizedPhone,
            referrer_sequence: referrerSequence,
          },
        });
        console.log(`[REGISTER] Pending referrer alert created successfully`);
      } catch (err) {
        console.error("Failed to create pending referrer alert:", err);
      }
    }

    return NextResponse.json({
      success: true,
      participant: {
        id: docRef.id,
        ...participantData,
      },
      referralUrl,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register participant" },
      { status: 500 }
    );
  }
}
