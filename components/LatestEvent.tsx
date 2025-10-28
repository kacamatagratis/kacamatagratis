"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Video, Info } from "lucide-react";

interface Event {
  id: string;
  title: string;
  start_time: string;
  zoom_link?: string;
  description?: string;
  image_url?: string;
}

export default function LatestEvent() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLatestEvent = async () => {
    try {
      const response = await fetch("/api/events/latest");
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
      }
    } catch (error) {
      console.error("Failed to fetch latest event:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch event on mount
    fetchLatestEvent();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchLatestEvent, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="bg-linear-to-r from-gray-50 to-gray-100 rounded-lg shadow-md p-8 text-center border-2 border-dashed border-gray-300">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Upcoming Events
          </h3>
          <p className="text-gray-500">
            Check back soon for our next exciting event!
          </p>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.start_time);
  const formattedDate = eventDate.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg border-2 border-blue-200 overflow-hidden hover:shadow-xl transition-shadow">
        {/* Event Image (if provided) */}
        {event.image_url && (
          <div className="w-full h-48 sm:h-64 relative">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white rounded-lg p-3 shrink-0">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Upcoming Event
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {event.title}
              </h2>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{formattedTime} WIB</span>
                </div>
              </div>

              {event.description && (
                <div className="bg-white/50 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                </div>
              )}

              {event.zoom_link && (
                <a
                  href={event.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Video className="w-5 h-5" />
                  <span>Join Event on Zoom</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
