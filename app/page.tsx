"use client";

import {
  Eye,
  Heart,
  Users,
  Video,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    // Countdown timer - set to next week
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    targetDate.setHours(19, 0, 0, 0); // 7 PM

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      {/* Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-100">
        <div
          className="h-full bg-linear-to-r from-green-500 to-blue-600 transition-all duration-300"
          style={{
            width:
              typeof window !== "undefined"
                ? `${Math.min(
                    (scrollY /
                      (document.documentElement.scrollHeight -
                        window.innerHeight)) *
                      100,
                    100
                  )}%`
                : "0%",
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="KacamataGratis Logo"
              width={120}
              height={40}
              className="h-8 sm:h-10 w-auto"
              priority
            />
          </div>
          <a
            href="#zoom"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium text-sm sm:text-base transition-all duration-300 hover:shadow-lg hover:scale-105 min-h-11 flex items-center"
          >
            Ikuti Zoom Sekarang
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className={`relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight transition-all duration-1000 delay-100 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Gerakan Donasi{" "}
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              1 Juta Kacamata Medis Gratis
            </span>{" "}
            untuk Indonesia
          </h1>
          <p
            className={`text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Bersama SocialPreneur Movement Indonesia, kita bantu penderita
            glaukoma dan anak-anak dengan mata minus berat agar bisa kembali
            melihat dunia dengan jelas.
          </p>
          <p
            className={`text-base sm:text-lg text-gray-700 mb-10 font-medium transition-all duration-1000 delay-300 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Bergabunglah dalam gerakan sosial yang nyata, berdampak, dan
            berkelanjutan.
          </p>

          {/* Video Embed */}
          <div
            className={`relative rounded-2xl overflow-hidden shadow-2xl mb-8 bg-gray-900 aspect-video max-w-3xl mx-auto transition-all duration-500 delay-400 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/XHOmBV4js_E?start=5"
              title="Video Penjelasan Program Kacamata Gratis"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <a
            href="#zoom"
            className={`inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-500 hover:shadow-xl hover:scale-105 hover:-translate-y-1 delay-500 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Ikuti ZOOM Penjelasan Program & Cara Jadi Bagian dari Gerakan Ini
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Value Proposition - Before & After */}
      <section className="py-16 sm:py-24 bg-linear-to-br from-indigo-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Transformasi Nyata Melalui Kacamata
              </h2>
              <p className="text-lg sm:text-xl text-gray-600">
                Lihat dampak yang kami ciptakan untuk masyarakat Indonesia
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Before */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="bg-linear-to-br from-red-500 to-orange-500 p-6 text-white">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                    ❌ Sebelumnya
                  </h3>
                  <p className="text-red-100">Kondisi tanpa bantuan kacamata</p>
                </div>
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 shrink-0 mt-1"></div>
                    <p className="text-gray-700">
                      <strong>Anak-anak</strong> tidak bisa membaca papan tulis,
                      prestasi menurun drastis
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 shrink-0 mt-1"></div>
                    <p className="text-gray-700">
                      <strong>Pekerja</strong> kehilangan produktivitas dan
                      penghasilan
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 shrink-0 mt-1"></div>
                    <p className="text-gray-700">
                      <strong>Lansia</strong> terisolasi, tidak bisa melakukan
                      aktivitas sehari-hari
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 shrink-0 mt-1"></div>
                    <p className="text-gray-700">
                      Biaya kacamata mencapai{" "}
                      <strong>Rp 500.000 - 2 juta</strong> - tidak terjangkau
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 shrink-0 mt-1"></div>
                    <p className="text-gray-700">
                      Tidak ada akses ke pemeriksaan mata profesional
                    </p>
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="bg-linear-to-br from-green-500 to-emerald-500 p-6 text-white">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                    ✅ Dengan Program Kami
                  </h3>
                  <p className="text-green-100">Perubahan yang kami hadirkan</p>
                </div>
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                    <p className="text-gray-700">
                      <strong>Anak-anak</strong> bisa belajar dengan baik,
                      prestasi meningkat
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                    <p className="text-gray-700">
                      <strong>Pekerja</strong> produktif kembali, penghasilan
                      stabil
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                    <p className="text-gray-700">
                      <strong>Lansia</strong> mandiri, bisa menikmati hidup
                      dengan nyaman
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                    <p className="text-gray-700">
                      <strong>100% GRATIS</strong> - pemeriksaan + kacamata
                      medis berkualitas
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                    <p className="text-gray-700">
                      Layanan profesional oleh tenaga medis bersertifikat
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Stats */}
            <div className="mt-12 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  500+
                </div>
                <p className="text-sm sm:text-base text-gray-600">
                  Orang Terbantu
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  100%
                </div>
                <p className="text-sm sm:text-base text-gray-600">Gratis</p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  50+
                </div>
                <p className="text-sm sm:text-base text-gray-600">Kota</p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                  100+
                </div>
                <p className="text-sm sm:text-base text-gray-600">Relawan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
              Karena Jutaan Orang di Indonesia Terancam Kehilangan Penglihatan
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-6 sm:p-8 rounded-xl hover:shadow-xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto transition-all duration-500 group-hover:bg-blue-700 group-hover:rotate-12">
                  <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-500 group-hover:scale-110" />
                </div>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed text-center transition-colors duration-300 group-hover:text-gray-900">
                  Penderita glaukoma meningkat setiap tahun, banyak kehilangan
                  penglihatan karena keterbatasan biaya.
                </p>
              </div>
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-6 sm:p-8 rounded-xl hover:shadow-xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 group delay-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 rounded-full flex items-center justify-center mb-4 mx-auto transition-all duration-500 group-hover:bg-indigo-700 group-hover:rotate-12">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-500 group-hover:scale-110" />
                </div>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed text-center transition-colors duration-300 group-hover:text-gray-900">
                  Anak-anak dengan minus di atas 5 kesulitan belajar dan tumbuh
                  percaya diri.
                </p>
              </div>
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-6 sm:p-8 rounded-xl hover:shadow-xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 group delay-200">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-700 rounded-full flex items-center justify-center mb-4 mx-auto transition-all duration-500 group-hover:bg-blue-800 group-hover:rotate-12">
                  <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-500 group-hover:scale-110" />
                </div>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed text-center transition-colors duration-300 group-hover:text-gray-900">
                  SocialPreneur Movement Indonesia menghadirkan solusi sosial
                  nyata — menyediakan 1 juta kacamata medis gratis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-linear-to-br from-green-50 to-blue-50 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">
              Dampak Nyata yang Telah Kami Ciptakan
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Bersama-sama kita sudah membuat perubahan yang berarti
            </p>
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group">
                <div className="text-5xl sm:text-6xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
                  500+
                </div>
                <p className="text-gray-600 font-semibold text-lg group-hover:text-gray-900 transition-colors">
                  Orang Terbantu
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Mendapatkan kacamata medis gratis
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group">
                <div className="text-5xl sm:text-6xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                  50+
                </div>
                <p className="text-gray-600 font-semibold text-lg group-hover:text-gray-900 transition-colors">
                  Kota & Kabupaten
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Di seluruh Indonesia
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group">
                <div className="text-5xl sm:text-6xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  100+
                </div>
                <p className="text-gray-600 font-semibold text-lg group-hover:text-gray-900 transition-colors">
                  Relawan Aktif
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Menyebarkan kebaikan
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Section */}
      <section className="py-16 sm:py-24 bg-linear-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-xl order-2 lg:order-1 group">
                <Image
                  src="/galery1.jpg"
                  alt="Program Gerakan Kacamata Gratis"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors duration-500"></div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                  Program Sosial, Gerakan Nasional
                </h2>
                <p className="text-gray-700 mb-6 text-base sm:text-lg leading-relaxed">
                  Gerakan Donasi 1 Juta Kacamata Medis Gratis adalah inisiatif
                  sosial dari SocialPreneur Movement Indonesia, yang berkomitmen
                  membantu masyarakat Indonesia dengan gangguan penglihatan
                  berat.
                </p>
                <div className="space-y-4 mb-6">
                  <h3 className="font-bold text-lg sm:text-xl text-gray-900">
                    Penerima Manfaat
                  </h3>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-sm sm:text-base">
                      Anak-anak usia di bawah 16 tahun dengan mata minus di atas
                      5
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-sm sm:text-base">
                      Penderita glaukoma dari berbagai usia
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 italic text-sm sm:text-base">
                  Semua bantuan disalurkan gratis, melalui dukungan para
                  relawan, donatur, dan SocialPreneur di seluruh Indonesia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
              Satu Gerakan, Banyak Peran
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 mb-12">
              <div className="bg-linear-to-br from-blue-600 to-blue-700 p-6 sm:p-8 rounded-2xl text-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 group cursor-pointer">
                <Eye className="w-10 h-10 sm:w-12 sm:h-12 mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />
                <h3 className="text-xl sm:text-2xl font-bold mb-3">
                  Penerima Bantuan
                </h3>
                <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                  Ajukan diri atau orang yang kamu kenal untuk mendapatkan
                  kacamata medis gratis.
                </p>
              </div>
              <div className="bg-linear-to-br from-indigo-600 to-indigo-700 p-6 sm:p-8 rounded-2xl text-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 group cursor-pointer">
                <Heart className="w-10 h-10 sm:w-12 sm:h-12 mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />
                <h3 className="text-xl sm:text-2xl font-bold mb-3">
                  Donatur & Relawan
                </h3>
                <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
                  Dukung gerakan ini lewat tenaga, jaringan, atau donasi.
                </p>
              </div>
              <div className="bg-linear-to-br from-purple-600 to-purple-700 p-6 sm:p-8 rounded-2xl text-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 group cursor-pointer">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />
                <h3 className="text-xl sm:text-2xl font-bold mb-3">
                  SocialPreneur Movement
                </h3>
                <p className="text-purple-100 text-sm sm:text-base leading-relaxed">
                  Jadilah bagian dari gerakan sosial yang juga membuka peluang
                  penghasilan dan pengabdian.
                </p>
              </div>
            </div>
            <div className="text-center">
              <a
                href="#zoom"
                className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-1"
              >
                Ikuti ZOOM Penjelasan Program & Cara Bergabung
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 bg-linear-to-br from-indigo-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
              Kisah dari Mereka yang Kini Bisa Melihat Lagi
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Heart
                      key={i}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400 transition-all duration-300 group-hover:scale-110"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-sm sm:text-base leading-relaxed">
                  &ldquo;Saya penderita glaukoma, sudah lama tidak bisa membaca
                  jelas. Setelah ikut program ini, saya bisa melihat anak saya
                  lagi tanpa pusing.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    PH
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      Pak Herman
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm">58 tahun</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Heart
                      key={i}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400 transition-all duration-300 group-hover:scale-110"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-sm sm:text-base leading-relaxed">
                  &ldquo;Anak saya minus 6 dan tidak mampu beli kacamata.
                  Sekarang dia bisa sekolah lagi. Terima kasih SocialPreneur
                  Movement.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    IR
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      Ibu Rina
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm">Bekasi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="text-lg sm:text-xl text-gray-600">
                Temukan jawaban untuk pertanyaan umum tentang program kami
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  question: "Siapa yang berhak mendapatkan kacamata gratis?",
                  answer:
                    "Program ini ditujukan untuk masyarakat kurang mampu yang memiliki gangguan penglihatan (minus, plus, atau silinder). Kami melayani berbagai usia, termasuk anak-anak, dewasa, dan lansia yang membutuhkan kacamata medis tetapi terkendala biaya.",
                },
                {
                  question:
                    "Bagaimana cara mendaftar untuk mendapatkan kacamata gratis?",
                  answer:
                    "Anda dapat mengikuti acara sosial kami yang rutin diadakan di berbagai kota. Informasi jadwal dan lokasi acara akan diumumkan melalui website dan media sosial kami. Anda juga bisa mendaftar melalui Zoom meeting yang diadakan setiap minggu.",
                },
                {
                  question: "Apakah ada biaya yang harus dibayar?",
                  answer:
                    "Tidak ada biaya sama sekali. Seluruh program ini sepenuhnya gratis, termasuk pemeriksaan mata dan kacamata medis lengkap. Ini adalah program sosial yang didukung oleh donasi dan relawan.",
                },
                {
                  question: "Bagaimana cara menjadi relawan atau donatur?",
                  answer:
                    "Anda dapat bergabung sebagai relawan dengan menghubungi kami melalui kontak yang tersedia di website. Untuk donasi, Anda bisa berkontribusi dalam bentuk dana, kacamata bekas yang masih layak, atau mendukung acara sosial kami.",
                },
                {
                  question: "Berapa lama proses pembuatan kacamata?",
                  answer:
                    "Pada acara sosial, kami biasanya dapat memberikan kacamata langsung setelah pemeriksaan jika ukuran tersedia. Untuk ukuran khusus, proses pembuatan membutuhkan waktu sekitar 1-2 minggu.",
                },
                {
                  question: "Di kota mana saja program ini tersedia?",
                  answer:
                    "Kami telah melayani lebih dari 50 kota di Indonesia. Program kami bersifat mobile, jadi kami akan mengadakan acara di berbagai kota secara bergiliran. Follow media sosial kami untuk update lokasi dan jadwal terbaru.",
                },
              ].map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full text-left p-6 sm:p-8 flex justify-between items-center gap-4 hover:bg-gray-50 transition-colors duration-300 min-h-20 sm:min-h-24"
                  >
                    <span className="text-lg sm:text-xl font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-6 h-6 text-blue-600 shrink-0 transition-transform duration-300 ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === index ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <p className="px-6 sm:px-8 pb-6 sm:pb-8 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Timer */}
      <section className="py-12 sm:py-16 bg-linear-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Clock className="w-8 h-8" />
              <h3 className="text-2xl sm:text-3xl font-bold">
                Zoom Meeting Berikutnya
              </h3>
            </div>
            <p className="text-lg sm:text-xl text-green-100 mb-8">
              Bergabunglah dengan sesi informasi kami
            </p>
            <div className="grid grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                  {timeLeft.days}
                </div>
                <div className="text-sm sm:text-base text-green-100">Hari</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                  {timeLeft.hours}
                </div>
                <div className="text-sm sm:text-base text-green-100">Jam</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                  {timeLeft.minutes}
                </div>
                <div className="text-sm sm:text-base text-green-100">Menit</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                  {timeLeft.seconds}
                </div>
                <div className="text-sm sm:text-base text-green-100">Detik</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-linear-to-br from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Gerakan Donasi 1 Juta Kacamata Medis Gratis untuk Indonesia
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 leading-relaxed">
              Dengan menjadi bagian dari SocialPreneur Movement Indonesia, kamu
              ikut berperan langsung dalam gerakan sosial nasional yang membantu
              sesama sekaligus membuka peluang ekonomi berkelanjutan.
            </p>
            <p className="text-base sm:text-lg text-blue-50 mb-10 font-medium italic">
              Karena kebaikan bisa tumbuh jadi keberkahan — ketika sosial dan
              bisnis berjalan seimbang.
            </p>
            <a
              id="zoom"
              href="#"
              className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-10 py-4 rounded-full font-bold text-base sm:text-lg transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 group min-h-12 sm:min-h-14"
            >
              Daftar Sekarang untuk ikuti ZOOM Penjelasan Program
              <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-lg font-bold">www.kacamatagratis.com</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 SocialPreneur Movement Indonesia. Gerakan Sosial untuk
            Indonesia yang Lebih Baik.
          </p>
        </div>
      </footer>
    </div>
  );
}
