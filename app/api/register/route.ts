import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { sapaan, name, city, profession, phone, referrerPhone } =
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

    // Check if phone already exists
    const existingQuery = query(
      collection(db, "participants"),
      where("phone", "==", phone)
    );
    const existingSnap = await getDocs(existingQuery);

    if (!existingSnap.empty) {
      return NextResponse.json(
        { error: "Phone number already registered" },
        { status: 409 }
      );
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

    // Normalize phone to E.164 format for referral code
    let normalizedPhone = phone;
    if (phone.startsWith("0")) {
      normalizedPhone = "+62" + phone.substring(1);
    } else if (!phone.startsWith("+")) {
      normalizedPhone = "+" + phone;
    }

    // Create participant document
    const participantData = {
      sapaan: sapaan || "Bapak/Ibu",
      name,
      city,
      profession,
      phone: normalizedPhone,
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

    // Generate referral URL
    const referralUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/ref=${participantData.referral_code}`;

    // TODO: Trigger WhatsApp notifications
    // - Send welcome message to participant
    // - Send alert to referrer if exists

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
