"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { User, MapPin, Briefcase, Phone, Send } from "lucide-react";

export default function RegistrationForm() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    sapaan: "Rekan",
    name: "",
    city: "",
    profession: "",
    phone: "",
    choices: [] as string[],
  });
  const [referrerPhone, setReferrerPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registrationTitle, setRegistrationTitle] = useState("DAFTAR SEKARANG");
  const [registrationIntro, setRegistrationIntro] = useState(
    "Isi formulir dibawah ini untuk ikut terlibat dalam gerakan dan mengikuti sosialisasi program"
  );

  useEffect(() => {
    // Load dynamic registration texts from general settings
    (async () => {
      try {
        const res = await fetch("/api/general-settings");
        if (res.ok) {
          const data = await res.json();
          if (data.registration_title)
            setRegistrationTitle(data.registration_title);
          if (data.registration_intro)
            setRegistrationIntro(data.registration_intro);
        }
      } catch (err) {
        // ignore and use defaults
        console.error("Failed to load registration texts:", err);
      }
    })();

    // Extract referral code from URL
    const ref = searchParams.get("ref");
    if (ref) {
      setReferrerPhone(ref);
      // Save to localStorage
      localStorage.setItem("referral_code", ref);
    } else {
      // Check localStorage if no ref in URL
      const savedRef = localStorage.getItem("referral_code");
      if (savedRef) {
        setReferrerPhone(savedRef);
      }
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

        // Clear inactivity modal flag since user registered
        localStorage.removeItem("inactivity_modal_dismissed");

        // Trigger new joiner notification to broadcast this submission
        const participantNotification = {
          id: data.id || Date.now().toString(),
          name: formData.name,
          city: formData.city,
          choices: formData.choices,
          registered_at: new Date().toISOString(),
        };
        localStorage.setItem(
          "trigger_new_joiner",
          JSON.stringify(participantNotification)
        );

        // Fetch general settings for WhatsApp redirect number and message template
        const settingsResponse = await fetch("/api/general-settings");
        const settingsData = await settingsResponse.json();

        const adminPhone = settingsData.whatsapp_redirect_number
          ? settingsData.whatsapp_redirect_number.replace(/[^0-9]/g, "") // Remove formatting
          : "6281517800900"; // Default fallback

        const messageTemplate =
          settingsData.whatsapp_message_template ||
          "Halo Admin, saya {name} dari {city} sudah mendaftar untuk mengikuti sosialisasi program Socialpreneur. Terima kasih!";

        // Prepare referrer substitution values (if any)
        let referrerName = "";
        let referrerNumber = "";
        if (referrerPhone) {
          try {
            // Normalize referral code similar to server logic: remove + and ensure country code
            const normalize = (p: string) => {
              if (!p) return p;
              let v = p.toString();
              // remove non-digits and leading +
              v = v.replace(/\D/g, "");
              if (v.startsWith("0")) {
                v = "62" + v.substring(1);
              }
              return v.replace(/^\+/, "");
            };

            const referralCode = normalize(referrerPhone);
            if (referralCode) {
              const resp = await fetch(
                `/api/participants?referral_code=${encodeURIComponent(
                  referralCode
                )}`
              );
              if (resp.ok) {
                const json = await resp.json();
                if (json.success && json.participant) {
                  referrerName = json.participant.name || "";
                  // participant.phone may be stored with +, normalize to a readable format
                  referrerNumber = (json.participant.phone || "").toString();
                }
              }
            }
          } catch (err) {
            console.error("Failed to fetch referrer info:", err);
          }
        }

        // Replace variables in template, include referrer placeholders
        let personalizedMessage = messageTemplate
          .replace("{name}", formData.name)
          .replace("{city}", formData.city)
          .replace("{referrerName}", referrerName)
          .replace("{referrerNumber}", referrerNumber);

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

  const handleChoiceChange = (choice: string) => {
    setFormData((prev) => {
      const isSelected = prev.choices.includes(choice);
      return {
        ...prev,
        choices: isSelected
          ? prev.choices.filter((c) => c !== choice)
          : [...prev.choices, choice],
      };
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
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {registrationTitle}
        </h3>
        <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
          {registrationIntro}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Pilihan (moved to top) */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <label className="block text-sm font-semibold text-blue-900 mb-3">
            Pilihan Anda (bisa pilih lebih dari 1)
          </label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.choices.includes("penerima_bantuan")}
                onChange={() => handleChoiceChange("penerima_bantuan")}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-blue-900 text-sm">
                Saya ingin mendaftar sebagai penerima bantuan
              </span>
            </label>
            <label className="flex items-start gap-3 p-3 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.choices.includes("relawan")}
                onChange={() => handleChoiceChange("relawan")}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-blue-900 text-sm">
                Saya ingin mendaftar sebagai relawan
              </span>
            </label>
            <label className="flex items-start gap-3 p-3 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.choices.includes("social_entrepreneur")}
                onChange={() => handleChoiceChange("social_entrepreneur")}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-blue-900 text-sm">
                Saya ingin mendaftar sebagai Social Entrepreneur
              </span>
            </label>
          </div>
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

        {/* (duplicate choices removed — top choices are used) */}

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
              <span>Saya Ingin Ikut Gerakan Ini via Zoom</span>
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
