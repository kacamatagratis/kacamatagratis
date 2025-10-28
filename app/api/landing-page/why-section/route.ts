import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, items } = body;

    if (!title || !items) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ref = doc(db, "landing_page_settings", "why_section");
    await setDoc(ref, {
      title,
      items,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Why section updated successfully",
    });
  } catch (error) {
    console.error("[LANDING PAGE WHY SECTION] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
