import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import "@/styles/pwa.css";
import Footer from "../components/Footer";
import ToastHandler from "../components/Toasthandler";
import PWAWrapper from "../components/PWAWrapper";
import NetworkStatus from "../components/NetworkStatus";
import OfflineIndicator from "../components/OfflineIndicator";
import { Suspense } from "react";

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
  description: "Developer - Adithya Bharadwaj C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="ShopSync" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ShopSync" />
        <meta name="description" content="Your One Stop Shop for All Your Shopping Needs" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#054116" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#054116" />
        
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#054116" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://shopsync.app" />
        <meta name="twitter:title" content="ShopSync" />
        <meta name="twitter:description" content="Your One Stop Shop for All Your Shopping Needs" />
        <meta name="twitter:image" content="/icons/icon-192x192.png" />
        <meta name="twitter:creator" content="@shopsync" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="ShopSync" />
        <meta property="og:description" content="Your One Stop Shop for All Your Shopping Needs" />
        <meta property="og:site_name" content="ShopSync" />
        <meta property="og:url" content="https://shopsync.app" />
        <meta property="og:image" content="/icons/icon-512x512.png" />
        
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-2048-2732.png" sizes="2048x2732" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1668-2224.png" sizes="1668x2224" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1536-2048.png" sizes="1536x2048" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1125-2436.png" sizes="1125x2436" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1242-2208.png" sizes="1242x2208" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-750-1334.png" sizes="750x1334" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-640-1136.png" sizes="640x1136" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <PWAWrapper>
          <Suspense fallback={null}>
            <ToastHandler />
            <NetworkStatus />
            <OfflineIndicator />
          </Suspense>
          {children}
          <Footer />
        </PWAWrapper>
      </body>
    </html>
  );
}
