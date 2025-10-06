'use client';

import React from "react";
import { MusteriProvider } from "./context/MusteriContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import MusteriHeader from "./components/MusteriHeader";
import Footer from "../components/Footer";
import MobileBottomNav from "../components/MobileBottomNav";
import { Toaster } from "@/app/components/ui/sonner";
import AuthHeader from "@/app/components/AuthHeader";
import { useSelectedLayoutSegments } from "next/navigation";
import "../styles/musteri.css";

export default function MusteriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const segments = useSelectedLayoutSegments();
  const firstSegment = segments?.[0] || '';
  const showAuthHeader = firstSegment === 'giris' || firstSegment === 'kayit';
  const isKayit = firstSegment === 'kayit';
  return (
    <>
      <MusteriProvider>
        <FavoritesProvider>
          <div className="musteri-layout">
            {showAuthHeader ? (
              <AuthHeader currentPage={isKayit ? 'register' : 'login'} segment="musteri" theme="dark" />
            ) : (
              <MusteriHeader />
            )}
            <main className="musteri-main">
              {children}
            </main>
            <div style={{ display: showAuthHeader ? 'none' as const : undefined }}>
              <MobileBottomNav />
            </div>
            <div style={{ display: showAuthHeader ? 'none' as const : undefined }}>
              <Footer />
            </div>
          </div>
        </FavoritesProvider>
      </MusteriProvider>
      <Toaster />
    </>
  );
} 