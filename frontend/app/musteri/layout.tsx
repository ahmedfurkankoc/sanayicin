import type { Metadata } from "next";
import { MusteriProvider } from "./context/MusteriContext";
import MusteriHeader from "./components/MusteriHeader";
import MusteriFooter from "./components/MusteriFooter";
import "../styles/musteri.css";

export const metadata: Metadata = {
  title: "Sanayicin - Müşteri Paneli",
  description: "Sanayicin müşteri paneli - Hizmet alın, esnaf bulun",
};

export default function MusteriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MusteriProvider>
        <div className="musteri-layout">
          <MusteriHeader />
          <main className="musteri-main">
            {children}
          </main>
          <MusteriFooter />
        </div>
      </MusteriProvider>
    </>
  );
} 