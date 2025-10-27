"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { User, MapPin, Briefcase, Phone, Send } from "lucide-react";

export default function RegistrationForm() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    sapaan: "Bapak",
    name: "",
    city: "",
    profession: "",
    phone: "",
  });
  const [referrerPhone, setReferrerPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Extract referral code from URL
    const ref = searchParams.get("ref");
    if (ref) {
      setReferrerPhone(ref);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          referrerPhone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);

        // Fetch general settings for WhatsApp redirect number and message template
        const settingsResponse = await fetch("/api/general-settings");
        const settingsData = await settingsResponse.json();

        const adminPhone = settingsData.whatsapp_redirect_number
          ? settingsData.whatsapp_redirect_number.replace(/[^0-9]/g, "") // Remove formatting
          : "6281517800900"; // Default fallback

        const messageTemplate =
          settingsData.whatsapp_message_template ||
          "Halo Admin, saya {name} dari {city} sudah mendaftar untuk mengikuti sosialisasi program Socialpreneur. Terima kasih!";

        // Replace variables in template
        const personalizedMessage = messageTemplate
          .replace("{name}", formData.name)
          .replace("{city}", formData.city);

        // Redirect to WhatsApp after 2 seconds
        setTimeout(() => {
          const message = encodeURIComponent(personalizedMessage);
          window.location.href = `https://wa.me/${adminPhone}?text=${message}`;
        }, 2000);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center" id="zoom">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Pendaftaran Berhasil!
        </h3>
        <p className="text-gray-600 mb-6">
          Terima kasih telah mendaftar. Anda akan diarahkan ke WhatsApp admin...
        </p>
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8" id="zoom">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Daftar Sekarang
        </h2>
        <p className="text-gray-600">
          Isi formulir di bawah untuk mengikuti sosialisasi program
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sapaan */}
        <div>
          <label
            htmlFor="sapaan"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Sapaan
          </label>
          <select
            id="sapaan"
            name="sapaan"
            required
            value={formData.sapaan}
            onChange={handleChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          >
            <option value="Bapak">Bapak</option>
            <option value="Ibu">Ibu</option>
            <option value="Saudara">Saudara</option>
            <option value="Saudari">Saudari</option>
          </select>
        </div>

        {/* Nama */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Nama Lengkap
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="name"
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Masukkan nama lengkap Anda"
            />
          </div>
        </div>

        {/* Kota */}
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Kota
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="city"
              type="text"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Contoh: Jakarta, Bandung, Surabaya"
            />
          </div>
        </div>

        {/* Profesi */}
        <div>
          <label
            htmlFor="profession"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Profesi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Briefcase className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="profession"
              type="text"
              name="profession"
              required
              value={formData.profession}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Contoh: Wiraswasta, Guru, Mahasiswa"
            />
          </div>
        </div>

        {/* No WA */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            No WhatsApp Aktif
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="phone"
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="08123456789 atau +6281234567890"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Gunakan nomor yang terdaftar di WhatsApp
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Mendaftar...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Daftar & Lanjutkan ke WhatsApp</span>
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Dengan mendaftar, Anda menyetujui untuk menerima notifikasi via
          WhatsApp terkait program ini
        </p>
      </form>
    </div>
  );
}
