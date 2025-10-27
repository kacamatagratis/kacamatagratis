import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const settingsRef = doc(db, "general_settings", "config");
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      return NextResponse.json(settingsDoc.data());
    } else {
      // Return defaults if not found
      return NextResponse.json({
        whatsapp_redirect_number: "+62 815-1780-0900",
        referral_domain: "www.kacamatagratis.org",
      });
    }
  } catch (error) {
    console.error("Error fetching general settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
