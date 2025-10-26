"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AutomationTestPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runAutomation = async () => {
    setRunning(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/cron/automation");
      const data = await response.json();

      if (data.success) {
        setResult(data.results);
      } else {
        setError(data.message || data.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run automation");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-600" />
          Test Automation
        </h1>
        <p className="text-gray-600 mt-2">
          Manually trigger the automation system to test message sending
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> In production, this automation should run
          automatically via a cron job every minute. This page is for testing
          purposes only.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <button
          onClick={runAutomation}
          disabled={running}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {running ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Running Automation...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Run Automation Now</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-green-900 text-lg">
                Automation Completed
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Welcome Messages</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.welcome_messages_sent}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Referrer Alerts</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.referrer_alerts_sent}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Event Reminders</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.event_reminders_sent}
                </p>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Errors:</h4>
                <ul className="space-y-1">
                  {result.errors.map((err: string, idx: number) => (
                    <li key={idx} className="text-sm text-red-800">
                      • {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-3">
              How the Automation Works:
            </h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p>
                1. <strong>Welcome Messages:</strong> Checks for participants
                who registered more than the configured delay ago and haven't
                received a welcome message yet.
              </p>
              <p>
                2. <strong>Referrer Alerts:</strong> Checks for new referrals
                that are past the delay period and notifies the referrer about
                their successful referral.
              </p>
              <p>
                3. <strong>Event Reminders:</strong> Checks for upcoming events
                within the reminder window (e.g., 1 hour before start) and sends
                reminders to all participants.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
