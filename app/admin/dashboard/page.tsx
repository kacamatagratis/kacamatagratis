"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Calendar,
  MessageSquare,
  TrendingUp,
  Share2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

export const dynamic = "force-dynamic";

interface Stats {
  totalParticipants: number;
  newToday: number;
  totalEvents: number;
  messagesSent: number;
  topReferrer: string;
  topReferrerCount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalParticipants: 0,
    newToday: 0,
    totalEvents: 0,
    messagesSent: 0,
    topReferrer: "",
    topReferrerCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentParticipants, setRecentParticipants] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
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
      const referrerMap = new Map<string, number>();
      participantsSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.referrer_phone) {
          referrerMap.set(
            data.referrer_phone,
            (referrerMap.get(data.referrer_phone) || 0) + 1
          );
        }
      });

      let topReferrer = "";
      let topReferrerCount = 0;
      referrerMap.forEach((count, phone) => {
        if (count > topReferrerCount) {
          topReferrerCount = count;
          topReferrer = phone;
        }
      });

      setStats({
        totalParticipants,
        newToday,
        totalEvents,
        messagesSent,
        topReferrer,
        topReferrerCount,
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
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
                recentParticipants.map((participant) => (
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
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {participant.status === "sudah_join"
                          ? "Joined"
                          : "Pending"}
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
