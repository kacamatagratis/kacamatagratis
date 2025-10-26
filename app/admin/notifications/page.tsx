"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Filter,
  RefreshCw,
  Eye,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export const dynamic = "force-dynamic";

interface NotificationLog {
  id: string;
  participant_id: string;
  target_phone: string;
  type: string;
  api_key_used: string;
  status: "success" | "failed" | "pending";
  message_content: string;
  error?: string;
  metadata?: any;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    NotificationLog[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationLog | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [filterType, filterStatus, filterDateFrom, filterDateTo, notifications]);

  const loadNotifications = async () => {
    try {
      const notificationsRef = collection(db, "notifications_log");
      const q = query(
        notificationsRef,
        orderBy("created_at", "desc"),
        limit(500)
      );
      const snapshot = await getDocs(q);

      const notificationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationLog[];

      setNotifications(notificationsData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Type filter
    if (filterType) {
      filtered = filtered.filter((n) => n.type === filterType);
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((n) => n.status === filterStatus);
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(
        (n) => new Date(n.created_at) >= new Date(filterDateFrom + "T00:00:00")
      );
    }

    if (filterDateTo) {
      filtered = filtered.filter(
        (n) => new Date(n.created_at) <= new Date(filterDateTo + "T23:59:59")
      );
    }

    setFilteredNotifications(filtered);
  };

  const handleRetry = async (notificationId: string) => {
    if (retrying) return; // Prevent multiple retries at once

    setRetrying(notificationId);
    try {
      const response = await fetch("/api/notifications/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Message resent successfully!");
        // Reload notifications to see updated status
        await loadNotifications();
      } else {
        alert(`Failed to retry: ${data.error}`);
      }
    } catch (error) {
      console.error("Error retrying notification:", error);
      alert("Failed to retry message");
    } finally {
      setRetrying(null);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      welcome: "Welcome",
      referrer_alert: "Referrer Alert",
      event_reminder: "Event Reminder",
      broadcast: "Broadcast",
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      welcome: "bg-blue-100 text-blue-800",
      referrer_alert: "bg-green-100 text-green-800",
      event_reminder: "bg-purple-100 text-purple-800",
      broadcast: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const stats = {
    total: filteredNotifications.length,
    success: filteredNotifications.filter((n) => n.status === "success").length,
    failed: filteredNotifications.filter((n) => n.status === "failed").length,
    pending: filteredNotifications.filter((n) => n.status === "pending").length,
    successRate:
      filteredNotifications.length > 0
        ? (
            (filteredNotifications.filter((n) => n.status === "success")
              .length /
              filteredNotifications.length) *
            100
          ).toFixed(1)
        : 0,
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
            <Bell className="w-8 h-8 text-blue-600" />
            Notifications Log
          </h1>
          <p className="text-gray-600 mt-2">
            View all sent WhatsApp messages and their status
          </p>
        </div>
        <button
          onClick={loadNotifications}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-500 font-medium">Total Messages</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-500 font-medium">Successful</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats.success}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-500 font-medium">Failed</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.failed}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-500 font-medium">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {stats.pending}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="welcome">Welcome</option>
              <option value="referrer_alert">Referrer Alert</option>
              <option value="event_reminder">Event Reminder</option>
              <option value="broadcast">Broadcast</option>
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
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setFilterType("");
            setFilterStatus("");
            setFilterDateFrom("");
            setFilterDateTo("");
          }}
          className="mt-4 text-sm text-gray-600 hover:text-gray-900"
        >
          Clear Filters
        </button>
      </div>

      {/* Notifications Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  API Key Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <p className="text-gray-500">No notifications found</p>
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(notification.created_at).toLocaleString(
                        "id-ID"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(
                          notification.type
                        )}`}
                      >
                        {getTypeLabel(notification.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {notification.target_phone}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {notification.api_key_used}
                    </td>
                    <td className="px-6 py-4">
                      {notification.status === "success" ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Success</span>
                        </div>
                      ) : notification.status === "pending" ? (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Failed</span>
                          </div>
                          <button
                            onClick={() => handleRetry(notification.id)}
                            disabled={retrying === notification.id}
                            className="ml-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Retry sending"
                          >
                            {retrying === notification.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Notification Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedNotification.created_at).toLocaleString(
                      "id-ID"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(
                      selectedNotification.type
                    )}`}
                  >
                    {getTypeLabel(selectedNotification.type)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recipient Phone</p>
                  <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {selectedNotification.target_phone}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-gray-500">API Key Used</p>
                  <p className="font-medium text-gray-900">
                    {selectedNotification.api_key_used}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedNotification.status === "success" ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-600">
                          Success
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-600">Failed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message Content
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {selectedNotification.message_content}
                  </pre>
                </div>
              </div>

              {/* Error Message (if failed) */}
              {selectedNotification.status === "failed" &&
                selectedNotification.error && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Error Message</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-700">
                        {selectedNotification.error}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
