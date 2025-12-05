import type { Metadata } from "next";
import HomeClient from "./components/HomeClient";

export const metadata: Metadata = {
  title: "Sanayicin - Size En Yakın Oto Sanayi Ustasını Hemen Bulun",
  description: "Türkiye'nin en büyük oto sanayi platformu. Size en yakın, güvenilir ve kaliteli otomotiv ustalarını bulun. Mekanik, elektrik, kaporta, boya ve daha fazlası için profesyonel hizmet.",
  keywords: [
    "oto sanayi", "otomotiv usta", "araba tamiri", "oto tamir", "mekanik usta", "elektrik usta", "kaporta boya", 
    "oto servis", "araba bakım", "oto sanayi usta", "en yakın usta", "güvenilir usta", "oto tamirci",
    "sanayi", "usta", "hizmet", "otomotiv", "tamir", "servis", "esnaf", "oto bakım", 
    "car repair", "mechanic", "auto service", "auto repair", "oto sanayi istanbul", "oto sanayi ankara"
  ],
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
};

export default function Home() {
  return <HomeClient />;
}
 