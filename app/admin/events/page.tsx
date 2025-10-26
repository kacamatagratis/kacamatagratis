"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Video,
  Users,
  Send,
  X,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

interface Event {
  id: string;
  title: string;
  start_time: string;
  zoom_link: string;
  description?: string;
  created_at?: string;
}

interface Participant {
  id: string;
  name: string;
  sapaan: string;
  phone: string;
  status: string;
}

interface SendLog {
  participant: Participant;
  status: "pending" | "sending" | "success" | "failed";
  error?: string;
  apiKeyUsed?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  // Progress dialog state
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [sendLogs, setSendLogs] = useState<SendLog[]>([]);
  const [currentSending, setCurrentSending] = useState("");
  const [sendProgress, setSendProgress] = useState(0);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    start_time: "",
    zoom_link: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load events
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, orderBy("start_time", "desc"));
      const snapshot = await getDocs(q);
      const eventsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];

      setEvents(eventsData);

      // Load participants
      const participantsRef = collection(db, "participants");
      const participantsSnapshot = await getDocs(participantsRef);
      const participantsData = participantsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Participant[];

      setParticipants(participantsData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingEvent) {
        // Update existing event
        const eventRef = doc(db, "events", editingEvent.id);
        await updateDoc(eventRef, {
          title: formData.title,
          start_time: formData.start_time,
          zoom_link: formData.zoom_link,
          description: formData.description,
        });
      } else {
        // Create new event
        await addDoc(collection(db, "events"), {
          title: formData.title,
          start_time: formData.start_time,
          zoom_link: formData.zoom_link,
          description: formData.description,
          created_at: new Date().toISOString(),
        });
      }

      setShowModal(false);
      setEditingEvent(null);
      setFormData({
        title: "",
        start_time: "",
        zoom_link: "",
        description: "",
      });
      loadData();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event");
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      start_time: event.start_time,
      zoom_link: event.zoom_link,
      description: event.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await deleteDoc(doc(db, "events", eventId));
      loadData();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const sendEventReminder = async (event: Event) => {
    if (!confirm(`Send reminder for "${event.title}" to all participants?`))
      return;

    // Initialize send logs
    const initialLogs: SendLog[] = participants.map((p) => ({
      participant: p,
      status: "pending",
    }));
    setSendLogs(initialLogs);
    setShowProgressDialog(true);
    setCurrentEvent(event);
    setSendingReminders(true);
    setSendProgress(0);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];

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
        const result = await sendWhatsAppMessage(
          participant.phone,
          "event_reminder",
          {
            event_title: event.title,
            sapaan: participant.sapaan,
            name: participant.name,
            zoom_link: event.zoom_link,
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

        // Delay between messages
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Error sending reminder:", error);
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

      setSendProgress(Math.round(((i + 1) / participants.length) * 100));
    }

    setSendingReminders(false);
    setCurrentSending("");
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const isUpcoming = (dateTimeString: string) => {
    return new Date(dateTimeString) > new Date();
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            Events Management
          </h1>
          <p className="text-gray-600 mt-2">
            Create and manage Zoom events for participants
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setFormData({
              title: "",
              start_time: "",
              zoom_link: "",
              description: "",
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <div className="col-span-full bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No events created yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first event
            </button>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`bg-white border rounded-lg p-6 ${
                isUpcoming(event.start_time)
                  ? "border-blue-200 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDateTime(event.start_time)}
                  </p>
                </div>
                {isUpcoming(event.start_time) && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Upcoming
                  </span>
                )}
              </div>

              {event.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {event.description}
                </p>
              )}

              <div className="mb-4">
                <a
                  href={event.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Video className="w-4 h-4" />
                  <span className="truncate">Zoom Link</span>
                </a>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => sendEventReminder(event)}
                  disabled={sendingReminders}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Reminder</span>
                </button>
                <button
                  onClick={() => handleEdit(event)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Kacamata Gratis Webinar"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Zoom Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zoom Link *
                </label>
                <input
                  type="url"
                  required
                  value={formData.zoom_link}
                  onChange={(e) =>
                    setFormData({ ...formData, zoom_link: e.target.value })
                  }
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Event description..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>{editingEvent ? "Update Event" : "Create Event"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Dialog */}
      {showProgressDialog && currentEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Sending Reminders: {currentEvent.title}
                </h2>
                <button
                  onClick={() => setShowProgressDialog(false)}
                  disabled={sendingReminders}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Overall Progress Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {sendingReminders ? (
                      <>Sending: {currentSending}</>
                    ) : (
                      <>Complete</>
                    )}
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
                disabled={sendingReminders}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {sendingReminders ? "Sending in progress..." : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
