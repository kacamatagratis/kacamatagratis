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
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
  const fetchLatestParticipants = async () => {
    try {
      const participantsRef = collection(db, "participants");
      const q = query(
        participantsRef,
        orderBy("registered_at", "desc"),
        limit(10)
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
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  // Show notification from the pool
  const showNextNotification = () => {
    if (participantPool.length === 0) return;

    const participant = participantPool[currentIndex];

    // Add to notifications array
    setNotifications((prev) => [...prev, participant]);

    // Auto hide after 10 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== participant.id));
    }, 10000);

    // Move to next participant
    setCurrentIndex((prev) => (prev + 1) % participantPool.length);
  };

  // Check for manual triggers (new form submissions)
  const checkManualTrigger = () => {
    const manualTrigger = localStorage.getItem("trigger_new_joiner");
    if (manualTrigger) {
      try {
        const participant = JSON.parse(manualTrigger) as NotificationItem;
        participant.isNew = true;

        // Add to top of notifications
        setNotifications((prev) => [participant, ...prev]);
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
    // Fetch participants on mount
    fetchLatestParticipants();

    // Refresh participant pool every 30 minutes
    const refreshInterval = setInterval(
      fetchLatestParticipants,
      30 * 60 * 1000
    );

    // Listen for manual triggers every 500ms
    const triggerInterval = setInterval(checkManualTrigger, 500);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(triggerInterval);
    };
  }, []);

  useEffect(() => {
    if (participantPool.length === 0) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Show first notification after 30 seconds
    const initialTimeout = setTimeout(showNextNotification, 30000);

    // Show 10 notifications spread over 60 minutes (1 hour)
    // 60 minutes = 3600 seconds
    // 10 notifications = show every ~360 seconds (6 minutes)
    const interval = 6 * 60 * 1000; // 6 minutes in milliseconds

    intervalRef.current = setInterval(showNextNotification, interval);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [participantPool, currentIndex]);

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
