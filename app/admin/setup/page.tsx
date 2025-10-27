"use client";

import { useState, useEffect } from "react";
import {
  Database,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Play,
} from "lucide-react";
import {
  initializeFirebaseData,
  checkFirebaseInitialization,
} from "@/lib/firebaseInit";

export default function SetupPage() {
  const [checking, setChecking] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [status, setStatus] = useState<{
    needsInit: boolean;
    missingCollections: string[];
  } | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const initStatus = await checkFirebaseInitialization();
      setStatus(initStatus);
    } catch (error) {
      console.error("Error checking status:", error);
    }
    setChecking(false);
  };

  const handleInitialize = async () => {
    if (!confirm("Initialize Firebase with default data?")) {
      return;
    }

    setInitializing(true);
    setResult(null);

    try {
      const initResult = await initializeFirebaseData();
      setResult(initResult);
      if (initResult.success) {
        // Recheck status
        await checkStatus();
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setInitializing(false);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          Firebase Setup
        </h1>
        <p className="text-gray-600 mt-2">
          Initialize Firebase with default data for the admin panel
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Initialization Status
        </h2>

        {status?.needsInit ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-yellow-900">
                  Firebase needs initialization
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  The following collections are missing or empty:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                  {status.missingCollections.map((collection) => (
                    <li key={collection}>{collection}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={handleInitialize}
              disabled={initializing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {initializing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Initializing...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Initialize Firebase</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-green-900">
                Firebase is ready!
              </p>
              <p className="text-sm text-green-700 mt-1">
                All required collections are initialized and ready to use.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Result Message */}
      {result && (
        <div
          className={`p-4 rounded-lg border-2 ${
            result.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p
                className={`font-semibold ${
                  result.success ? "text-green-900" : "text-red-900"
                }`}
              >
                {result.success ? "Success!" : "Error"}
              </p>
              <p
                className={`text-sm mt-1 ${
                  result.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {result.message || result.error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h3 className="font-bold text-blue-900 mb-3">
          What will be initialized?
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>Admin Settings:</strong> Default admin credentials
              (username: admin, password: admin123)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>Message Templates:</strong> Welcome, Event, Referral, and
              Broadcast templates
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>DripSender Keys:</strong> Placeholder API key (needs to
              be updated with real keys)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>Automation Settings:</strong> Default automation
              configuration
            </span>
          </li>
        </ul>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>Important:</strong> After initialization, please update
            the admin password and add your real DripSender API keys in the
            Settings page!
          </p>
        </div>
      </div>
    </div>
  );
}
