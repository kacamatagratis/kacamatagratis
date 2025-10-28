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

const testimonialsRef = () =>
  collection(db, "landing_page_settings", "testimonials", "items");

export async function GET() {
  try {
    const snapshot = await getDocs(testimonialsRef());
    const testimonials = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    return NextResponse.json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    console.error("[TESTIMONIALS GET] Error:", error);
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
    const { name, location, rating, text, order } = body;

    if (!name || !location || !rating || !text) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const docRef = await addDoc(testimonialsRef(), {
      name,
      location,
      rating,
      text,
      order: order || 0,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Testimonial added successfully",
      id: docRef.id,
    });
  } catch (error) {
    console.error("[TESTIMONIALS POST] Error:", error);
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
    const { id, name, location, rating, text, order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const docRef = doc(
      db,
      "landing_page_settings",
      "testimonials",
      "items",
      id
    );
    await updateDoc(docRef, {
      name,
      location,
      rating,
      text,
      order,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Testimonial updated successfully",
    });
  } catch (error) {
    console.error("[TESTIMONIALS PUT] Error:", error);
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
      "testimonials",
      "items",
      id
    );
    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    console.error("[TESTIMONIALS DELETE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
