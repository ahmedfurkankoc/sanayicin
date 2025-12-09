import type { Metadata } from "next";
import React from "react";
import Navbar from "@/app/components/public/Navbar";
import Footer from "@/app/components/Footer";
import PolicyLayout from "@/app/components/public/PolicyLayout";
import PolicySection from "@/app/components/public/PolicySection";

export const metadata: Metadata = {
  title: "Çerez Aydınlatma Metni",
  description: "Sanayicin çerez aydınlatma metni. Çerez türleri, kullanım amaçları ve çerez yönetimi hakkında bilgi.",
  openGraph: {
    title: "Çerez Aydınlatma Metni | Sanayicin",
    description: "Sanayicin çerez aydınlatma metni ve çerez politikası.",
    url: "https://sanayicin.com/cerez-aydinlatma-metni",
    type: "website",
  },
  alternates: {
    canonical: "https://sanayicin.com/cerez-aydinlatma-metni",
  },
};

function CerezAydinlatmaPage() {
  return (
    <>
      <PolicyLayout title="Çerez Aydınlatma Metni">
        <PolicySection heading="1. Çerez Türleri">
          <p>Zorunlu, performans, işlevsel ve reklam/hedefleme çerezleri.</p>
        </PolicySection>
        <PolicySection heading="2. Amaçlar ve Yönetim">
          <p>Deneyim iyileştirme, ölçümleme ve kişiselleştirme; çerez tercihleri sayfasından yönetilebilir.</p>
        </PolicySection>
      </PolicyLayout>
    </>
  );
}

export default CerezAydinlatmaPage;

