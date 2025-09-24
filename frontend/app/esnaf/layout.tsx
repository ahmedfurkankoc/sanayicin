import React from "react";
import Head from "next/head";
import "../styles/esnaf.css";
import { EsnafProvider } from "./context/EsnafContext";
import NotificationBell from "@/app/components/NotificationBell";
import EsnafMobileNavbar from "@/app/esnaf/components/EsnafMobileNavbar";
import { Toaster } from "@/app/components/ui/sonner";

export default function EsnafLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="theme-color" content="#1f2937" />
      </Head>
      <EsnafProvider>
        <div className="esnaf-panel-layout">
          {/* Mobile-only top navbar */}
          <div className="mobile-only" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100 }}>
            <EsnafMobileNavbar />
          </div>
          {/* Spacer for mobile navbar height */}
          <div className="mobile-only" style={{ width: '100%', height: 86 }}></div>
          <main className="esnaf-panel-main-content">{children}</main>
        </div>
      </EsnafProvider>
      <Toaster />
    </>
  );
} 