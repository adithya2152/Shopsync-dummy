import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import "@/styles/pwa.css";
import Footer from "../components/Footer";
import ToastHandler from "../components/Toasthandler";
import PWAInstallPrompt from "../components/PWAInstallPrompt";
import OfflineIndicator from "../components/OfflineIndicator";
import PWAUpdatePrompt from "../components/PWAUpdatePrompt";
import { Suspense } from "react";

// Initialize PWA features
if (typeof window !== 'undefined') {
  import('../utils/pwaInit').then(({ initializePWA }) => {
    initializePWA();
  });
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShopSync",
  description: "Delivery under 25 minutes",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: "/icons/android-chrome-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Suspense fallback={null}>
          <ToastHandler />
        </Suspense>
        <PWAInstallPrompt />
        <OfflineIndicator />
        <PWAUpdatePrompt />
        {children}
        <Footer />
      </body>
    </html>
  );
}
