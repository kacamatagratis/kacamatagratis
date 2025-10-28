import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";

const mediaCoverageRef = () =>
  collection(db, "landing_page_settings", "media_coverage", "items");

export async function GET() {
  try {
    const snapshot = await getDocs(mediaCoverageRef());
    const mediaCoverage = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    return NextResponse.json({
      success: true,
      data: mediaCoverage,
    });
  } catch (error) {
    console.error("[MEDIA COVERAGE GET] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, title, url, source, image_url, order } = body;

    if (!location || !title || !url || !source) {
      return NextResponse.json(
        {
          success: false,
          error: "Location, title, URL, and source are required",
        },
        { status: 400 }
      );
    }

    const docRef = await addDoc(mediaCoverageRef(), {
      location,
      title,
      url,
      source,
      image_url: image_url || "",
      order: order || 0,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Media coverage added successfully",
      id: docRef.id,
    });
  } catch (error) {
    console.error("[MEDIA COVERAGE POST] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, location, title, url, source, image_url, order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const docRef = doc(
      db,
      "landing_page_settings",
      "media_coverage",
      "items",
      id
    );
    await updateDoc(docRef, {
      location,
      title,
      url,
      source,
      image_url,
      order,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Media coverage updated successfully",
    });
  } catch (error) {
    console.error("[MEDIA COVERAGE PUT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const docRef = doc(
      db,
      "landing_page_settings",
      "media_coverage",
      "items",
      id
    );
    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: "Media coverage deleted successfully",
    });
  } catch (error) {
    console.error("[MEDIA COVERAGE DELETE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
