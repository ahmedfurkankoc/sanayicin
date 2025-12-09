import type { Metadata } from "next";
import "../styles/styles.css";
import { Toaster } from "@/app/components/ui/sonner";
import Navbar from "@/app/components/public/Navbar";
import Footer from "@/app/components/Footer";
import MobileBottomNav from "@/app/components/MobileBottomNav";

export const metadata: Metadata = {
  title: {
    template: "%s | Sanayicin",
    default: "Sanayicin - Size En Yakın Oto Sanayi Ustasını Hemen Bulun",
  },
  description: "Türkiye'nin en büyük oto sanayi platformu. Size en yakın, güvenilir ve kaliteli otomotiv ustalarını bulun. Mekanik, elektrik, kaporta, boya ve daha fazlası için profesyonel hizmet.",
  keywords: [
    "oto sanayi", "otomotiv usta", "araba tamiri", "oto tamir", "mekanik usta", "elektrik usta", "kaporta boya", 
    "oto servis", "araba bakım", "oto sanayi usta", "en yakın usta", "güvenilir usta", "oto tamirci",
    "sanayi", "usta", "hizmet", "otomotiv", "tamir", "servis", "esnaf", "oto bakım", 
    "car repair", "mechanic", "auto service", "auto repair", "oto sanayi istanbul", "oto sanayi ankara"
  ],
  metadataBase: new URL('https://sanayicin.com'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Sanayicin - Size En Yakın Oto Sanayi Ustasını Hemen Bulun",
    description: "Türkiye'nin en büyük oto sanayi platformu. Size en yakın, güvenilir ve kaliteli otomotiv ustalarını bulun.",
    url: "https://sanayicin.com",
    siteName: "Sanayicin",
    images: [
      {
        url: "/sanayicin-logo.png",
        width: 1200,
        height: 630,
        alt: "Sanayicin - Oto Sanayi Platformu",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanayicin - Size En Yakın Oto Sanayi Ustasını Hemen Bulun",
    description: "Türkiye'nin en büyük oto sanayi platformu. Size en yakın, güvenilir ve kaliteli otomotiv ustalarını bulun.",
    images: ["/sanayicin-logo.png"],
  },
  alternates: {
    canonical: "https://sanayicin.com",
  },
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
    charset: "utf-8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <div className="public-layout">
        {children}
      </div>
      <Footer />
      <MobileBottomNav />
      <Toaster />
    </>
  );
}
 