"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Users,
  Loader2,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Info,
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
  referral_code?: string;
  profession?: string;
  referrer_phone?: string;
  referrer_sequence?: number;
  unsubscribed?: boolean;
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

  // Participant selection state
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Form state
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Progress tracking
  const [sendLogs, setSendLogs] = useState<SendLog[]>([]);
  const [currentSending, setCurrentSending] = useState<string>("");

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "info" | "error" | "warning";
    message: string;
  }>({ show: false, type: "info", message: "" });

  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Results
  const [sendResults, setSendResults] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  const showNotification = (
    type: "info" | "error" | "warning",
    message: string
  ) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type, message: "" });
    }, 3000);
  };

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

      // Load templates
      const templatesRef = collection(db, "message_templates");
      const templatesSnapshot = await getDocs(templatesRef);
      const templatesData = templatesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MessageTemplate[];

      // Remove duplicates based on template name
      const uniqueTemplates = templatesData.filter(
        (template, index, self) =>
          index === self.findIndex((t) => t.name === template.name)
      );

      setTemplates(uniqueTemplates);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  const getFilteredParticipants = () => {
    let filtered = [...participants];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.phone.includes(query) ||
          p.city.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    return filtered;
  };

  const filteredParticipants = getFilteredParticipants();

  // Get selected participants from filtered list
  const getSelectedParticipantsData = () => {
    return filteredParticipants.filter((p) => selectedParticipants.has(p.id));
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredParticipants.map((p) => p.id));
    setSelectedParticipants(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedParticipants(new Set());
  };

  const handleToggleParticipant = (id: string) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedParticipants(newSelected);
  };

  const isAllSelected =
    filteredParticipants.length > 0 &&
    filteredParticipants.every((p) => selectedParticipants.has(p.id));

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setMessage(template.content);
    }
  };

  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      showNotification("error", "Please enter a message");
      return;
    }

    const selectedData = getSelectedParticipantsData();

    if (selectedData.length === 0) {
      showNotification("error", "Please select at least one participant");
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const confirmSend = async () => {
    setShowConfirmDialog(false);
    const selectedData = getSelectedParticipantsData();

    // Initialize send logs
    const initialLogs: SendLog[] = selectedData.map((p) => ({
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

    const totalToSend = selectedData.length;
    for (let i = 0; i < selectedData.length; i++) {
      const participant = selectedData[i];

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
        // Replace ALL variables in message
        const referralLink = participant.referral_code
          ? `${
              process.env.NEXT_PUBLIC_APP_URL || "https://kacamatagratis.org"
            }?ref=${participant.referral_code}`
          : "";

        let personalizedMessage = message
          .replace(/{sapaan}/g, participant.sapaan || "")
          .replace(/{name}/g, participant.name || "")
          .replace(/{city}/g, participant.city || "")
          .replace(/{profession}/g, participant.profession || "")
          .replace(/{phone}/g, participant.phone || "")
          .replace(/{referral_code}/g, referralLink)
          .replace(/{referrer_phone}/g, participant.referrer_phone || "")
          .replace(
            /{referrer_sequence}/g,
            String(participant.referrer_sequence || "")
          )
          .replace(/{status}/g, participant.status || "")
          .replace(
            /{registered_at}/g,
            participant.registered_at
              ? new Date(participant.registered_at).toLocaleDateString("id-ID")
              : ""
          );

        // Send broadcast message directly (not using template)
        const response = await fetch("/api/broadcast/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: participant.phone,
            message: personalizedMessage,
            participantId: participant.id,
          }),
        });

        const result = await response.json();

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

      setSendProgress(Math.round(((i + 1) / totalToSend) * 100));
    }

    setSendResults({
      total: totalToSend,
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
          {/* Recipients Count */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Filtered</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  {filteredParticipants.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium text-right">
                  Selected
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {selectedParticipants.size}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Selection Controls */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Participants
            </h2>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, or city..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="new_leads">New Leads</option>
                <option value="join_zoom">Join Zoom/Presentations</option>
                <option value="join_mgi">Join MGI</option>
              </select>
            </div>

            {/* Select All / Deselect All Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleSelectAll}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <CheckSquare className="w-4 h-4" />
                Select All ({filteredParticipants.length})
              </button>
              <button
                onClick={handleDeselectAll}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                <Square className="w-4 h-4" />
                Deselect All
              </button>
            </div>

            {/* Participant List */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredParticipants.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No participants found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      onClick={() => handleToggleParticipant(participant.id)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedParticipants.has(participant.id)
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {selectedParticipants.has(participant.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {participant.sapaan} {participant.name}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {participant.phone}
                          </p>
                          <p className="text-xs text-gray-500">
                            {participant.city}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
          </div>

          {/* Variable Documentation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Available Variables
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="bg-white rounded p-2">
                <code className="text-blue-600 font-bold">{"{sapaan}"}</code>
                <p className="text-gray-600 mt-1">Bapak/Ibu/Saudara</p>
              </div>
              <div className="bg-white rounded p-2">
                <code className="text-blue-600 font-bold">{"{name}"}</code>
                <p className="text-gray-600 mt-1">Participant name</p>
              </div>
              <div className="bg-white rounded p-2">
                <code className="text-blue-600 font-bold">{"{city}"}</code>
                <p className="text-gray-600 mt-1">City/Location</p>
              </div>
              <div className="bg-white rounded p-2">
                <code className="text-blue-600 font-bold">
                  {"{profession}"}
                </code>
                <p className="text-gray-600 mt-1">Profession/Job</p>
              </div>
              <div className="bg-white rounded p-2">
                <code className="text-blue-600 font-bold">{"{phone}"}</code>
                <p className="text-gray-600 mt-1">Phone number</p>
              </div>
              <div className="bg-white rounded p-2">
                <code className="text-blue-600 font-bold">
                  {"{referral_code}"}
                </code>
                <p className="text-gray-600 mt-1">Full referral URL</p>
              </div>
              <div className="bg-white rounded p-2">
                <code className="text-blue-600 font-bold">{"{status}"}</code>
                <p className="text-gray-600 mt-1">
                  new_leads/join_zoom/join_mgi
                </p>
              </div>
              <div className="bg-white rounded p-2">
                <code className="text-blue-600 font-bold">
                  {"{registered_at}"}
                </code>
                <p className="text-gray-600 mt-1">Registration date</p>
              </div>
              <div className="bg-white rounded p-2">
                <code className="text-blue-600 font-bold">
                  {"{referrer_sequence}"}
                </code>
                <p className="text-gray-600 mt-1">Referral count number</p>
              </div>
            </div>
            <p className="text-xs text-blue-800 mt-3 italic">
              💡 All variables will be automatically replaced with actual
              participant data when sending.
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
              rows={12}
              placeholder={`Example message:

Halo {sapaan} {name}! 👋

Terima kasih sudah mendaftar di Kacamata Gratis! 🎉

📍 Kota: {city}
💼 Profesi: {profession}
🔗 Link Referral: {referral_link}

Bagikan link di atas untuk mengajak teman & dapat reward!

Salam,
Tim Kacamata Gratis`}
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
                  <span>
                    Send to {selectedParticipants.size > 0 ? selectedParticipants.size : filteredParticipants.length} Recipient{selectedParticipants.size > 1 || filteredParticipants.length > 1 ? "s" : ""}
                  </span>
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Info className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Confirm Broadcast
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Send broadcast message to{" "}
                <span className="font-bold text-gray-900">
                  {getSelectedParticipantsData().length}
                </span>{" "}
                selected participant(s)?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSend}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Send Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <div
            className={`rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] ${
              notification.type === "error"
                ? "bg-red-50 border border-red-200"
                : notification.type === "warning"
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            {notification.type === "error" ? (
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            ) : notification.type === "warning" ? (
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <p
              className={`text-sm font-medium ${
                notification.type === "error"
                  ? "text-red-900"
                  : notification.type === "warning"
                  ? "text-yellow-900"
                  : "text-blue-900"
              }`}
            >
              {notification.message}
            </p>
            <button
              onClick={() => setNotification({ ...notification, show: false })}
              className="ml-auto"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
