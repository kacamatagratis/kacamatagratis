// Simple script to initialize Firestore with landing page data
// Run with: node scripts/init-landing-page.js
// Make sure to set environment variables first or use: set NEXT_PUBLIC_FIREBASE_API_KEY=... && node scripts/init-landing-page.js

const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeLandingPageData() {
  try {
    console.log("Starting initialization...\n");

    // 1. Hero Section
    await setDoc(doc(db, "landing_page_settings", "hero"), {
      heading: "Gerakan Donasi 1 Juta Kacamata Medis Gratis untuk Indonesia",
      description:
        "Bersama SocialPreneur Movement Indonesia, kita bantu penderita glaukoma dan anak-anak dengan mata minus berat agar bisa kembali melihat dunia dengan jelas.",
      youtube_url: "https://www.youtube.com/embed/wBp4X27_UTA",
      updated_at: new Date().toISOString(),
    });
    console.log("✓ Hero section created");

    // 2. Value Proposition
    await setDoc(doc(db, "landing_page_settings", "value_proposition"), {
      before_title: "Sebelum",
      before_items: [
        "Penderita glaukoma meningkat setiap tahun, banyak kehilangan penglihatan karena keterbatasan biaya.",
        "Anak-anak dengan minus di atas 5 kesulitan belajar dan tumbuh percaya diri.",
        "Ribuan orang tidak mampu membeli kacamata medis berkualitas.",
        "Banyak yang terpaksa menggunakan kacamata tidak sesuai standar medis.",
        "Kualitas hidup menurun akibat gangguan penglihatan yang tidak tertangani.",
        "Produktivitas kerja terhambat karena masalah penglihatan.",
      ],
      after_title: "Sesudah",
      after_items: [
        "Ribuan penderita glaukoma mendapatkan kacamata medis gratis yang membantu memperlambat kerusakan mata.",
        "Anak-anak bisa kembali belajar dengan nyaman dan meningkat prestasi akademiknya.",
        "Masyarakat kurang mampu mendapatkan akses kacamata medis berkualitas tanpa biaya.",
        "Semua kacamata yang dibagikan memenuhi standar medis dan disesuaikan dengan kebutuhan individu.",
        "Kualitas hidup meningkat drastis - mereka bisa bekerja, belajar, dan beraktivitas dengan normal.",
        "Produktivitas meningkat, membuka peluang ekonomi yang lebih baik.",
      ],
      updated_at: new Date().toISOString(),
    });
    console.log("✓ Value proposition created");

    // 3. Why Section
    await setDoc(doc(db, "landing_page_settings", "why_section"), {
      title: "Karena Jutaan Orang di Indonesia Terancam Kehilangan Penglihatan",
      items: [
        {
          text: "Penderita glaukoma meningkat setiap tahun, banyak kehilangan penglihatan karena keterbatasan biaya.",
        },
        {
          text: "Anak-anak dengan minus di atas 5 kesulitan belajar dan tumbuh percaya diri.",
        },
        {
          text: "SocialPreneur Movement Indonesia menghadirkan solusi sosial nyata — menyediakan 1 juta kacamata medis gratis.",
        },
      ],
      updated_at: new Date().toISOString(),
    });
    console.log("✓ Why section created");

    // 4. Statistics
    await setDoc(doc(db, "landing_page_settings", "statistics"), {
      stats: [
        {
          number: "500.000+",
          label: "Orang Terbantu",
          description: "Mendapatkan kacamata medis gratis",
        },
        {
          number: "50+",
          label: "Kota & Kabupaten",
          description: "Di seluruh Indonesia",
        },
        {
          number: "300.000+",
          label: "Kacamata Terbagikan",
          description: "Sejak program dimulai",
        },
      ],
      updated_at: new Date().toISOString(),
    });
    console.log("✓ Statistics created");

    // 5. Program Section
    await setDoc(doc(db, "landing_page_settings", "program"), {
      content_type: "video",
      video_url: "https://www.youtube.com/embed/wBp4X27_UTA",
      image_urls: null,
      title: "Program Gerakan 1 Juta Kacamata Medis Gratis",
      items: [
        "Pemeriksaan mata gratis oleh optometris profesional",
        "Kacamata medis berkualitas sesuai resep dokter",
        "Prioritas untuk penderita glaukoma dan anak-anak dengan minus tinggi",
        "Didukung oleh relawan dan donatur dari seluruh Indonesia",
        "Program berkelanjutan dengan target 1 juta kacamata",
      ],
      updated_at: new Date().toISOString(),
    });
    console.log("✓ Program section created");

    // 6. Roles Section
    await setDoc(doc(db, "landing_page_settings", "roles"), {
      title: "Satu Gerakan, Banyak Peran",
      items: [
        {
          title: "Penerima Manfaat",
          description:
            "Dapatkan kacamata medis gratis jika Anda atau keluarga memiliki gangguan penglihatan dan terkendala biaya.",
          whatsapp_number: "6281234567890",
          whatsapp_message:
            "Halo, saya ingin mendaftar sebagai penerima manfaat program kacamata gratis",
        },
        {
          title: "Donatur",
          description:
            "Kontribusi Anda sangat berarti untuk membantu mereka yang membutuhkan kacamata medis.",
          whatsapp_number: "6281234567890",
          whatsapp_message:
            "Halo, saya tertarik untuk menjadi donatur program kacamata gratis",
        },
        {
          title: "Relawan",
          description:
            "Bergabunglah sebagai relawan untuk membantu pelaksanaan program di berbagai kota.",
          whatsapp_number: "6281234567890",
          whatsapp_message:
            "Halo, saya ingin menjadi relawan program kacamata gratis",
        },
      ],
      updated_at: new Date().toISOString(),
    });
    console.log("✓ Roles section created");

    // 7. Testimonials
    const testimonialsRef = collection(
      db,
      "landing_page_settings",
      "testimonials",
      "items"
    );

    await addDoc(testimonialsRef, {
      name: "Ibu Siti Aminah",
      location: "Jakarta Utara",
      rating: 5,
      text: "Terima kasih banyak! Setelah mendapat kacamata gratis ini, saya bisa kembali menjahit dan membantu ekonomi keluarga. Penglihatan saya yang tadinya kabur kini jelas kembali.",
      order: 1,
      created_at: new Date().toISOString(),
    });

    await addDoc(testimonialsRef, {
      name: "Bapak Ahmad Hidayat",
      location: "Surabaya",
      rating: 5,
      text: "Anak saya yang mengalami minus tinggi kini bisa belajar dengan nyaman. Prestasi sekolahnya meningkat pesat. Program ini benar-benar membantu keluarga kami yang kurang mampu.",
      order: 2,
      created_at: new Date().toISOString(),
    });
    console.log("✓ Testimonials created");

    // 8. FAQ
    const faqRef = collection(db, "landing_page_settings", "faq", "items");

    const faqs = [
      {
        question: "Siapa yang berhak mendapatkan kacamata gratis?",
        answer:
          "Program ini ditujukan untuk masyarakat kurang mampu yang memiliki gangguan penglihatan (minus, plus, atau silinder). Kami melayani berbagai usia, termasuk anak-anak, dewasa, dan lansia yang membutuhkan kacamata medis tetapi terkendala biaya.",
        order: 1,
      },
      {
        question: "Bagaimana cara mendaftar untuk mendapatkan kacamata gratis?",
        answer:
          "Anda dapat mengikuti acara sosial kami yang rutin diadakan di berbagai kota. Informasi jadwal dan lokasi acara akan diumumkan melalui website dan media sosial kami. Anda juga bisa mendaftar melalui Zoom meeting yang diadakan setiap minggu.",
        order: 2,
      },
      {
        question: "Apakah ada biaya yang harus dibayar?",
        answer:
          "Tidak ada biaya sama sekali. Seluruh program ini sepenuhnya gratis, termasuk pemeriksaan mata dan kacamata medis lengkap. Ini adalah program sosial yang didukung oleh donasi dan relawan.",
        order: 3,
      },
      {
        question: "Bagaimana cara menjadi relawan atau donatur?",
        answer:
          "Anda dapat bergabung sebagai relawan dengan menghubungi kami melalui kontak yang tersedia di website. Untuk donasi, Anda bisa berkontribusi dalam bentuk dana, kacamata bekas yang masih layak, atau mendukung acara sosial kami.",
        order: 4,
      },
      {
        question: "Berapa lama proses pembuatan kacamata?",
        answer:
          "Pada acara sosial, kami biasanya dapat memberikan kacamata langsung setelah pemeriksaan jika ukuran tersedia. Untuk ukuran khusus, proses pembuatan membutuhkan waktu sekitar 1-2 minggu.",
        order: 5,
      },
      {
        question: "Di kota mana saja program ini tersedia?",
        answer:
          "Kami telah melayani lebih dari 50 kota di Indonesia. Program kami bersifat mobile, jadi kami akan mengadakan acara di berbagai kota secara bergiliran. Follow media sosial kami untuk update lokasi dan jadwal terbaru.",
        order: 6,
      },
    ];

    for (const faq of faqs) {
      await addDoc(faqRef, {
        ...faq,
        created_at: new Date().toISOString(),
      });
    }
    console.log("✓ FAQ created (6 items)");

    // 9. Media Coverage (adding first batch)
    const mediaCoverageRef = collection(
      db,
      "landing_page_settings",
      "media_coverage",
      "items"
    );

    const mediaItems = [
      {
        location: "Bangka Belitung",
        title: "Camat Bakam dan PT.MGI Terus Kampanyekan Gerakan Donasi",
        url: "https://getarbabel.com/sosbud/camat-bakam-dan-pt-mgi-terus-kampanyekan-gerakan-donasi-sejuta-frame-kacamata-medis-secara-gratis/",
        source: "GetarBabel.com",
        order: 1,
      },
      {
        location: "Tuban",
        title: "Gelar Donasi Sejuta Frame Kacamata Medis Gratis",
        url: "https://tubankab.go.id/entry/mgi-gelar-donasi-sejuta-frame-kacamata-medis-secara-gratis",
        source: "TubanKab.go.id",
        order: 2,
      },
      {
        location: "Jember",
        title: "PT. MGI Gelar Gerakan Donasi Sejuta Frame Kacamata Medis",
        url: "https://filesatu.co.id/pt-mgi-gelar-gerakan-donasi-sejuta-frame-kacamata-medis-gratis-di-jember/",
        source: "FileSatu.co.id",
        order: 3,
      },
      {
        location: "Bali - Tabanan",
        title: "Donasi Sejuta Frame Kaca Mata Medis di Kantor Bupati",
        url: "https://liputanterkini.co.id/2024/11/12/donasi-sejuta-frame-kaca-mata-medis-oleh-pt-mgi/",
        source: "LiputanTerkini.co.id",
        order: 4,
      },
      {
        location: "Bengkulu",
        title: "Pemkot Gandeng MGI Salurkan Donasi Kacamata Gratis",
        url: "https://www.teropongpublik.co.id/index.php/pemkot-bengkulu-gandeng-mgi-salurkan-donasi-kacamata-gratis-untuk-warga",
        source: "TeropongPublik.co.id",
        order: 5,
      },
      {
        location: "Bone Bolango",
        title: "MGI Lanjutkan Gerakan Donasi Sejuta Frame Kacamata Medis",
        url: "https://digimedia.id/mgi-lanjutkan-gerakan-donasi-sejuta-frame-kacamata-medis-gratis-di-bone-bolango/",
        source: "DigiMedia.id",
        order: 6,
      },
      {
        location: "Sleman - Yogyakarta",
        title: "1 Juta Kacamata Gratis untuk Tekan Angka Kebutaan Dunia",
        url: "https://newsmaker.tribunnews.com/2022/07/24/1-juta-kacamata-gratis-warga-sleman-terima-frame-kacamata-gratis-untuk-tekan-angka-kebutaan-dunia",
        source: "TribunNews.com",
        order: 7,
      },
      {
        location: "Aceh Tengah",
        title: "Anggota DPRK & MGI Donasi Kacamata Gratis Untuk Anak",
        url: "https://gayo.tribunnews.com/2023/01/26/anggota-dprk-suryati-waas-mgi-donasi-kacamata-gratis-untuk-anak-di-aceh-tengah",
        source: "TribunNews Gayo",
        order: 8,
      },
      {
        location: "Pontianak",
        title: "Donasi Pembagian Satu Juta Kacamata Medis Gratis Sukses",
        url: "https://pontianak.tribunnews.com/2018/09/26/mgi-bersyukur-donasi-pembagian-satu-juta-kacamata-medis-gratis-di-pontianak-sukses",
        source: "Tribun Pontianak",
        order: 9,
      },
      {
        location: "Kabupaten Wajo",
        title: "MGI Kampanyekan Gerakan Donasi Sejuta Frame Kacamata",
        url: "https://mediabahana.com/2019/01/14/mgi-terus-kampanyekan-gerakan-donasi-sejuta-frame-kacamata-medis/",
        source: "MediaBahana.com",
        order: 10,
      },
    ];

    for (const item of mediaItems) {
      await addDoc(mediaCoverageRef, {
        ...item,
        image_url: "",
        created_at: new Date().toISOString(),
      });
    }
    console.log("✓ Media coverage created (10 items)");

    console.log("\n✅ All landing page data initialized successfully!");
    console.log("You can now use the admin panel to edit this content.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing data:", error);
    process.exit(1);
  }
}

initializeLandingPageData();
