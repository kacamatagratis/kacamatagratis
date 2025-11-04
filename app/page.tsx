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
  Send,
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import RegistrationForm from "@/components/RegistrationForm";
import LatestEvent from "@/components/LatestEvent";
import NewJoinerNotification from "@/components/NewJoinerNotification";
import InactivityModal from "@/components/InactivityModal";

export const dynamic = "force-dynamic";

interface Event {
  id: string;
  title: string;
  start_time: string;
  zoom_link: string;
  description: string;
}

interface LandingPageData {
  hero: {
    heading: string;
    description: string;
    youtube_url: string;
  };
  value_proposition: {
    before_title: string;
    before_items: string[];
    after_title: string;
    after_items: string[];
  };
  why_section: {
    title: string;
    items: (string | { text: string })[];
  };
  statistics: {
    stats: Array<{
      number: string;
      label: string;
      description: string;
    }>;
  };
  program: {
    content_type: "video" | "images";
    video_url?: string;
    image_urls?: string[];
    title: string;
    items: string[];
  };
  roles: {
    title: string;
    items: Array<{
      title: string;
      description: string;
      whatsapp_number: string;
      whatsapp_message: string;
    }>;
  };
  testimonials: Array<{
    id: string;
    name: string;
    location: string;
    rating: number;
    text: string;
    order: number;
  }>;
  faq: Array<{
    id: string;
    question: string;
    answer: string;
    order: number;
  }>;
  media_coverage: Array<{
    id: string;
    location: string;
    title: string;
    url: string;
    source: string;
    image_url: string;
    order: number;
  }>;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [hasEvent, setHasEvent] = useState(false);
  const [landingData, setLandingData] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralName, setReferralName] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Check for mod=simple parameter
    const mod = searchParams.get("mod");
    setIsSimpleMode(mod === "simple");

    // Handle referral code from URL or localStorage
    const ref = searchParams.get("ref");
    let activeRef = ref;

    if (ref) {
      // Save to localStorage
      localStorage.setItem("referral_code", ref);
      setReferralCode(ref);
    } else {
      // Check localStorage
      const savedRef = localStorage.getItem("referral_code");
      if (savedRef) {
        activeRef = savedRef;
        setReferralCode(savedRef);
      }
    }

    // Fetch referrer name if we have a referral code
    if (activeRef) {
      const fetchReferrerName = async () => {
        try {
          const response = await fetch(
            `/api/participants?referral_code=${activeRef}`
          );
          const data = await response.json();
          if (data.success && data.participant) {
            setReferralName(data.participant.name);
          }
        } catch (error) {
          console.error("Failed to fetch referrer name:", error);
        }
      };
      fetchReferrerName();
    }

    setIsVisible(true);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    // Fetch landing page data from API
    const fetchLandingData = async () => {
      try {
        const response = await fetch("/api/landing-page");
        const data = await response.json();
        if (data.success) {
          setLandingData(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch landing page data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch latest event to determine if countdown should show
    const fetchLatestEvent = async () => {
      try {
        const response = await fetch("/api/events/latest");
        const data = await response.json();
        if (data.success && data.event) {
          setHasEvent(true);
          const targetDate = new Date(data.event.start_time);

          const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance > 0) {
              setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor(
                  (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                ),
                minutes: Math.floor(
                  (distance % (1000 * 60 * 60)) / (1000 * 60)
                ),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
              });
            } else {
              setHasEvent(false); // Event has passed
            }
          };

          updateCountdown();
          const interval = setInterval(updateCountdown, 1000);

          return () => clearInterval(interval);
        } else {
          setHasEvent(false);
        }
      } catch (error) {
        console.error("Failed to fetch event:", error);
        setHasEvent(false);
      }
    };

    fetchLandingData();
    fetchLatestEvent();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      {/* New Joiner Notification */}
      {!isSimpleMode && <NewJoinerNotification />}

      {/* Inactivity Modal will be rendered at the end of the page so it overlays the header */}

      {/* Scroll Progress Indicator */}
      {!isSimpleMode && (
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
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Sosial Entrepreneur Indonesia"
              className="h-12 sm:h-14 lg:h-16 w-auto object-contain"
            />
          </div>
          {!isSimpleMode && (
            <a
              href="#zoom"
              className="bg-white hover:bg-gray-50 text-gray-900 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 hover:shadow-lg border border-gray-200 flex items-center gap-2"
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-blue-600 font-semibold text-xs sm:text-sm">
                  Kirim Pesan
                </span>
                <span className="text-gray-500 text-xs">
                  {referralName || "Arief Wijaya"}
                </span>
              </div>
              <Send className="w-4 h-4 text-blue-600" />
            </a>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section
        className={`relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : landingData?.hero ? (
          <div className="max-w-4xl mx-auto text-center">
            <h1
              className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-none sm:leading-15 transition-all duration-1000 delay-100 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              dangerouslySetInnerHTML={{ __html: landingData.hero.heading }}
            />
            <p
              className={`text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-200 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              {landingData.hero.description}
            </p>

            {/* Video Embed */}
            <div
              className={`relative w-full rounded-2xl overflow-hidden shadow-2xl mb-8 bg-gray-900 max-w-3xl mx-auto transition-all duration-500 delay-400 ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={landingData.hero.youtube_url}
                title="Video Penjelasan Program Kacamata Gratis"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
              Saya Ingin Ikut Gerakan Ini via Zoom
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        ) : null}
      </section>

      {/* Latest Event Section */}
      {!isSimpleMode && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <LatestEvent />
          </div>
        </section>
      )}

      {/* Countdown Timer - Only show if there's an upcoming event */}
      {!isSimpleMode && hasEvent && (
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
                  <div className="text-sm sm:text-base text-green-100">
                    Hari
                  </div>
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
                  <div className="text-sm sm:text-base text-green-100">
                    Menit
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                    {timeLeft.seconds}
                  </div>
                  <div className="text-sm sm:text-base text-green-100">
                    Detik
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Registration Form Section */}
      <section className="py-16 sm:py-24 bg-gray-50" id="zoom">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Suspense
              fallback={
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                  Loading...
                </div>
              }
            >
              <RegistrationForm />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Value Proposition - Before & After */}
      {!isSimpleMode && landingData?.value_proposition && (
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
                      ❌ {landingData.value_proposition.before_title}
                    </h3>
                    <p className="text-red-100">
                      Kondisi tanpa bantuan kacamata
                    </p>
                  </div>
                  <div className="p-6 sm:p-8 space-y-4">
                    {landingData.value_proposition.before_items.map(
                      (item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-red-100 shrink-0 mt-1"></div>
                          <p className="text-gray-700">{item}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* After */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="bg-linear-to-br from-green-500 to-emerald-500 p-6 text-white">
                    <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                      ✅ {landingData.value_proposition.after_title}
                    </h3>
                    <p className="text-green-100">
                      Perubahan yang kami hadirkan
                    </p>
                  </div>
                  <div className="p-6 sm:p-8 space-y-4">
                    {landingData.value_proposition.after_items.map(
                      (item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                          <p className="text-gray-700">{item}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why Section */}
      {!isSimpleMode && landingData?.why_section && (
        <section className="bg-white py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
                {landingData.why_section.title}
              </h2>
              <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
                {landingData.why_section.items.map((item, index) => {
                  const icons = [Eye, Users, Heart];
                  const colors = [
                    { bg: "bg-blue-600", hover: "group-hover:bg-blue-700" },
                    { bg: "bg-indigo-600", hover: "group-hover:bg-indigo-700" },
                    { bg: "bg-blue-700", hover: "group-hover:bg-blue-800" },
                  ];
                  const Icon = icons[index % icons.length];
                  const color = colors[index % colors.length];

                  return (
                    <div
                      key={index}
                      className="bg-linear-to-br from-blue-50 to-indigo-50 p-6 sm:p-8 rounded-xl hover:shadow-xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 group"
                    >
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 ${color.bg} rounded-full flex items-center justify-center mb-4 mx-auto transition-all duration-500 ${color.hover} group-hover:rotate-12`}
                      >
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-500 group-hover:scale-110" />
                      </div>
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed text-center transition-colors duration-300 group-hover:text-gray-900">
                        {typeof item === "string" ? item : item.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Statistics Section */}
      {!isSimpleMode && landingData?.statistics && (
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
                {landingData.statistics.stats.map((stat, index) => (
                  <div
                    key={index}
                    className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group"
                  >
                    <div className="text-5xl sm:text-5xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
                      {stat.number}
                    </div>
                    <p className="text-gray-600 font-semibold text-lg group-hover:text-gray-900 transition-colors">
                      {stat.label}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {stat.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Program Section */}
      {!isSimpleMode && landingData?.program && (
        <section className="py-16 sm:py-24 bg-linear-to-br from-gray-50 to-blue-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {landingData.program.content_type === "video" &&
                landingData.program.video_url ? (
                  <div
                    className="relative w-full rounded-2xl overflow-hidden shadow-xl order-2 lg:order-1 bg-gray-900"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={landingData.program.video_url}
                      title="Video Program Gerakan Kacamata Gratis"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : null}
                <div className="order-1 lg:order-2">
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                    {landingData.program.title}
                  </h2>
                  <div className="space-y-4 mb-6">
                    {landingData.program.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                        <p className="text-gray-700 text-sm sm:text-base">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Roles Section */}
      {!isSimpleMode && landingData?.roles && (
        <section className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
                {landingData.roles.title}
              </h2>
              <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 mb-12">
                {landingData.roles.items.map((role, index) => {
                  const icons = [Eye, Heart, Users];
                  const colors = [
                    "from-blue-600 to-blue-700",
                    "from-indigo-600 to-indigo-700",
                    "from-purple-600 to-purple-700",
                  ];
                  const Icon = icons[index % icons.length];
                  // Use ref param as WhatsApp number if present, else default
                  const refParam = searchParams.get("ref");
                  const whatsappNumber =
                    refParam && /^\d{8,15}$/.test(refParam)
                      ? refParam
                      : "6285212630895";
                  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(
                    /\D/g,
                    ""
                  )}?text=${encodeURIComponent(role.whatsapp_message)}`;

                  return (
                    <div
                      key={index}
                      className={`bg-linear-to-br ${
                        colors[index % colors.length]
                      } p-6 sm:p-8 rounded-2xl text-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 group cursor-pointer flex flex-col`}
                    >
                      <Icon className="w-10 h-10 sm:w-12 sm:h-12 mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />
                      <h3 className="text-xl sm:text-2xl font-bold mb-3">
                        {role.title}
                      </h3>
                      <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-6 grow">
                        {role.description}
                      </p>
                      <a
                        href="#zoom"
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById("zoom");
                          if (el)
                            el.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-4 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-blue-50 hover:shadow-lg group-hover:scale-105"
                      >
                        <span>Hubungi Kami</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  );
                })}
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
      )}

      {/* Testimonials */}
      {!isSimpleMode &&
        landingData?.testimonials &&
        landingData.testimonials.length > 0 && (
          <section className="py-16 sm:py-24 bg-linear-to-br from-indigo-50 to-blue-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
                  Kisah dari Mereka yang Kini Bisa Melihat Lagi
                </h2>
                <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                  {landingData.testimonials.map((testimonial, index) => {
                    const gradients = [
                      "from-blue-500 to-indigo-500",
                      "from-purple-500 to-pink-500",
                      "from-green-500 to-teal-500",
                      "from-orange-500 to-red-500",
                    ];
                    const initials = testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <div
                        key={testimonial.id}
                        className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Heart
                              key={i}
                              className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 group-hover:scale-110 ${
                                i < testimonial.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                              style={{ transitionDelay: `${i * 50}ms` }}
                            />
                          ))}
                        </div>
                        <p className="text-gray-700 mb-6 italic text-sm sm:text-base leading-relaxed">
                          &ldquo;{testimonial.text}&rdquo;
                        </p>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br ${
                              gradients[index % gradients.length]
                            } rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base`}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">
                              {testimonial.name}
                            </p>
                            <p className="text-gray-500 text-xs sm:text-sm">
                              {testimonial.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

      {/* FAQ Section */}
      {!isSimpleMode && landingData?.faq && landingData.faq.length > 0 && (
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
                {landingData.faq.map((faq, index) => (
                  <div
                    key={faq.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
                  >
                    <button
                      onClick={() =>
                        setOpenFaq(openFaq === index ? null : index)
                      }
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
      )}

      {/* Media Coverage Section */}
      {!isSimpleMode &&
        landingData?.media_coverage &&
        landingData.media_coverage.length > 0 && (
          <section className="py-16 sm:py-24 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12 sm:mb-16">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                    Liputan Media & Kegiatan di Seluruh Indonesia
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                    Program MGI telah tersebar di berbagai kota dan mendapat
                    liputan dari berbagai media. Berikut beberapa kegiatan yang
                    telah dilaksanakan:
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {landingData.media_coverage.map((news) => (
                    <div
                      key={news.id}
                      className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-6 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group border border-blue-100"
                    >
                      {news.image_url && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <img
                            src={news.image_url}
                            alt={news.title}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                          {news.location}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {news.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {news.source}
                      </p>
                      <a
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm group-hover:gap-3 transition-all"
                      >
                        Baca Selengkapnya
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>

                <div className="mt-12 text-center">
                  <p className="text-gray-600 text-lg mb-6">
                    <strong className="text-gray-900">50+ Kota</strong> di
                    seluruh Indonesia telah merasakan manfaat program ini
                  </p>
                  <div className="inline-flex items-center gap-2 bg-linear-to-r from-green-100 to-blue-100 px-6 py-3 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-900">
                      Program Terpercaya & Tersebar Nasional
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-lg font-bold">www.kacamatagratis.org</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 SocialPreneur Movement Indonesia. Gerakan Sosial untuk
            Indonesia yang Lebih Baik.
          </p>
        </div>
      </footer>
      {/* Inactivity Modal (render last so it overlays header) */}
      {!isSimpleMode && <InactivityModal />}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
