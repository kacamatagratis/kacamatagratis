import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { heading, description, youtube_url } = body;

    if (!heading || !description || !youtube_url) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const heroRef = doc(db, "landing_page_settings", "hero");
    await setDoc(heroRef, {
      heading,
      description,
      youtube_url,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Hero section updated successfully",
    });
  } catch (error) {
    console.error("[LANDING PAGE HERO] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
