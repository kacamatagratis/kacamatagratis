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

const faqRef = () => collection(db, "landing_page_settings", "faq", "items");

export async function GET() {
  try {
    const snapshot = await getDocs(faqRef());
    const faq = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    return NextResponse.json({
      success: true,
      data: faq,
    });
  } catch (error) {
    console.error("[FAQ GET] Error:", error);
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
    const { question, answer, order } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: "Question and answer are required" },
        { status: 400 }
      );
    }

    const docRef = await addDoc(faqRef(), {
      question,
      answer,
      order: order || 0,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "FAQ added successfully",
      id: docRef.id,
    });
  } catch (error) {
    console.error("[FAQ POST] Error:", error);
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
    const { id, question, answer, order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const docRef = doc(db, "landing_page_settings", "faq", "items", id);
    await updateDoc(docRef, {
      question,
      answer,
      order,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "FAQ updated successfully",
    });
  } catch (error) {
    console.error("[FAQ PUT] Error:", error);
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

    const docRef = doc(db, "landing_page_settings", "faq", "items", id);
    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    console.error("[FAQ DELETE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
