'use client';

import React from "react";
import { MusteriProvider } from "./context/MusteriContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import MusteriHeader from "./components/MusteriHeader";
import Footer from "../components/Footer";
import MobileBottomNav from "../components/MobileBottomNav";
import { Toaster } from "@/app/components/ui/sonner";
import AuthHeader from "@/app/components/AuthHeader";
import { usePathname } from "next/navigation";
import "../styles/musteri.css";

export default function MusteriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showAuthHeader = pathname?.startsWith('/musteri/giris') || pathname?.startsWith('/musteri/kayit');
  return (
    <>
      <MusteriProvider>
        <FavoritesProvider>
          <div className="musteri-layout">
            {showAuthHeader ? (
              <AuthHeader currentPage={pathname?.includes('/kayit') ? 'register' : 'login'} segment="musteri" theme="dark" />
            ) : (
              <MusteriHeader />
            )}
            <main className="musteri-main">
              {children}
            </main>
            <MobileBottomNav />
            <Footer />
          </div>
        </FavoritesProvider>
      </MusteriProvider>
      <Toaster />
    </>
  );
} 