"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Users,
  TrendingUp,
  Award,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
} from "lucide-react";
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

type FilterPeriod = "all" | "month" | "year";

export default function ReferralsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [referrerStats, setReferrerStats] = useState<ReferrerStats[]>([]);
  const [filteredReferrerStats, setFilteredReferrerStats] = useState<
    ReferrerStats[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [expandedReferrer, setExpandedReferrer] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Apply filter when period changes
    applyFilter();
  }, [filterPeriod, selectedMonth, selectedYear, referrerStats]);

  const applyFilter = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let filtered = referrerStats
      .map((referrer) => {
        let filteredReferrals = referrer.referrals;

        if (filterPeriod === "month") {
          const targetMonth = selectedMonth
            ? parseInt(selectedMonth)
            : currentMonth;
          const targetYear = selectedYear
            ? parseInt(selectedYear)
            : currentYear;

          filteredReferrals = referrer.referrals.filter((r) => {
            const date = new Date(r.registered_at);
            return (
              date.getMonth() === targetMonth &&
              date.getFullYear() === targetYear
            );
          });
        } else if (filterPeriod === "year") {
          const targetYear = selectedYear
            ? parseInt(selectedYear)
            : currentYear;

          filteredReferrals = referrer.referrals.filter((r) => {
            const date = new Date(r.registered_at);
            return date.getFullYear() === targetYear;
          });
        }

        return {
          ...referrer,
          referrals: filteredReferrals,
          totalReferrals: filteredReferrals.length,
        };
      })
      .filter((r) => r.totalReferrals > 0); // Only show referrers with referrals in the period

    // Sort by total referrals
    filtered.sort((a, b) => b.totalReferrals - a.totalReferrals);

    setFilteredReferrerStats(filtered);
  };

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

      console.log("[REFERRALS] Total participants:", participantsData.length);
      console.log(
        "[REFERRALS] Participants with referrer:",
        participantsData.filter((p) => p.referrer_phone).length
      );

      // Create a helper function to normalize phone numbers for comparison
      const normalizePhone = (phone: string | null) => {
        if (!phone) return null;
        return phone.replace(/[^0-9]/g, ""); // Remove all non-numeric characters
      };

      participantsData.forEach((participant) => {
        const normalizedParticipantPhone = normalizePhone(participant.phone);

        // Count referrals made by this participant
        const referrals = participantsData.filter((p) => {
          const normalizedReferrerPhone = normalizePhone(p.referrer_phone);
          return normalizedReferrerPhone === normalizedParticipantPhone;
        });

        console.log(
          `[REFERRALS] ${participant.name} (${participant.phone} / normalized: ${normalizedParticipantPhone}) has ${referrals.length} referrals`
        );

        if (referrals.length > 0) {
          console.log(
            `[REFERRALS] Referrals for ${participant.name}:`,
            referrals.map((r) => ({
              name: r.name,
              phone: r.phone,
              referrer_phone: r.referrer_phone,
            }))
          );
        }

        if (referrals.length > 0) {
          console.log(
            `[REFERRALS] Adding ${participant.name} to referrer stats`
          );
          referrerMap.set(participant.phone, {
            phone: participant.phone,
            name: participant.name,
            city: participant.city,
            totalReferrals: referrals.length,
            referrals: referrals,
          });
        }
      });

      console.log("[REFERRALS] Total referrers found:", referrerMap.size);

      // Sort by total referrals descending
      const sortedReferrers = Array.from(referrerMap.values()).sort(
        (a, b) => b.totalReferrals - a.totalReferrals
      );

      console.log("[REFERRALS] Sorted referrers:", sortedReferrers);

      setReferrerStats(sortedReferrers);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  // Calculate stats based on filtered data
  const displayStats =
    filteredReferrerStats.length > 0 ? filteredReferrerStats : referrerStats;
  const totalReferrals = displayStats.reduce(
    (sum, r) => sum + r.totalReferrals,
    0
  );
  const totalReferrers = displayStats.length;
  const avgReferralsPerReferrer =
    totalReferrers > 0 ? (totalReferrals / totalReferrers).toFixed(1) : 0;

  const toggleExpanded = (phone: string) => {
    setExpandedReferrer(expandedReferrer === phone ? null : phone);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate month/year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

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

      {/* Filter Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">Filter:</span>
          </div>

          {/* Period Type Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterPeriod("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                filterPeriod === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilterPeriod("month")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                filterPeriod === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setFilterPeriod("year")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                filterPeriod === "year"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              This Year
            </button>
          </div>

          {/* Month Selector */}
          {filterPeriod === "month" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Current Month</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          )}

          {/* Year Selector */}
          {(filterPeriod === "month" || filterPeriod === "year") && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Current Year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
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

        <div className="bg-linear-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
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

        <div className="bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <p className="text-gray-500">No referral data yet</p>
                  </td>
                </tr>
              ) : (
                displayStats.map((referrer, index) => (
                  <React.Fragment key={referrer.phone}>
                    <tr className="hover:bg-gray-50">
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
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleExpanded(referrer.phone)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          {expandedReferrer === referrer.phone ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              View All
                            </>
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Referral History */}
                    {expandedReferrer === referrer.phone && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-4">
                              <Calendar className="w-5 h-5 text-blue-600" />
                              <h3 className="font-semibold text-gray-900">
                                Complete Referral History (
                                {referrer.totalReferrals} referrals)
                              </h3>
                            </div>

                            <div className="grid gap-3">
                              {referrer.referrals.map((ref, refIndex) => (
                                <div
                                  key={ref.id}
                                  className="bg-white border border-gray-200 rounded-lg p-4"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                                          {refIndex + 1}
                                        </span>
                                        <div>
                                          <p className="font-semibold text-gray-900">
                                            {ref.name}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            {ref.city} • {ref.phone}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                          Registered:{" "}
                                          {formatDate(ref.registered_at)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                        Referral #{ref.referrer_sequence}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
