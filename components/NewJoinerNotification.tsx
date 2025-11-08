"use client";

import { useState, useEffect, useRef } from "react";
import { X, UserPlus } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";

interface Participant {
  id: string;
  name: string;
  city: string;
  choices?: string[];
  registered_at: string;
}

interface NotificationItem extends Participant {
  isNew?: boolean;
}

export default function NewJoinerNotification() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [participantPool, setParticipantPool] = useState<Participant[]>([]);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(10);
  const [maxParticipants, setMaxParticipants] = useState<number>(10);
  // use a ref for the current index so the interval callback doesn't capture a stale value
  const currentIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shownCountRef = useRef(0);
  const initialTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getChoiceLabel = (choices?: string[]) => {
    if (!choices || choices.length === 0) return "Peserta";

    const labels = choices.map((choice) => {
      if (choice === "penerima_bantuan") return "Penerima Bantuan";
      if (choice === "relawan") return "Relawan";
      if (choice === "social_entrepreneur") return "Social Entrepreneur";
      return "";
    });

    return labels.filter(Boolean).join(", ");
  };

  // Fetch 10 latest participants
  const fetchLatestParticipants = async (count?: number) => {
    try {
      const participantsRef = collection(db, "participants");
      const limitCount = count ?? maxParticipants ?? 10;
      const q = query(
        participantsRef,
        orderBy("registered_at", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const participants = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Participant[];

        // Shuffle the participants randomly
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        setParticipantPool(shuffled);
        currentIndexRef.current = 0;
        // reset shown count when we refresh the pool
        shownCountRef.current = 0;
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  // Helper to add a notification while ensuring no duplicate IDs
  const addNotification = (
    participant: Participant | NotificationItem,
    toTop = false
  ) => {
    const item: NotificationItem = {
      ...participant,
      isNew: (participant as NotificationItem).isNew || false,
    };

    setNotifications((prev) => {
      // remove any existing with same id
      const filtered = prev.filter((n) => n.id !== item.id);
      if (toTop) {
        return [item, ...filtered];
      }
      return [...filtered, item];
    });
  };

  // Show notification from the pool
  const showNextNotification = () => {
    if (participantPool.length === 0) return;

    const idx = currentIndexRef.current % participantPool.length;
    const participant = participantPool[idx];

    // Add to notifications array (dedupe by id)
    addNotification(participant, false);

    // Auto hide after a duration so notifications accumulate while the pool is being shown
    const hideAfter = 10000 * Math.min(10, participantPool.length); // keep each notification visible long enough to accumulate up to max
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== participant.id));
    }, hideAfter);

    // Move to next participant (use ref so interval callback sees the updated value)
    currentIndexRef.current =
      (currentIndexRef.current + 1) % participantPool.length;

    // Track how many we've shown from the current pool and stop after 10
    shownCountRef.current += 1;
    const maxToShow = Math.min(10, participantPool.length);
    if (shownCountRef.current >= maxToShow) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as any);
        intervalRef.current = null;
      }
    }
  };

  // Check for manual triggers (new form submissions)
  const checkManualTrigger = () => {
    const manualTrigger = localStorage.getItem("trigger_new_joiner");
    if (manualTrigger) {
      try {
        const participant = JSON.parse(manualTrigger) as NotificationItem;
        participant.isNew = true;
        // Add to top of notifications (dedupe/move to top)
        addNotification(participant, true);
        localStorage.removeItem("trigger_new_joiner");

        // Auto hide after 10 seconds
        setTimeout(() => {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== participant.id)
          );
        }, 10000);
      } catch (e) {
        console.error("Error parsing manual trigger:", e);
        localStorage.removeItem("trigger_new_joiner");
      }
    }
  };

  useEffect(() => {
    // Load general settings from API then fetch participants
    let isMounted = true;

    const loadSettingsAndParticipants = async () => {
      try {
        const res = await fetch("/api/general-settings");
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();
        if (!isMounted) return;

        const sInterval = parseInt(data.notification_interval_seconds) || 10;
        const sCount = parseInt(data.notification_participant_count) || 10;
        setIntervalSeconds(sInterval);
        setMaxParticipants(sCount);

        // Fetch participants using the configured count
        await fetchLatestParticipants(sCount);
      } catch (err) {
        console.error(
          "Failed to load settings for NewJoinerNotification:",
          err
        );
        // Fallback to defaults
        await fetchLatestParticipants();
      }
    };

    loadSettingsAndParticipants();

    // Refresh participant pool every 30 minutes
    const refreshInterval = setInterval(
      () => fetchLatestParticipants(maxParticipants),
      30 * 60 * 1000
    );

    // Listen for manual triggers every 500ms
    const triggerInterval = setInterval(checkManualTrigger, 500);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
      clearInterval(triggerInterval);
    };
  }, []);

  useEffect(() => {
    if (participantPool.length === 0) return;

    // ensure any previous interval/timeouts are cleared
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (initialTimeoutRef.current) {
      clearTimeout(initialTimeoutRef.current);
      initialTimeoutRef.current = null;
    }

    // Show first notification after 2 seconds
    initialTimeoutRef.current = setTimeout(showNextNotification, 2000);

    // Show notifications every configured interval until up to maxParticipants have been shown
    const interval = (intervalSeconds || 10) * 1000;
    intervalRef.current = setInterval(() => {
      // if we've already shown enough, stop the interval
      const maxToShow = Math.min(maxParticipants || 10, participantPool.length);
      if (shownCountRef.current >= maxToShow) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }
      showNextNotification();
    }, interval);

    return () => {
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
        initialTimeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [participantPool, intervalSeconds, maxParticipants]);

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`transform transition-all duration-500 ${
            index === 0
              ? "translate-x-0 opacity-100"
              : "translate-x-0 opacity-100"
          }`}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <div
            className={`bg-white rounded-lg shadow-2xl border-l-4 ${
              notification.isNew ? "border-blue-500" : "border-green-500"
            } p-4 max-w-sm flex items-start gap-3 animate-slide-in`}
          >
            <div className="shrink-0">
              <div
                className={`w-10 h-10 ${
                  notification.isNew ? "bg-blue-100" : "bg-green-100"
                } rounded-full flex items-center justify-center`}
              >
                <UserPlus
                  className={`w-5 h-5 ${
                    notification.isNew ? "text-blue-600" : "text-green-600"
                  }`}
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                Rekan {notification.name} dari {notification.city}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Ikut Bergabung sebagai {getChoiceLabel(notification.choices)}
              </p>
            </div>

            <button
              onClick={() => handleDismiss(notification.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
