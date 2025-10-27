import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      automation_enabled: false,
      pending_welcome_messages: 0,
      pending_referrer_alerts: 0,
      upcoming_events: 0,
      total_participants: 0,
      active_api_keys: 0,
      last_notification: null as any,
      errors: [] as string[],
    };

    // Check automation settings
    try {
      const settingsRef = doc(db, "automation_settings", "config");
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists()) {
        checks.automation_enabled = settingsDoc.data().automation_enabled;
      }
    } catch (error) {
      checks.errors.push("Failed to load automation settings");
    }

    // Count active API keys
    try {
      const keysRef = collection(db, "dripsender_keys");
      const activeKeysQuery = query(keysRef, where("is_active", "==", true));
      const keysSnap = await getDocs(activeKeysQuery);
      checks.active_api_keys = keysSnap.size;
    } catch (error) {
      checks.errors.push("Failed to count API keys");
    }

    // Count total participants
    try {
      const participantsRef = collection(db, "participants");
      const participantsSnap = await getDocs(participantsRef);
      checks.total_participants = participantsSnap.size;
    } catch (error) {
      checks.errors.push("Failed to count participants");
    }

    // Count pending welcome messages from notifications_log
    try {
      const notificationsRef = collection(db, "notifications_log");
      const pendingWelcomeQuery = query(
        notificationsRef,
        where("type", "==", "welcome"),
        where("status", "==", "pending")
      );
      const pendingWelcomeSnap = await getDocs(pendingWelcomeQuery);
      checks.pending_welcome_messages = pendingWelcomeSnap.size;
    } catch (error) {
      checks.errors.push("Failed to count pending welcome messages");
    }

    // Count pending referrer alerts from notifications_log
    try {
      const notificationsRef = collection(db, "notifications_log");
      const pendingReferrerQuery = query(
        notificationsRef,
        where("type", "==", "referrer_alert"),
        where("status", "==", "pending")
      );
      const pendingReferrerSnap = await getDocs(pendingReferrerQuery);
      checks.pending_referrer_alerts = pendingReferrerSnap.size;
    } catch (error) {
      checks.errors.push("Failed to count pending referrer alerts");
    }

    // Count upcoming events
    try {
      const eventsRef = collection(db, "events");
      const now = new Date();
      const eventsSnap = await getDocs(eventsRef);

      let upcomingCount = 0;
      for (const eventDoc of eventsSnap.docs) {
        const event = eventDoc.data();
        if (event.start_time) {
          const eventTime = new Date(event.start_time);
          if (eventTime > now) {
            upcomingCount++;
          }
        }
      }
      checks.upcoming_events = upcomingCount;
    } catch (error) {
      checks.errors.push("Failed to check events");
    }

    // Get last notification
    try {
      const notificationsRef = collection(db, "notifications_log");
      const lastNotificationQuery = query(
        notificationsRef,
        orderBy("created_at", "desc"),
        limit(1)
      );
      const lastNotificationSnap = await getDocs(lastNotificationQuery);

      if (!lastNotificationSnap.empty) {
        const lastNotif = lastNotificationSnap.docs[0].data();
        checks.last_notification = {
          type: lastNotif.type,
          status: lastNotif.status,
          created_at: lastNotif.created_at,
        };
      }
    } catch (error) {
      checks.errors.push("Failed to get last notification");
    }

    return NextResponse.json({
      success: true,
      checks,
    });
  } catch (error) {
    console.error("[STATUS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
