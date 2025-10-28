"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Calendar,
  MessageSquare,
  TrendingUp,
  Share2,
  Clock,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";

export const dynamic = "force-dynamic";

interface Stats {
  totalParticipants: number;
  newToday: number;
  totalEvents: number;
  messagesSent: number;
  topReferrer: string;
  topReferrerCount: number;
  pendingNotifications: number;
}

interface PendingNotification {
  id: string;
  participant_name: string;
  created_at: string;
  countdown: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalParticipants: 0,
    newToday: 0,
    totalEvents: 0,
    messagesSent: 0,
    topReferrer: "",
    topReferrerCount: 0,
    pendingNotifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentParticipants, setRecentParticipants] = useState<any[]>([]);
  const [sortField, setSortField] = useState<string>("registered_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [pendingNotifications, setPendingNotifications] = useState<
    PendingNotification[]
  >([]);
  const [welcomeDelayMinutes, setWelcomeDelayMinutes] = useState(5);

  useEffect(() => {
    fetchDashboardData();
    // Update countdown every second
    const interval = setInterval(() => {
      updateCountdowns();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateCountdowns = async () => {
    let shouldTriggerAutomation = false;

    const updatedNotifications = pendingNotifications.map((notification) => {
      const createdAt = new Date(notification.created_at);
      const sendTime = new Date(
        createdAt.getTime() + welcomeDelayMinutes * 60 * 1000
      );
      const now = new Date();
      const remainingMs = sendTime.getTime() - now.getTime();

      if (remainingMs <= 0) {
        // Mark that we need to trigger automation
        if (notification.countdown !== "Sending...") {
          shouldTriggerAutomation = true;
        }
        return { ...notification, countdown: "Sending..." };
      }

      const remainingMinutes = Math.floor(remainingMs / 60000);
      const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
      return {
        ...notification,
        countdown: `${remainingMinutes}:${remainingSeconds
          .toString()
          .padStart(2, "0")}`,
      };
    });

    setPendingNotifications(updatedNotifications);

    // Trigger automation if any notification is ready
    if (shouldTriggerAutomation) {
      console.log("[Dashboard] Triggering automation for pending messages...");
      try {
        const response = await fetch("/api/cron/automation", {
          method: "POST",
        });
        const result = await response.json();
        console.log("[Dashboard] Automation triggered:", result);

        // Refresh dashboard data after a short delay
        setTimeout(() => {
          fetchDashboardData();
        }, 2000);
      } catch (error) {
        console.error("[Dashboard] Failed to trigger automation:", error);
      }
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedParticipants = () => {
    const sorted = [...recentParticipants].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle special cases
      if (sortField === "name") {
        aValue = `${a.sapaan} ${a.name}`.toLowerCase();
        bValue = `${b.sapaan} ${b.name}`.toLowerCase();
      } else if (sortField === "registered_at") {
        aValue = new Date(a.registered_at).getTime();
        bValue = new Date(b.registered_at).getTime();
      } else if (sortField === "status") {
        aValue = a.status === "sudah_join" ? 1 : 0;
        bValue = b.status === "sudah_join" ? 1 : 0;
      } else {
        aValue = String(aValue || "").toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch automation settings for welcome delay
      const settingsRef = doc(db, "automation_settings", "config");
      const settingsDoc = await getDoc(settingsRef);
      const welcomeDelay = settingsDoc.exists()
        ? settingsDoc.data()?.welcome_delay_minutes || 5
        : 5;
      setWelcomeDelayMinutes(welcomeDelay);

      // Fetch total participants
      const participantsSnap = await getDocs(collection(db, "participants"));
      const totalParticipants = participantsSnap.size;

      // Fetch new participants today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayQuery = query(
        collection(db, "participants"),
        where("registered_at", ">=", today.toISOString())
      );
      const todaySnap = await getDocs(todayQuery);
      const newToday = todaySnap.size;

      // Fetch total events
      const eventsSnap = await getDocs(collection(db, "events"));
      const totalEvents = eventsSnap.size;

      // Fetch total messages sent
      const notificationsSnap = await getDocs(
        collection(db, "notifications_log")
      );
      const messagesSent = notificationsSnap.size;

      // Fetch pending notifications
      const pendingQuery = query(
        collection(db, "notifications_log"),
        where("status", "==", "pending"),
        where("type", "==", "welcome")
      );
      const pendingSnap = await getDocs(pendingQuery);

      // Get participant details for pending notifications
      const pendingData: PendingNotification[] = [];
      for (const notifDoc of pendingSnap.docs) {
        const notif = notifDoc.data();
        const participantDoc = await getDoc(
          doc(db, "participants", notif.participant_id)
        );
        if (participantDoc.exists()) {
          const participant = participantDoc.data();
          const createdAt = new Date(notif.created_at);
          const sendTime = new Date(
            createdAt.getTime() + welcomeDelay * 60 * 1000
          );
          const now = new Date();
          const remainingMs = sendTime.getTime() - now.getTime();

          let countdown = "Sending...";
          if (remainingMs > 0) {
            const remainingMinutes = Math.floor(remainingMs / 60000);
            const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
            countdown = `${remainingMinutes}:${remainingSeconds
              .toString()
              .padStart(2, "0")}`;
          }

          pendingData.push({
            id: notifDoc.id,
            participant_name: `${participant.sapaan} ${participant.name}`,
            created_at: notif.created_at,
            countdown,
          });
        }
      }

      setPendingNotifications(pendingData);

      // Fetch recent participants
      const recentQuery = query(
        collection(db, "participants"),
        orderBy("registered_at", "desc"),
        limit(5)
      );
      const recentSnap = await getDocs(recentQuery);
      const recentData = recentSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate top referrer
      // Helper function to normalize phone numbers for comparison
      const normalizePhone = (phone: string | null) => {
        if (!phone) return null;
        return phone.replace(/[^0-9]/g, ""); // Remove all non-numeric characters
      };

      const referrerMap = new Map<string, { count: number; name: string }>();

      participantsSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.referrer_phone) {
          const normalizedReferrerPhone = normalizePhone(data.referrer_phone);
          if (!normalizedReferrerPhone) return;

          const existing = referrerMap.get(normalizedReferrerPhone);
          if (existing) {
            existing.count += 1;
          } else {
            // Find the referrer's name from participants
            const referrerDoc = participantsSnap.docs.find((d) => {
              const normalizedPhone = normalizePhone(d.data().phone);
              return normalizedPhone === normalizedReferrerPhone;
            });

            const referrerName = referrerDoc
              ? `${referrerDoc.data().sapaan || ""} ${
                  referrerDoc.data().name || ""
                }`.trim() || data.referrer_phone
              : data.referrer_phone;

            referrerMap.set(normalizedReferrerPhone, {
              count: 1,
              name: referrerName,
            });
          }
        }
      });

      let topReferrer = "";
      let topReferrerCount = 0;
      referrerMap.forEach((data, phone) => {
        if (data.count > topReferrerCount) {
          topReferrerCount = data.count;
          topReferrer = data.name;
        }
      });

      setStats({
        totalParticipants,
        newToday,
        totalEvents,
        messagesSent,
        topReferrer,
        topReferrerCount,
        pendingNotifications: pendingData.length,
      });

      setRecentParticipants(recentData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Participants",
      value: stats.totalParticipants,
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "New Today",
      value: stats.newToday,
      icon: UserPlus,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      color: "purple",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Messages Sent",
      value: stats.messagesSent,
      icon: MessageSquare,
      color: "orange",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Notifications with Countdown */}
      {pendingNotifications.length > 0 && (
        <div className="bg-linear-to-br from-yellow-50 to-orange-50 rounded-xl shadow-sm border border-yellow-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Pending Welcome Messages
              </h3>
              <p className="text-sm text-gray-600">
                {pendingNotifications.length} message
                {pendingNotifications.length !== 1 ? "s" : ""} waiting to be
                sent
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {pendingNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white border rounded-lg p-4 flex items-center justify-between ${
                  notification.countdown === "Sending..."
                    ? "border-green-300 bg-green-50"
                    : "border-yellow-200"
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {notification.participant_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Registered at{" "}
                    {new Date(notification.created_at).toLocaleTimeString(
                      "id-ID"
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {notification.countdown === "Sending..." ? (
                    <>
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-lg font-bold text-green-600">
                        {notification.countdown}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-lg font-bold text-yellow-600 font-mono">
                        {notification.countdown}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-yellow-200">
            <p className="text-xs text-gray-600">
              ⏱️ Welcome messages will be sent automatically after{" "}
              {welcomeDelayMinutes} minute{welcomeDelayMinutes !== 1 ? "s" : ""}{" "}
              delay
            </p>
          </div>
        </div>
      )}

      {/* Top Referrer Card */}
      <div className="bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-lg">
            <Share2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Top Referrer</h3>
            <p className="text-blue-100 mt-1">
              {stats.topReferrer || "No referrals yet"}
              {stats.topReferrer && ` - ${stats.topReferrerCount} referrals`}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Participants */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Recent Participants
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortField === "name" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("city")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    City
                    {sortField === "city" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("phone")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Phone
                    {sortField === "phone" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === "status" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("registered_at")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Registered
                    {sortField === "registered_at" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentParticipants.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No participants yet
                  </td>
                </tr>
              ) : (
                getSortedParticipants().map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {participant.sapaan} {participant.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {participant.profession}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          participant.status === "sudah_join"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {participant.status === "sudah_join"
                          ? "Joined"
                          : "New Lead"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(participant.registered_at).toLocaleDateString(
                        "id-ID"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
