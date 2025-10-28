import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, items } = body;

    if (!title || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "Title and items array are required" },
        { status: 400 }
      );
    }

    const ref = doc(db, "landing_page_settings", "roles");
    await setDoc(ref, {
      title,
      items,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Roles section updated successfully",
    });
  } catch (error) {
    console.error("[LANDING PAGE ROLES] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
