import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Get the notification log
    const notificationRef = doc(db, "notifications_log", notificationId);
    const notificationDoc = await getDoc(notificationRef);

    if (!notificationDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    const notification = notificationDoc.data();

    // Only retry failed notifications
    if (notification.status !== "failed") {
      return NextResponse.json(
        { success: false, error: "Only failed notifications can be retried" },
        { status: 400 }
      );
    }

    // Get participant data from metadata or fetch from participants collection
    const participantId = notification.participant_id;
    const phone = notification.target_phone;
    const type = notification.type;

    // Extract variables from the original metadata if available
    const metadata = notification.metadata || {};
    const variables = {
      sapaan: metadata.sapaan || "Bapak/Ibu",
      name: metadata.name || "",
      city: metadata.city || "",
      referral_code: metadata.referral_code
        ? `${
            process.env.NEXT_PUBLIC_APP_URL || "https://kacamatagratis.com"
          }?ref=${metadata.referral_code}`
        : "",
      event_title: metadata.event_title || "",
      zoom_link: metadata.zoom_link || "",
      referral_count: metadata.referral_count || "0",
    };

    // Attempt to resend the message WITHOUT creating a new log entry
    // We'll update the existing notification log instead
    const result = await sendWhatsAppMessage(
      phone,
      type,
      variables,
      undefined, // Don't pass participantId to prevent new log creation
      notification.event_id
    );

    // Update the existing notification log
    if (result.success) {
      await updateDoc(notificationRef, {
        status: "success",
        api_key_used: result.apiKeyUsed,
        error: null,
        retried_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Message resent successfully",
      });
    } else {
      // Update with new error
      await updateDoc(notificationRef, {
        error: result.error || "Failed to resend message",
        retried_at: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to resend message",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[RETRY] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
