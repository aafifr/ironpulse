import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IronPulse | Personal Gym & Bulking Companion",
  description: "Aplikasi pelacak workout harian, asupan protein bulking 100g, air mineral 2.500ml, dan progres berat badan bergaya Apple minimalis.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IronPulse",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F8F9FA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#F8F9FA] text-[#1D1D1F] antialiased selection:bg-[#C5A059] selection:text-white">
        {children}
      </body>
    </html>
  );
}
