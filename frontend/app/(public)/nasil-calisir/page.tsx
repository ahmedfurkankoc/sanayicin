import type { Metadata } from "next";
import HowItWorksClient from "./HowItWorksClient";

export const metadata: Metadata = {
  title: "Sanayicin Nasıl Çalışır?",
  description: "Sanayicin platformunu nasıl kullanacağınızı öğrenin. Müşteri ve esnaf olarak platformu nasıl kullanacağınız, nasıl usta bulacağınız ve nasıl hizmet vereceğiniz hakkında detaylı bilgi.",
  keywords: [
    "nasıl çalışır", "kullanım rehberi", "sanayicin nasıl kullanılır", "platform kullanımı",
    "müşteri rehberi", "esnaf rehberi", "usta bulma", "hizmet verme"
  ],
  openGraph: {
    title: "Nasıl Çalışır? - Sanayicin Kullanım Rehberi",
    description: "Sanayicin platformunu nasıl kullanacağınızı öğrenin. Müşteri ve esnaf olarak platformu nasıl kullanacağınız hakkında detaylı bilgi.",
    url: "https://sanayicin.com/nasil-calisir",
    type: "website",
    images: [
      {
        url: "/images/banner/nasil-calisir.jpg",
        width: 1200,
        height: 630,
        alt: "Sanayicin Nasıl Çalışır",
      },
    ],
  },
  alternates: {
    canonical: "https://sanayicin.com/nasil-calisir",
  },
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}