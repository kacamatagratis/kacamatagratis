import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { content_type, video_url, image_urls, title, items } = body;

    if (!content_type || !title || !items) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (content_type === "video" && !video_url) {
      return NextResponse.json(
        {
          success: false,
          error: "Video URL is required when content type is video",
        },
        { status: 400 }
      );
    }

    if (content_type === "images" && (!image_urls || image_urls.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one image is required when content type is images",
        },
        { status: 400 }
      );
    }

    const ref = doc(db, "landing_page_settings", "program");
    await setDoc(ref, {
      content_type,
      video_url: content_type === "video" ? video_url : null,
      image_urls: content_type === "images" ? image_urls : null,
      title,
      items,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Program section updated successfully",
    });
  } catch (error) {
    console.error("[LANDING PAGE PROGRAM] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
