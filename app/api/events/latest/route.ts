import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const eventsRef = collection(db, "events");
    const eventsQuery = query(eventsRef, orderBy("start_time", "desc"));
    const eventsSnap = await getDocs(eventsQuery);

    const now = new Date();
    let latestUpcomingEvent = null;

    // Find the latest upcoming event
    for (const eventDoc of eventsSnap.docs) {
      const event = eventDoc.data();
      if (event.start_time) {
        const eventTime = new Date(event.start_time);
        if (eventTime > now) {
          latestUpcomingEvent = {
            id: eventDoc.id,
            title: event.title,
            start_time: event.start_time,
            zoom_link: event.zoom_link,
            description: event.description || "",
            image_url: event.image_url || "",
          };
          break; // Get only the latest one
        }
      }
    }

    return NextResponse.json({
      success: true,
      event: latestUpcomingEvent,
    });
  } catch (error) {
    console.error("[LATEST EVENT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
