import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// This endpoint should be called by a cron job every minute
export async function GET(request: NextRequest) {
  try {
    console.log("[AUTOMATION] Starting automation check...");

    // Load automation settings
    const settingsRef = doc(db, "automation_settings", "config");
    const settingsDoc = await getDoc(settingsRef);

    if (!settingsDoc.exists()) {
      return NextResponse.json({
        success: false,
        message: "Automation settings not found",
      });
    }

    const settings = settingsDoc.data();

    if (!settings.automation_enabled) {
      return NextResponse.json({
        success: true,
        message: "Automation is disabled",
      });
    }

    const results = {
      welcome_messages_sent: 0,
      referrer_alerts_sent: 0,
      event_reminders_sent: 0,
      failed_retries: 0,
      errors: [] as string[],
    };

    // First, retry any failed notifications
    await retryFailedNotifications(results);

    // Check for pending welcome messages
    await processPendingWelcomeMessages(
      settings.welcome_delay_minutes,
      results
    );

    // Check for pending referrer alerts
    await processPendingReferrerAlerts(
      settings.referrer_alert_delay_minutes,
      results
    );

    // Check for upcoming event reminders
    await processEventReminders(settings.event_reminder_hours_before, results);

    console.log("[AUTOMATION] Completed:", results);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("[AUTOMATION] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function retryFailedNotifications(results: any) {
  try {
    const notificationsRef = collection(db, "notifications_log");
    
    // Get all failed notifications
    const failedQuery = query(
      notificationsRef,
      where("status", "==", "failed"),
      orderBy("created_at", "desc")
    );
    const failedSnap = await getDocs(failedQuery);

    console.log(`[AUTOMATION] Found ${failedSnap.size} failed notifications to retry`);

    for (const notificationDoc of failedSnap.docs) {
      const notification = notificationDoc.data();
      const notificationId = notificationDoc.id;
      const metadata = notification.metadata || {};

      // Build variables from metadata
      const variables = {
        sapaan: metadata.sapaan || "Bapak/Ibu",
        name: metadata.name || "",
        city: metadata.city || "",
        referral_code: metadata.referral_code || "",
        event_title: metadata.event_title || "",
        zoom_link: metadata.zoom_link || "",
        referral_count: metadata.referral_count || "0",
      };

      console.log(
        `[AUTOMATION] Retrying ${notification.type} for ${notification.target_phone}`
      );

      // Attempt to resend
      const result = await sendWhatsAppMessage(
        notification.target_phone,
        notification.type,
        variables,
        notification.participant_id,
        notification.event_id
      );

      if (result.success) {
        results.failed_retries++;
        console.log(`[AUTOMATION] Successfully retried notification ${notificationId}`);
      } else {
        results.errors.push(
          `Retry failed for ${notification.type} to ${notification.target_phone}: ${result.error}`
        );
      }
    }
  } catch (error) {
    console.error("[AUTOMATION] Error retrying failed notifications:", error);
    results.errors.push(
      `Failed retries error: ${
        error instanceof Error ? error.message : "Unknown"
      }`
    );
  }
}

async function processPendingWelcomeMessages(
  delayMinutes: number,
  results: any
) {
  try {
    const participantsRef = collection(db, "participants");
    const now = new Date();
    const delayMs = delayMinutes * 60 * 1000;
    const cutoffTime = new Date(now.getTime() - delayMs);

    // Get all participants
    const participantsSnap = await getDocs(participantsRef);

    for (const participantDoc of participantsSnap.docs) {
      const participant = participantDoc.data();
      const participantId = participantDoc.id;

      // Check if registered_at exists and is past the delay
      if (!participant.registered_at) continue;

      const registeredAt = new Date(participant.registered_at);
      if (registeredAt > cutoffTime) continue;

      // Check if welcome message already sent
      const notificationsRef = collection(db, "notifications_log");
      const notificationQuery = query(
        notificationsRef,
        where("participant_id", "==", participantId),
        where("type", "==", "welcome")
      );
      const existingNotifications = await getDocs(notificationQuery);

      if (!existingNotifications.empty) continue;

      // Send welcome message
      console.log(
        `[AUTOMATION] Sending welcome message to ${participant.name}`
      );
      const result = await sendWhatsAppMessage(
        participant.phone,
        "welcome",
        {
          sapaan: participant.sapaan,
          name: participant.name,
          city: participant.city,
          referral_code: participant.referral_code,
        },
        participantId
      );

      if (result.success) {
        results.welcome_messages_sent++;
      } else {
        results.errors.push(
          `Failed to send welcome message to ${participant.name}: ${result.error}`
        );
      }
    }
  } catch (error) {
    console.error("[AUTOMATION] Error processing welcome messages:", error);
    results.errors.push(
      `Welcome messages error: ${
        error instanceof Error ? error.message : "Unknown"
      }`
    );
  }
}

async function processPendingReferrerAlerts(
  delayMinutes: number,
  results: any
) {
  try {
    const participantsRef = collection(db, "participants");

    // Get all participants who were referred
    const referredQuery = query(
      participantsRef,
      where("referrer_phone", "!=", null)
    );
    const referredSnap = await getDocs(referredQuery);

    for (const referredDoc of referredSnap.docs) {
      const referred = referredDoc.data();
      const referredId = referredDoc.id;

      // Check if registered_at exists
      if (!referred.registered_at) continue;

      // Check if referrer alert already sent for this referral
      const notificationsRef = collection(db, "notifications_log");
      const notificationQuery = query(
        notificationsRef,
        where("participant_id", "==", referredId),
        where("type", "==", "referrer_alert")
      );
      const existingNotifications = await getDocs(notificationQuery);

      if (!existingNotifications.empty) continue;

      // Find the referrer
      const referrerQuery = query(
        participantsRef,
        where("phone", "==", referred.referrer_phone)
      );
      const referrerSnap = await getDocs(referrerQuery);

      if (referrerSnap.empty) continue;

      const referrerDoc = referrerSnap.docs[0];
      const referrer = referrerDoc.data();
      const referrerId = referrerDoc.id;

      // Count total referrals
      const referralsQuery = query(
        participantsRef,
        where("referrer_phone", "==", referrer.phone)
      );
      const referralsSnap = await getDocs(referralsQuery);
      const referralCount = referralsSnap.size;

      // Send referrer alert
      console.log(
        `[AUTOMATION] Sending referrer alert to ${referrer.name} (${referralCount} referrals)`
      );
      const result = await sendWhatsAppMessage(
        referrer.phone,
        "referrer_alert",
        {
          sapaan: referrer.sapaan,
          name: referrer.name,
          referral_count: referralCount.toString(),
        },
        referredId // Use referred ID to mark this specific referral as notified
      );

      if (result.success) {
        results.referrer_alerts_sent++;
      } else {
        results.errors.push(
          `Failed to send referrer alert to ${referrer.name}: ${result.error}`
        );
      }
    }
  } catch (error) {
    console.error("[AUTOMATION] Error processing referrer alerts:", error);
    results.errors.push(
      `Referrer alerts error: ${
        error instanceof Error ? error.message : "Unknown"
      }`
    );
  }
}

async function processEventReminders(hoursBefore: number, results: any) {
  try {
    const eventsRef = collection(db, "events");
    const now = new Date();
    const reminderWindow = hoursBefore * 60 * 60 * 1000;

    // Get all upcoming events
    const eventsSnap = await getDocs(eventsRef);

    for (const eventDoc of eventsSnap.docs) {
      const event = eventDoc.data();
      const eventId = eventDoc.id;

      if (!event.start_time) continue;

      const eventTime = new Date(event.start_time);
      const timeDiff = eventTime.getTime() - now.getTime();

      // Check if event is within the reminder window
      // (between hoursBefore and hoursBefore-1 hours from now)
      const upperBound = reminderWindow;
      const lowerBound = reminderWindow - 60 * 60 * 1000; // 1 hour window

      if (timeDiff < lowerBound || timeDiff > upperBound) continue;

      // Check if reminder already sent for this event
      const notificationsRef = collection(db, "notifications_log");
      const notificationQuery = query(
        notificationsRef,
        where("event_id", "==", eventId),
        where("type", "==", "event_reminder")
      );
      const existingNotifications = await getDocs(notificationQuery);

      if (!existingNotifications.empty) continue;

      // Get all participants
      const participantsRef = collection(db, "participants");
      const participantsSnap = await getDocs(participantsRef);

      console.log(
        `[AUTOMATION] Sending event reminders for "${event.title}" to ${participantsSnap.size} participants`
      );

      for (const participantDoc of participantsSnap.docs) {
        const participant = participantDoc.data();
        const participantId = participantDoc.id;

        const result = await sendWhatsAppMessage(
          participant.phone,
          "event_reminder",
          {
            event_title: event.title,
            sapaan: participant.sapaan,
            name: participant.name,
            zoom_link: event.zoom_link,
          },
          participantId,
          eventId // Pass event ID to track which event this reminder is for
        );

        if (result.success) {
          results.event_reminders_sent++;
        } else {
          results.errors.push(
            `Failed to send event reminder to ${participant.name}: ${result.error}`
          );
        }
      }
    }
  } catch (error) {
    console.error("[AUTOMATION] Error processing event reminders:", error);
    results.errors.push(
      `Event reminders error: ${
        error instanceof Error ? error.message : "Unknown"
      }`
    );
  }
}

// POST handler for client-side automation runner
export async function POST(request: NextRequest) {
  // Reuse the same logic as GET
  return GET(request);
}
