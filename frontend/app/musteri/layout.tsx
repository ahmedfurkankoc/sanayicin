import type { Metadata } from "next";
import { MusteriProvider } from "./context/MusteriContext";
import MusteriHeader from "./components/MusteriHeader";
import Footer from "../(public)/components/Footer";
import "../styles/musteri.css";

export const metadata: Metadata = {
  title: "Sanayicin - Müşteri Paneli",
  description: "Sanayicin müşteri paneli - Hizmet alın, esnaf bulun",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon.ico", sizes: "any" }
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
  other: {
    "msapplication-TileColor": "#1f2937",
    "theme-color": "#1f2937",
  },
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
          <Footer />
        </div>
      </MusteriProvider>
    </>
  );
} 