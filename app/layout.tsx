import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Gerakan Donasi 1 Juta Kacamata Medis Gratis untuk Indonesia",
  description:
    "Bersama SocialPreneur Movement Indonesia, kita bantu penderita glaukoma dan anak-anak dengan mata minus berat agar bisa kembali melihat dunia dengan jelas.",
  keywords: [
    "kacamata gratis",
    "donasi kacamata",
    "glaukoma",
    "mata minus",
    "SocialPreneur Movement",
    "Indonesia",
    "bantuan sosial",
  ],
  authors: [{ name: "SocialPreneur Movement Indonesia" }],
  openGraph: {
    title: "Gerakan Donasi 1 Juta Kacamata Medis Gratis untuk Indonesia",
    description:
      "Bersama SocialPreneur Movement Indonesia, kita bantu penderita glaukoma dan anak-anak dengan mata minus berat agar bisa kembali melihat dunia dengan jelas.",
    type: "website",
    locale: "id_ID",
    siteName: "KacamataGratis.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gerakan Donasi 1 Juta Kacamata Medis Gratis untuk Indonesia",
    description:
      "Bersama SocialPreneur Movement Indonesia, kita bantu penderita glaukoma dan anak-anak dengan mata minus berat",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
