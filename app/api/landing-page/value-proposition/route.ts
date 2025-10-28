import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { before_title, before_items, after_title, after_items } = body;

    if (!before_title || !before_items || !after_title || !after_items) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ref = doc(db, "landing_page_settings", "value_proposition");
    await setDoc(ref, {
      before_title,
      before_items,
      after_title,
      after_items,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Value proposition updated successfully",
    });
  } catch (error) {
    console.error("[LANDING PAGE VALUE PROPOSITION] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
