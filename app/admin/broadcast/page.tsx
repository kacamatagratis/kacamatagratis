"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Filter,
  Users,
  Loader2,
  Calendar,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

interface Participant {
  id: string;
  sapaan: string;
  name: string;
  city: string;
  phone: string;
  status: string;
  registered_at: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
}

interface SendLog {
  participant: Participant;
  status: "pending" | "sending" | "success" | "failed";
  error?: string;
  apiKeyUsed?: string;
}

export default function BroadcastPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  // Form state
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Progress tracking
  const [sendLogs, setSendLogs] = useState<SendLog[]>([]);
  const [currentSending, setCurrentSending] = useState<string>("");

  // Results
  const [sendResults, setSendResults] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load participants
      const participantsRef = collection(db, "participants");
      const snapshot = await getDocs(participantsRef);
      const participantsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Participant[];

      setParticipants(participantsData);

      // Extract unique cities
      const uniqueCities = [
        ...new Set(participantsData.map((p) => p.city)),
      ].sort();
      setCities(uniqueCities);

      // Load templates
      const templatesRef = collection(db, "message_templates");
      const templatesSnapshot = await getDocs(templatesRef);
      const templatesData = templatesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MessageTemplate[];

      setTemplates(templatesData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  const getFilteredParticipants = () => {
    let filtered = [...participants];

    // City filter
    if (filterCity) {
      filtered = filtered.filter((p) => p.city === filterCity);
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(
        (p) =>
          new Date(p.registered_at) >= new Date(filterDateFrom + "T00:00:00")
      );
    }

    if (filterDateTo) {
      filtered = filtered.filter(
        (p) => new Date(p.registered_at) <= new Date(filterDateTo + "T23:59:59")
      );
    }

    return filtered;
  };

  const filteredParticipants = getFilteredParticipants();

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setMessage(template.content);
    }
  };

  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    if (filteredParticipants.length === 0) {
      alert("No recipients match the filters");
      return;
    }

    if (
      !confirm(`Send broadcast to ${filteredParticipants.length} participants?`)
    ) {
      return;
    }

    // Initialize send logs
    const initialLogs: SendLog[] = filteredParticipants.map((p) => ({
      participant: p,
      status: "pending",
    }));
    setSendLogs(initialLogs);
    setShowProgressDialog(true);
    setSending(true);
    setSendProgress(0);
    setSendResults(null);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < filteredParticipants.length; i++) {
      const participant = filteredParticipants[i];

      // Update current sending status
      setCurrentSending(participant.name);
      setSendLogs((prev) =>
        prev.map((log) =>
          log.participant.id === participant.id
            ? { ...log, status: "sending" }
            : log
        )
      );

      try {
        // Replace variables in message
        let personalizedMessage = message
          .replace(/{sapaan}/g, participant.sapaan)
          .replace(/{name}/g, participant.name)
          .replace(/{city}/g, participant.city);

        const result = await sendWhatsAppMessage(
          participant.phone,
          "broadcast",
          {
            sapaan: participant.sapaan,
            name: participant.name,
            city: participant.city,
          },
          participant.id
        );

        if (result.success) {
          successCount++;
          setSendLogs((prev) =>
            prev.map((log) =>
              log.participant.id === participant.id
                ? {
                    ...log,
                    status: "success",
                    apiKeyUsed: result.apiKeyUsed,
                  }
                : log
            )
          );
        } else {
          failedCount++;
          setSendLogs((prev) =>
            prev.map((log) =>
              log.participant.id === participant.id
                ? {
                    ...log,
                    status: "failed",
                    error: result.error,
                  }
                : log
            )
          );
        }

        // Delay between messages (1 second)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Error sending to", participant.phone, error);
        failedCount++;
        setSendLogs((prev) =>
          prev.map((log) =>
            log.participant.id === participant.id
              ? {
                  ...log,
                  status: "failed",
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : log
          )
        );
      }

      setSendProgress(
        Math.round(((i + 1) / filteredParticipants.length) * 100)
      );
    }

    setSendResults({
      total: filteredParticipants.length,
      success: successCount,
      failed: failedCount,
    });

    setSending(false);
    setCurrentSending("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          Broadcast Message
        </h1>
        <p className="text-gray-600 mt-2">
          Send WhatsApp messages to multiple participants
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Filters & Recipients */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recipient Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Recipient Filters
            </h2>

            <div className="space-y-4">
              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="belum_join">Belum Join</option>
                  <option value="sudah_join">Sudah Join</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registered From
                </label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registered To
                </label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => {
                  setFilterCity("");
                  setFilterStatus("");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-900"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Recipients Count */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Recipients</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  {filteredParticipants.length}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Right: Message Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Message Template (Optional)
            </h2>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Available variables: {"{sapaan}"}, {"{name}"}, {"{city}"}
            </p>
          </div>

          {/* Message Editor */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Message Content
            </h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              placeholder="Type your broadcast message here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-2">
              {message.length} characters
            </p>
          </div>

          {/* Send Button */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {sending && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Sending messages...
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {sendProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${sendProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {sendResults && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-green-900">
                    Broadcast Complete
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total</p>
                    <p className="font-bold text-gray-900">
                      {sendResults.total}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Success</p>
                    <p className="font-bold text-green-600">
                      {sendResults.success}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Failed</p>
                    <p className="font-bold text-red-600">
                      {sendResults.failed}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSendBroadcast}
              disabled={sending || !message.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending {sendProgress}%...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send to {filteredParticipants.length} Recipients</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Dialog */}
      {showProgressDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Broadcast Progress
                </h2>
                <button
                  onClick={() => setShowProgressDialog(false)}
                  disabled={sending}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Overall Progress Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {sending ? <>Sending: {currentSending}</> : <>Complete</>}
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {sendProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${sendProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-4 gap-2 text-center text-sm mt-4">
                <div>
                  <p className="text-gray-600">Total</p>
                  <p className="font-bold text-gray-900">{sendLogs.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Success</p>
                  <p className="font-bold text-green-600">
                    {sendLogs.filter((log) => log.status === "success").length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Failed</p>
                  <p className="font-bold text-red-600">
                    {sendLogs.filter((log) => log.status === "failed").length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Pending</p>
                  <p className="font-bold text-gray-600">
                    {
                      sendLogs.filter(
                        (log) =>
                          log.status === "pending" || log.status === "sending"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {sendLogs.map((log, index) => (
                <div
                  key={log.participant.id}
                  className={`p-4 rounded-lg border-2 ${
                    log.status === "success"
                      ? "bg-green-50 border-green-200"
                      : log.status === "failed"
                      ? "bg-red-50 border-red-200"
                      : log.status === "sending"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="shrink-0 mt-1">
                      {log.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : log.status === "failed" ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : log.status === "sending" ? (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>

                    {/* Participant Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900">
                          {index + 1}. {log.participant.name}
                        </p>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            log.status === "success"
                              ? "bg-green-100 text-green-700"
                              : log.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : log.status === "sending"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {log.status === "success"
                            ? "Sent"
                            : log.status === "failed"
                            ? "Failed"
                            : log.status === "sending"
                            ? "Sending..."
                            : "Pending"}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-1">
                        {log.participant.phone}
                      </p>

                      {/* API Key Used (on success) */}
                      {log.status === "success" && log.apiKeyUsed && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          API: {log.apiKeyUsed}
                        </p>
                      )}

                      {/* Error Message (on failure) */}
                      {log.status === "failed" && log.error && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                          <XCircle className="w-3 h-3" />
                          {log.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowProgressDialog(false)}
                disabled={sending}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {sending ? "Sending in progress..." : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
