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
  deleteDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// Main automation logic
async function runAutomation() {
  console.log("[AUTOMATION] Starting automation check...");

  // Load automation settings
  const settingsRef = doc(db, "automation_settings", "config");
  const settingsDoc = await getDoc(settingsRef);

  if (!settingsDoc.exists()) {
    return {
      success: false,
      message: "Automation settings not found",
    };
  }

  const settings = settingsDoc.data();

  if (!settings.automation_enabled) {
    return {
      success: true,
      message: "Automation is disabled",
    };
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

  // Check for pending welcome messages (default: 2 minutes)
  await processPendingWelcomeMessages(
    settings.welcome_delay_minutes || 2,
    results
  );

  // Check for pending referrer alerts (default: 0 minutes = instant)
  await processPendingReferrerAlerts(
    settings.referrer_alert_delay_minutes || 0,
    results
  );

  // Check for upcoming event reminders (default: 1 hour)
  await processEventReminders(
    settings.event_reminder_hours_before || 1,
    results
  );

  console.log("[AUTOMATION] Completed:", results);

  return {
    success: true,
    results,
  };
}

// This endpoint should be called by a cron job every minute
export async function GET(request: NextRequest) {
  try {
    const result = await runAutomation();
    return NextResponse.json(result);
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

    console.log(
      `[AUTOMATION] Found ${failedSnap.size} failed notifications to retry`
    );

    for (const notificationDoc of failedSnap.docs) {
      const notification = notificationDoc.data();
      const notificationId = notificationDoc.id;
      const metadata = notification.metadata || {};

      // Build variables from metadata
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
        new_participant_name: metadata.new_participant_name || "",
        referrer_sequence: metadata.referrer_sequence || "0",
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
        console.log(
          `[AUTOMATION] Successfully retried notification ${notificationId}`
        );
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
    const notificationsRef = collection(db, "notifications_log");
    const now = new Date();

    console.log(
      `[AUTOMATION] Checking welcome messages with delay: ${delayMinutes} minutes`
    );

    // Query for pending welcome messages
    const pendingQuery = query(
      notificationsRef,
      where("type", "==", "welcome"),
      where("status", "==", "pending")
    );
    const pendingSnap = await getDocs(pendingQuery);

    console.log(
      `[AUTOMATION] Found ${pendingSnap.size} pending welcome messages`
    );

    if (pendingSnap.size === 0) {
      results.errors.push(
        "No pending welcome messages found in notifications_log"
      );
    }

    for (const pendingDoc of pendingSnap.docs) {
      const notification = pendingDoc.data();
      const createdAt = new Date(notification.created_at);
      const minutesSinceCreated =
        (now.getTime() - createdAt.getTime()) / 1000 / 60;

      const participantId = notification.participant_id;
      const targetPhone = notification.target_phone;
      const metadata = notification.metadata || {};

      // Get participant data
      const participantName = metadata.name || "Unknown";

      // Check if enough time has passed
      if (minutesSinceCreated < delayMinutes) {
        console.log(
          `[AUTOMATION] Skipping welcome message - only ${Math.floor(
            minutesSinceCreated
          )} minutes passed (need ${delayMinutes})`
        );
        results.errors.push(
          `Skipped welcome for ${participantName}: ${Math.floor(
            minutesSinceCreated
          )}min < ${delayMinutes}min`
        );
        continue;
      }

      const participantCity = metadata.city || "";
      const participantSapaan = metadata.sapaan || "Bapak/Ibu";
      const referralCode = metadata.referral_code || "";

      // Send welcome message
      console.log(
        `[AUTOMATION] ATTEMPTING to send welcome message to ${participantName} (${targetPhone})`
      );

      const result = await sendWhatsAppMessage(
        targetPhone,
        "welcome",
        {
          sapaan: participantSapaan,
          name: participantName,
          city: participantCity,
          referral_code: referralCode
            ? `${
                process.env.NEXT_PUBLIC_APP_URL || "https://kacamatagratis.com"
              }?ref=${referralCode}`
            : "",
        },
        participantId
      );

      console.log(
        `[AUTOMATION] Send result for ${participantName}: ${
          result ? "SUCCESS" : "FAILED"
        }`
      );

      // Delete the pending notification (sendWhatsAppMessage creates a new one)
      await deleteDoc(doc(db, "notifications_log", pendingDoc.id));
      console.log(
        `[AUTOMATION] Deleted pending notification for ${participantName}`
      );

      if (result.success) {
        results.welcome_messages_sent++;
      } else {
        results.errors.push(
          `Failed to send welcome message to ${participantName}: ${result.error}`
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
    const notificationsRef = collection(db, "notifications_log");

    console.log(
      `[AUTOMATION] Checking referrer alerts (instant send, no delay)`
    );

    // Query for pending referrer alerts
    const pendingQuery = query(
      notificationsRef,
      where("type", "==", "referrer_alert"),
      where("status", "==", "pending")
    );
    const pendingSnap = await getDocs(pendingQuery);

    console.log(
      `[AUTOMATION] Found ${pendingSnap.size} pending referrer alerts (instant send, no delay)`
    );

    if (pendingSnap.size === 0) {
      results.errors.push(
        "No pending referrer alerts found in notifications_log"
      );
    }

    for (const pendingDoc of pendingSnap.docs) {
      const notification = pendingDoc.data();

      const targetPhone = notification.target_phone;
      const metadata = notification.metadata || {};
      const newParticipantName = metadata.new_participant_name || "Unknown";
      const referrerSequence = metadata.referrer_sequence || 1;

      console.log(`[AUTOMATION] Processing referrer alert for phone: ${targetPhone}`);

      // Get referrer information - try different phone formats
      const participantsRef = collection(db, "participants");
      
      // Normalize phone formats to try
      const phoneWithoutPlus = targetPhone.replace(/\+/g, "");
      const phoneWithPlus = targetPhone.startsWith("+") ? targetPhone : `+${phoneWithoutPlus}`;
      
      const referrerQuery = query(
        participantsRef,
        where("phone", "in", [targetPhone, phoneWithoutPlus, phoneWithPlus])
      );
      const referrerSnap = await getDocs(referrerQuery);

      if (referrerSnap.empty) {
        console.log(`[AUTOMATION] Referrer not found for phone ${targetPhone} (tried: ${targetPhone}, ${phoneWithoutPlus}, ${phoneWithPlus})`);
        // Delete invalid pending notification
        await deleteDoc(doc(db, "notifications_log", pendingDoc.id));
        results.errors.push(`Referrer not found for phone ${targetPhone}`);
        continue;
      }

      const referrer = referrerSnap.docs[0].data();
      const referrerId = referrerSnap.docs[0].id;
      
      console.log(`[AUTOMATION] Found referrer: ${referrer.name} (${referrer.phone})`);

      // Count total successful referrals
      const referralsQuery = query(
        participantsRef,
        where("referrer_phone", "==", targetPhone)
      );
      const referralsSnap = await getDocs(referralsQuery);
      const referralCount = referralsSnap.size;

      // Send referrer alert
      console.log(
        `[AUTOMATION] ATTEMPTING to send referrer alert to ${referrer.name} (${referralCount} total referrals, new: ${newParticipantName})`
      );

      const result = await sendWhatsAppMessage(
        targetPhone,
        "referral",  // Changed from "referrer_alert" to match Firebase template
        {
          sapaan: referrer.sapaan,
          name: referrer.name,
          referral_count: referralCount.toString(),
          new_participant_name: newParticipantName,
          referrer_sequence: referrerSequence.toString(),
        },
        notification.participant_id
      );

      console.log(
        `[AUTOMATION] Send result for ${referrer.name}: ${
          result.success ? "SUCCESS" : "FAILED"
        }`
      );

      // Delete the pending notification (sendWhatsAppMessage creates a new one)
      await deleteDoc(doc(db, "notifications_log", pendingDoc.id));
      console.log(
        `[AUTOMATION] Deleted pending referrer alert for ${referrer.name}`
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

      // Check if reminder already sent for this event (ignore pending)
      const notificationsRef = collection(db, "notifications_log");
      const notificationQuery = query(
        notificationsRef,
        where("event_id", "==", eventId),
        where("type", "==", "event_reminder")
      );
      const existingNotifications = await getDocs(notificationQuery);

      // Check if there's a non-pending notification
      const hasSentNotification = existingNotifications.docs.some(
        (doc) => doc.data().status !== "pending"
      );

      if (hasSentNotification) continue;

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
  try {
    const result = await runAutomation();
    return NextResponse.json(result);
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
