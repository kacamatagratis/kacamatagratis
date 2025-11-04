"use client";

import { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";

export default function InactivityModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    // Track user activity
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // Listen to user interactions
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    // Check inactivity every 10 seconds
    const interval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      const threeMinutes = 3 * 60 * 1000; // 3 minutes in milliseconds

      // Check if user has been inactive for 3 minutes and hasn't dismissed the modal
      if (inactiveTime >= threeMinutes) {
        const dismissed = localStorage.getItem("inactivity_modal_dismissed");
        if (!dismissed) {
          setIsVisible(true);
        }
      }
    }, 10000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [lastActivity]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("inactivity_modal_dismissed", "true");
    setLastActivity(Date.now()); // Reset activity timer
  };

  const handleRegister = () => {
    const formElement = document.getElementById("zoom");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    handleClose();
  };

  if (!isVisible) return null;

  return (
    // render last and use z-50 so it overlays header (modal is rendered after header in DOM)
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative animate-scale-in">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Jadilah Bagian dari Gerakan Ini!
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Yuk terlibat dan mendukung Gerakan ini dengan menjadi relawan
            digital
          </p>
        </div>

        <button
          onClick={handleRegister}
          className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-2"
        >
          <span>Daftar Sekarang & Ikut Penjelasannya via Zoom</span>
        </button>
      </div>
    </div>
  );
}
