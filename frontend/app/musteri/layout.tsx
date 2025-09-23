import React from "react";
import { MusteriProvider } from "./context/MusteriContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import MusteriHeader from "./components/MusteriHeader";
import Footer from "../components/Footer";
import MobileBottomNav from "../components/MobileBottomNav";
import { Toaster } from "@/app/components/ui/sonner";
import "../styles/musteri.css";

export default function MusteriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MusteriProvider>
        <FavoritesProvider>
          <div className="musteri-layout">
            <MusteriHeader />
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