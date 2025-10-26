"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface AutomationRunnerProps {
  autoStart?: boolean;
}

export default function AutomationRunner({
  autoStart = true,
}: AutomationRunnerProps) {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [nextRun, setNextRun] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(60);
  const [lastResult, setLastResult] = useState<{
    welcome: number;
    referrer: number;
    events: number;
    errors: string[];
  } | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
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
      } else {
        setLastResult({
          welcome: 0,
          referrer: 0,
          events: 0,
          errors: [data.message || "Automation failed"],
        });
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

  useEffect(() => {
    if (isRunning) {
      // Run immediately when started
      runAutomation();

      // Set initial countdown based on interval setting
      setCountdown(intervalSeconds);

      // Set up interval to run automation
      intervalRef.current = setInterval(() => {
        runAutomation();
        setCountdown(intervalSeconds);
      }, intervalSeconds * 1000); // Convert seconds to milliseconds

      // Set up countdown interval (updates every second)
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000); // 1 second

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
    } else {
      // Clear intervals when stopped
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setNextRun(null);
      setCountdown(0);
    }
  }, [isRunning, intervalSeconds]); // Re-run when interval changes

  const toggleAutomation = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg shadow-sm">
      {/* Header with Control Button */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity
            className={`w-6 h-6 ${
              isRunning ? "text-green-600 animate-pulse" : "text-gray-400"
            }`}
          />
          <div>
            <h3 className="font-semibold text-gray-900">Automation Engine</h3>
            <p className="text-sm text-gray-600">
              {isRunning ? (
                <span className="text-green-600 font-medium">
                  ● Running - Checks every {intervalSeconds}s
                </span>
              ) : (
                <span className="text-gray-500">
                  ● Stopped - Click Start to begin
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={toggleAutomation}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isRunning
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Start</span>
            </>
          )}
        </button>
      </div>

      {/* Status Content */}
      <div className="p-4 space-y-4">
        {/* Processing Indicator */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-800 font-medium">
              Processing automation tasks...
            </span>
          </div>
        )}

        {/* Next Run Timer */}
        {isRunning && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-800">Next check in:</span>
              <span className="text-lg font-bold text-green-600">
                {countdown}s
              </span>
            </div>
          </div>
        )}

        {/* Last Run Info */}
        {lastRun && (
          <div className="text-sm text-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span>Last run:</span>
              <span className="font-medium">
                {lastRun.toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {/* Last Result */}
        {lastResult && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">
              Last Automation Result:
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                <div className="text-xs text-blue-700 mb-1">Welcome</div>
                <div className="text-lg font-bold text-blue-600">
                  {lastResult.welcome}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                <div className="text-xs text-green-700 mb-1">Referrer</div>
                <div className="text-lg font-bold text-green-600">
                  {lastResult.referrer}
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded p-2 text-center">
                <div className="text-xs text-purple-700 mb-1">Events</div>
                <div className="text-lg font-bold text-purple-600">
                  {lastResult.events}
                </div>
              </div>
            </div>

            {lastResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-800">
                    Errors:
                  </span>
                </div>
                <ul className="space-y-1">
                  {lastResult.errors.map((error, idx) => (
                    <li key={idx} className="text-xs text-red-700">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lastResult.errors.length === 0 &&
              (lastResult.welcome > 0 ||
                lastResult.referrer > 0 ||
                lastResult.events > 0) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Successfully sent{" "}
                    {lastResult.welcome +
                      lastResult.referrer +
                      lastResult.events}{" "}
                    message(s)
                  </span>
                </div>
              )}
          </div>
        )}

        {/* Warning Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <p className="font-semibold mb-1">⚠️ Important:</p>
              <p>
                This admin panel must stay open in your browser for automation
                to work. When you close this page, message sending will pause
                and resume when you return.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
