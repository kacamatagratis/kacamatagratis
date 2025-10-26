"use client";

import { useState, useEffect } from "react";
import { Share2, Users, TrendingUp, Award, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export const dynamic = "force-dynamic";

interface Participant {
  id: string;
  name: string;
  phone: string;
  city: string;
  referral_code: string;
  referrer_phone: string | null;
  referrer_sequence: number;
  registered_at: string;
}

interface ReferrerStats {
  phone: string;
  name: string;
  city: string;
  totalReferrals: number;
  referrals: Participant[];
}

export default function ReferralsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [referrerStats, setReferrerStats] = useState<ReferrerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const participantsRef = collection(db, "participants");
      const q = query(participantsRef, orderBy("registered_at", "desc"));
      const snapshot = await getDocs(q);

      const participantsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Participant[];

      setParticipants(participantsData);

      // Calculate referrer statistics
      const referrerMap = new Map<string, ReferrerStats>();

      participantsData.forEach((participant) => {
        // Count referrals made by this participant
        const referrals = participantsData.filter(
          (p) => p.referrer_phone === participant.phone
        );

        if (referrals.length > 0) {
          referrerMap.set(participant.phone, {
            phone: participant.phone,
            name: participant.name,
            city: participant.city,
            totalReferrals: referrals.length,
            referrals: referrals,
          });
        }
      });

      // Sort by total referrals descending
      const sortedReferrers = Array.from(referrerMap.values()).sort(
        (a, b) => b.totalReferrals - a.totalReferrals
      );

      setReferrerStats(sortedReferrers);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  const totalReferrals = participants.filter(
    (p) => p.referrer_phone !== null
  ).length;
  const totalReferrers = referrerStats.length;
  const avgReferralsPerReferrer =
    totalReferrers > 0 ? (totalReferrals / totalReferrers).toFixed(1) : 0;

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
          <Share2 className="w-8 h-8 text-blue-600" />
          Referral Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          Track and analyze referral performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                Total Referrals
              </p>
              <p className="text-3xl font-bold mt-2">{totalReferrals}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                Active Referrers
              </p>
              <p className="text-3xl font-bold mt-2">{totalReferrers}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Award className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                Avg per Referrer
              </p>
              <p className="text-3xl font-bold mt-2">
                {avgReferralsPerReferrer}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Referrers */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Top Referrers</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Referrals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Recent Referrals
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {referrerStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <p className="text-gray-500">No referral data yet</p>
                  </td>
                </tr>
              ) : (
                referrerStats.map((referrer, index) => (
                  <tr key={referrer.phone} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Award className="w-5 h-5 text-yellow-500" />
                        )}
                        {index === 1 && (
                          <Award className="w-5 h-5 text-gray-400" />
                        )}
                        {index === 2 && (
                          <Award className="w-5 h-5 text-orange-600" />
                        )}
                        <span className="font-bold text-gray-900">
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {referrer.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {referrer.city}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {referrer.phone}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-lg text-blue-600">
                          {referrer.totalReferrals}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {referrer.referrals.slice(0, 3).map((ref) => (
                          <p
                            key={ref.id}
                            className="text-xs text-gray-500 truncate"
                          >
                            {ref.name} ({ref.city})
                          </p>
                        ))}
                        {referrer.referrals.length > 3 && (
                          <p className="text-xs text-blue-600">
                            +{referrer.referrals.length - 3} more
                          </p>
                        )}
                      </div>
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
