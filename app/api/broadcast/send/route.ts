import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

// Helper function to format phone for DripSender
function formatPhoneForDripSender(phone: string): string {
  let formatted = phone.replace(/[\s\-+]/g, "");
  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.substring(1);
  }
  if (!formatted.startsWith("62")) {
    formatted = "62" + formatted;
  }
  return formatted;
}

// Helper function to get random active API key
async function getRandomApiKey() {
  try {
    const { getDocs, query, where, collection } = await import(
      "firebase/firestore"
    );
    const keysRef = collection(db, "dripsender_keys");
    const q = query(keysRef, where("is_active", "==", true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const activeKeys = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const randomIndex = Math.floor(Math.random() * activeKeys.length);
    return activeKeys[randomIndex] as any;
  } catch (error) {
    console.error("Error getting API key:", error);
    return null;
  }
}

// Helper function to update API key usage
async function updateKeyUsage(keyId: string) {
  try {
    const { doc, updateDoc, increment } = await import("firebase/firestore");
    const keyRef = doc(db, "dripsender_keys", keyId);
    await updateDoc(keyRef, {
      usage_count: increment(1),
      last_used: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating key usage:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, message, participantId } = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Phone and message are required" },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = formatPhoneForDripSender(phone);
    console.log(`[Broadcast] Formatting phone: ${phone} -> ${formattedPhone}`);

    // Get random active API key
    const apiKey = await getRandomApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "No active API keys available" },
        { status: 500 }
      );
    }

    // Send message via DripSender
    const response = await fetch("https://api.dripsender.id/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey.api_key,
        phone: formattedPhone,
        text: message,
      }),
    });

    let errorDetail = "";
    const isSuccess = response.ok;

    if (!isSuccess) {
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorDetail = `HTTP ${response.status}: ${
            errorData.message || errorData.error || JSON.stringify(errorData)
          }`;
        } else {
          const textError = await response.text();
          errorDetail = `HTTP ${response.status}: ${
            textError || response.statusText
          }`;
        }
      } catch {
        errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      }
    }

    // Update API key usage
    if (isSuccess) {
      await updateKeyUsage(apiKey.id);
    }

    // Log notification
    if (participantId) {
      await addDoc(collection(db, "notifications_log"), {
        participant_id: participantId,
        target_phone: phone,
        type: "broadcast",
        api_key_used: apiKey.label,
        status: isSuccess ? "success" : "failed",
        message_content: message,
        error: isSuccess ? null : errorDetail,
        event_id: null,
        metadata: null,
        created_at: new Date().toISOString(),
      });
    }

    if (isSuccess) {
      return NextResponse.json({
        success: true,
        apiKeyUsed: apiKey.label,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: errorDetail,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Broadcast] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
