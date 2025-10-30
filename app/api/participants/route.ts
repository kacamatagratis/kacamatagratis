import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const referralCode = searchParams.get("referral_code");

    if (!referralCode) {
      return NextResponse.json(
        { success: false, error: "Referral code is required" },
        { status: 400 }
      );
    }

    // Query participants collection for the referral code
    const participantsRef = collection(db, "participants");
    const q = query(
      participantsRef,
      where("referral_code", "==", referralCode),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Participant not found" },
        { status: 404 }
      );
    }

    const participantDoc = querySnapshot.docs[0];
    const participant = {
      id: participantDoc.id,
      ...participantDoc.data(),
    };

    return NextResponse.json({
      success: true,
      participant,
    });
  } catch (error) {
    console.error("[PARTICIPANTS GET] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch participant" },
      { status: 500 }
    );
  }
}
