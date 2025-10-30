"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Calendar,
  MapPin,
  Briefcase,
  Phone,
  Share2,
  Trash2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useToast } from "@/hooks/useToast";

export const dynamic = "force-dynamic";

interface Participant {
  id: string;
  sapaan: string;
  name: string;
  city: string;
  profession: string;
  phone: string;
  referral_code: string;
  referrer_phone: string | null;
  referrer_sequence: number;
  registered_at: string;
  status: "belum_join" | "sudah_join";
  unsubscribed: boolean;
}

export default function ParticipantsPage() {
  const { showToast, showConfirm, ToastContainer } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<
    Participant[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    sapaan: "",
    name: "",
    city: "",
    profession: "",
    phone: "",
  });

  useEffect(() => {
    loadParticipants();
  }, []);

  useEffect(() => {
    filterParticipants();
  }, [searchTerm, filterCity, filterStatus, participants]);

  const loadParticipants = async () => {
    try {
      const participantsRef = collection(db, "participants");
      const q = query(participantsRef, orderBy("registered_at", "desc"));
      const snapshot = await getDocs(q);

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

      setLoading(false);
    } catch (error) {
      console.error("Error loading participants:", error);
      setLoading(false);
    }
  };

  // Get invitor details by phone number
  const getInvitorDetails = (referrerPhone: string | null) => {
    if (!referrerPhone) return null;
    // referrer_phone is actually the referral_code of the invitor
    const invitor = participants.find((p) => p.referral_code === referrerPhone);
    return invitor;
  };

  // Helper function to normalize phone numbers for comparison
  const normalizePhone = (phone: string | null) => {
    if (!phone) return null;
    return phone.replace(/[^0-9]/g, ""); // Remove all non-numeric characters
  };

  // Calculate how many people a participant has referred
  const getReferralCount = (participantPhone: string) => {
    const normalizedPhone = normalizePhone(participantPhone);
    if (!normalizedPhone) return 0;

    return participants.filter((p) => {
      const normalizedReferrerPhone = normalizePhone(p.referrer_phone);
      return normalizedReferrerPhone === normalizedPhone;
    }).length;
  };

  const filterParticipants = () => {
    let filtered = [...participants];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.phone.includes(searchTerm) ||
          p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.profession.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // City filter
    if (filterCity) {
      filtered = filtered.filter((p) => p.city === filterCity);
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    setFilteredParticipants(filtered);
    setCurrentPage(1);
  };

  const updateStatus = async (participantId: string, newStatus: string) => {
    try {
      const participantRef = doc(db, "participants", participantId);
      await updateDoc(participantRef, {
        status: newStatus,
      });
      await loadParticipants();
      setShowModal(false);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleEditClick = () => {
    if (selectedParticipant) {
      setEditFormData({
        sapaan: selectedParticipant.sapaan,
        name: selectedParticipant.name,
        city: selectedParticipant.city,
        profession: selectedParticipant.profession,
        phone: selectedParticipant.phone,
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedParticipant) return;

    try {
      const participantRef = doc(db, "participants", selectedParticipant.id);
      await updateDoc(participantRef, {
        sapaan: editFormData.sapaan,
        name: editFormData.name,
        city: editFormData.city,
        profession: editFormData.profession,
        phone: editFormData.phone,
      });

      showToast("Participant updated successfully!", "success");
      setIsEditing(false);
      await loadParticipants();
      setShowModal(false);
    } catch (error) {
      console.error("Error updating participant:", error);
      showToast("Failed to update participant. Please try again.", "error");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      sapaan: "",
      name: "",
      city: "",
      profession: "",
      phone: "",
    });
  };

  const deleteParticipant = async (
    participantId: string,
    participantName: string
  ) => {
    showConfirm(
      "Delete Participant",
      `Are you sure you want to delete ${participantName}? This action cannot be undone.`,
      async () => {
        try {
          const participantRef = doc(db, "participants", participantId);
          await deleteDoc(participantRef);
          showToast(
            `${participantName} has been deleted successfully.`,
            "success"
          );
          await loadParticipants();
          if (showModal) {
            setShowModal(false);
          }
        } catch (error) {
          console.error("Error deleting participant:", error);
          showToast("Failed to delete participant. Please try again.", "error");
        }
      }
    );
  };

  const exportToCSV = () => {
    const headers = [
      "Sapaan",
      "Nama",
      "Kota",
      "Profesi",
      "Nomor WhatsApp",
      "Kode Referral",
      "Pengundang",
      "Referrer Phone",
      "Urutan Referral",
      "Tanggal Daftar",
      "Status",
    ];

    const csvData = filteredParticipants.map((p) => {
      const invitor = getInvitorDetails(p.referrer_phone);
      const invitorInfo = invitor ? `${invitor.name}\n${invitor.phone}` : "-";

      return [
        p.sapaan,
        p.name,
        p.city,
        p.profession,
        p.phone,
        p.referral_code,
        invitorInfo,
        p.referrer_phone || "-",
        p.referrer_sequence,
        new Date(p.registered_at).toLocaleString("id-ID"),
        p.status,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `participants_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredParticipants.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);

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
          <Users className="w-8 h-8 text-blue-600" />
          Participants Management
        </h1>
        <p className="text-gray-600 mt-2">
          Total: {filteredParticipants.length} participants
        </p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, phone, city, profession..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* City Filter */}
          <div>
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
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterCity("");
              setFilterStatus("");
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Filters
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
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
                  Referrals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pengundang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Registered
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
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center">
                    <p className="text-gray-500">No participants found</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((participant) => {
                  const invitor = getInvitorDetails(participant.referrer_phone);

                  return (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {participant.sapaan} {participant.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {participant.profession}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {participant.city}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {participant.phone}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <Share2 className="w-4 h-4" />
                          {getReferralCount(participant.phone)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {invitor ? (
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {invitor.name}
                            </p>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {invitor.phone}
                            </code>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(participant.registered_at).toLocaleDateString(
                          "id-ID"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            participant.status === "sudah_join"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {participant.status === "sudah_join"
                            ? "Sudah Join"
                            : "New Lead"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedParticipant(participant);
                              setShowModal(true);
                              setIsEditing(false);
                            }}
                            className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedParticipant(participant);
                              setEditFormData({
                                sapaan: participant.sapaan,
                                name: participant.name,
                                city: participant.city,
                                profession: participant.profession,
                                phone: participant.phone,
                              });
                              setIsEditing(true);
                              setShowModal(true);
                            }}
                            className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded transition-colors"
                            title="Edit Participant"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              deleteParticipant(
                                participant.id,
                                `${participant.sapaan} ${participant.name}`
                              )
                            }
                            className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Delete Participant"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredParticipants.length)} of{" "}
              {filteredParticipants.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? "Edit Participant" : "Participant Details"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sapaan
                      </label>
                      <select
                        value={editFormData.sapaan}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            sapaan: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Bapak">Bapak</option>
                        <option value="Ibu">Ibu</option>
                        <option value="Saudara">Saudara</option>
                        <option value="Saudari">Saudari</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={editFormData.city}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            city: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profession
                      </label>
                      <input
                        type="text"
                        value={editFormData.profession}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            profession: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-900">
                        {selectedParticipant.sapaan} {selectedParticipant.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Profession</p>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {selectedParticipant.profession}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">City</p>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {selectedParticipant.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">WhatsApp</p>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {selectedParticipant.phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Referral Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Referral Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Referral Code</p>
                    <code className="font-mono text-sm bg-gray-100 px-3 py-2 rounded block">
                      {selectedParticipant.referral_code}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Referrals</p>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      {getReferralCount(selectedParticipant.phone)} people
                    </p>
                  </div>
                  {selectedParticipant.referrer_phone && (
                    <>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">
                          Pengundang (Invitor)
                        </p>
                        {(() => {
                          const invitor = getInvitorDetails(
                            selectedParticipant.referrer_phone
                          );
                          return invitor ? (
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium text-gray-900">
                                {invitor.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {invitor.phone}
                              </p>
                            </div>
                          ) : (
                            <p className="font-medium text-gray-900">
                              {selectedParticipant.referrer_phone}
                            </p>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Registration Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Registration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Registered At</p>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(
                        selectedParticipant.registered_at
                      ).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Status</p>
                    <select
                      value={selectedParticipant.status}
                      onChange={(e) =>
                        updateStatus(selectedParticipant.id, e.target.value)
                      }
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="belum_join">Belum Join</option>
                      <option value="sudah_join">Sudah Join</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Action Buttons */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() =>
                      deleteParticipant(
                        selectedParticipant.id,
                        `${selectedParticipant.sapaan} ${selectedParticipant.name}`
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Participant
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleEditClick}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}
