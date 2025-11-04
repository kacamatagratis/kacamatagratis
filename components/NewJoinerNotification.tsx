"use client";

import { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

interface Participant {
  id: string;
  name: string;
  city: string;
  choices?: string[];
  registered_at: string;
}

export default function NewJoinerNotification() {
  const [notification, setNotification] = useState<Participant | null>(null);
  const [isVisible, setIsVisible] = useState(false);

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

  const checkNewJoiners = async () => {
    try {
      // Get participants from last 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const participantsRef = collection(db, "participants");
      const q = query(
        participantsRef,
        where("registered_at", ">=", oneHourAgo),
        orderBy("registered_at", "desc"),
        limit(5)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) return;

      // Get already shown notifications from localStorage
      const shownNotifications = JSON.parse(
        localStorage.getItem("shown_notifications") || "[]"
      ) as string[];

      // Find first participant that hasn't been shown
      const participants = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Participant[];

      const newParticipant = participants.find(
        (p) => !shownNotifications.includes(p.id)
      );

      if (newParticipant) {
        setNotification(newParticipant);
        setIsVisible(true);

        // Add to shown notifications
        const updated = [...shownNotifications, newParticipant.id];
        localStorage.setItem("shown_notifications", JSON.stringify(updated));

        // Auto hide after 10 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 10000);
      }
    } catch (error) {
      console.error("Error checking new joiners:", error);
    }
  };

  useEffect(() => {
    // Check immediately
    checkNewJoiners();

    // Check every 30 seconds
    const interval = setInterval(checkNewJoiners, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || !notification) return null;

  return (
    <div
      className={`fixed top-24 right-4 z-50 transform transition-all duration-500 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="bg-white rounded-lg shadow-2xl border-l-4 border-green-500 p-4 max-w-sm flex items-start gap-3 animate-slide-in">
        <div className="shrink-0">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-green-600" />
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
          onClick={handleDismiss}
          className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
