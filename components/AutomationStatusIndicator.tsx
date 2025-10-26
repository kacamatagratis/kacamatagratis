"use client";

import { useState, useEffect, useRef } from "react";
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MessageSquare,
  Calendar,
  Key,
  AlertCircle,
  Loader2,
  X,
  Play,
  Pause,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface AutomationStatus {
  timestamp: string;
  automation_enabled: boolean;
  pending_welcome_messages: number;
  pending_referrer_alerts: number;
  upcoming_events: number;
  total_participants: number;
  active_api_keys: number;
  last_notification: {
    type: string;
    status: string;
    created_at: string;
  } | null;
  errors: string[];
}

export default function AutomationStatusIndicator() {
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Automation Runner states
  const [isRunning, setIsRunning] = useState(true); // Auto-start
  const [intervalSeconds, setIntervalSeconds] = useState<number>(60);
  const [countdown, setCountdown] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [lastResult, setLastResult] = useState<{
    welcome: number;
    referrer: number;
    events: number;
    errors: string[];
  } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load interval settings from Firebase
  const loadIntervalSettings = async () => {
    try {
      const settingsRef = doc(db, "automation_settings", "config");
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        const interval = data.automation_engine_interval_seconds || 60;
        setIntervalSeconds(interval);
      }
    } catch (error) {
      console.error("Failed to load interval settings:", error);
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadIntervalSettings();
  }, []);

  const runAutomation = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/cron/automation", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        setLastResult({
          welcome: data.results?.welcome_messages_sent || 0,
          referrer: data.results?.referrer_alerts_sent || 0,
          events: data.results?.event_reminders_sent || 0,
          errors: data.results?.errors || [],
        });
        setLastRun(new Date());
        
        // Refresh status to update last activity and pending counts
        await fetchStatus();
      } else {
        setLastResult({
          welcome: 0,
          referrer: 0,
          events: 0,
          errors: [data.message || "Automation failed"],
        });
        
        // Still refresh status even on failure
        await fetchStatus();
      }
    } catch (error) {
      console.error("Failed to run automation:", error);
      setLastResult({
        welcome: 0,
        referrer: 0,
        events: 0,
        errors: ["Failed to connect to automation service"],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/automation/status");
      const data = await response.json();
      if (data.success) {
        setStatus(data.checks);
        setLastChecked(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch automation status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch status immediately on mount
    fetchStatus();
  }, []);

  // Separate effect for automation intervals
  useEffect(() => {
    // Clear any existing intervals first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Start automation if enabled
    if (isRunning && intervalSeconds > 0) {
      console.log(`[Automation] Starting with interval: ${intervalSeconds}s`);

      // Run automation immediately
      runAutomation();

      // Set initial countdown
      setCountdown(intervalSeconds);

      // Set up interval to run automation
      intervalRef.current = setInterval(() => {
        console.log(`[Automation] Running automation cycle...`);
        runAutomation();
        setCountdown(intervalSeconds);
      }, intervalSeconds * 1000);

      // Set up countdown interval (updates every second)
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          const newValue = Math.max(0, prev - 1);
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isRunning, intervalSeconds]); // Only re-run when these change

  const toggleAutomation = () => {
    setIsRunning(!isRunning);
  };

  const handleClick = () => {
    setShowPopup(!showPopup);
    if (!showPopup) {
      fetchStatus();
    }
  };

  const isHealthy =
    status &&
    status.automation_enabled &&
    status.active_api_keys > 0 &&
    status.errors.length === 0;

  return (
    <div className="relative">
      {/* Status Indicator Button */}
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          isHealthy
            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            : "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
        }`}
        title="View automation engine"
      >
        <Activity className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
        <span className="text-sm font-medium hidden sm:inline">
          Automation Engine
        </span>
        {status && status.pending_welcome_messages > 0 && (
          <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {status.pending_welcome_messages}
          </span>
        )}
      </button>

      {/* Popup Dropdown */}
      {showPopup && (
        <>
          {/* Backdrop to close popup */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPopup(false)}
          />

          {/* Popup Content */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border-2 border-blue-200 z-50 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-200 flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">Automation Engine</h3>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {loading && !status ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : status ? (
                <>
                  {/* System Status */}
                  <div
                    className={`p-3 rounded-lg border ${
                      isHealthy
                        ? "bg-green-50 border-green-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isHealthy ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      )}
                      <span
                        className={`font-semibold text-sm ${
                          isHealthy ? "text-green-900" : "text-yellow-900"
                        }`}
                      >
                        {isHealthy ? "Running Normally" : "Attention Required"}
                      </span>
                    </div>
                    <p
                      className={`text-xs ${
                        isHealthy ? "text-green-700" : "text-yellow-700"
                      }`}
                    >
                      {status.automation_enabled ? "Enabled" : "Disabled"} •{" "}
                      {status.active_api_keys} API key(s)
                    </p>
                  </div>

                  {/* Automation Control */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isRunning ? (
                          <Activity className="w-4 h-4 text-green-600 animate-pulse" />
                        ) : (
                          <Activity className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm font-semibold text-gray-900">
                          {isRunning ? "● Running" : "● Stopped"}
                        </span>
                      </div>
                      <button
                        onClick={toggleAutomation}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium text-xs transition-all ${
                          isRunning
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        {isRunning ? (
                          <>
                            <Pause className="w-3 h-3" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>Start</span>
                          </>
                        )}
                      </button>
                    </div>
                    {isRunning && (
                      <div className="text-xs text-indigo-700">
                        Checks every {intervalSeconds}s • Next in: {countdown}s
                      </div>
                    )}
                    {isProcessing && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Processing...
                      </div>
                    )}
                  </div>

                  {/* Last Run Result */}
                  {lastResult && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="text-xs font-semibold text-gray-700 mb-2">
                        Last Run: {lastRun?.toLocaleTimeString()}
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {lastResult.welcome}
                          </div>
                          <div className="text-xs text-gray-600">Welcome</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {lastResult.referrer}
                          </div>
                          <div className="text-xs text-gray-600">Referrer</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {lastResult.events}
                          </div>
                          <div className="text-xs text-gray-600">Events</div>
                        </div>
                      </div>
                      {lastResult.errors.length > 0 && (
                        <div className="mt-2 text-xs text-red-600">
                          {lastResult.errors.map((error, idx) => (
                            <div key={idx}>• {error}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Errors */}
                  {status.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-xs font-semibold text-red-900">
                          Errors
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {status.errors.map((error, idx) => (
                          <li key={idx} className="text-xs text-red-700">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-900">
                          Welcome
                        </span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {status.pending_welcome_messages}
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-900">
                          Referrer
                        </span>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        {status.pending_referrer_alerts}
                      </p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-900">
                          Events
                        </span>
                      </div>
                      <p className="text-lg font-bold text-purple-600">
                        {status.upcoming_events}
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-medium text-gray-900">
                          Total
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-600">
                        {status.total_participants}
                      </p>
                    </div>
                  </div>

                  {/* Last Activity */}
                  {status.last_notification && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-900">
                          Last Activity
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-indigo-600">
                        {status.last_notification.type}
                      </p>
                      <p className="text-xs text-indigo-700">
                        {status.last_notification.status} •{" "}
                        {new Date(
                          status.last_notification.created_at
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                  )}

                  {/* Last Checked */}
                  {lastChecked && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        Updated: {lastChecked.toLocaleTimeString()}
                      </p>
                    </div>
                  )}

                  {/* Refresh Button */}
                  <button
                    onClick={fetchStatus}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                    <span>Refresh</span>
                  </button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Failed to load status
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
