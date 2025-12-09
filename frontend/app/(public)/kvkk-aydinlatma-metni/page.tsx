import type { Metadata } from "next";
import React from "react";
import Navbar from "@/app/components/public/Navbar";
import Footer from "@/app/components/Footer";
import PolicyLayout from "@/app/components/public/PolicyLayout";
import PolicySection from "@/app/components/public/PolicySection";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "Sanayicin KVKK aydınlatma metni. Kişisel verilerin işlenmesi, saklanması, paylaşılması ve veri güvenliği hakkında bilgi.",
  openGraph: {
    title: "KVKK Aydınlatma Metni | Sanayicin",
    description: "Sanayicin KVKK aydınlatma metni ve kişisel veri koruma politikası.",
    url: "https://sanayicin.com/kvkk-aydinlatma-metni",
    type: "website",
  },
  alternates: {
    canonical: "https://sanayicin.com/kvkk-aydinlatma-metni",
  },
};

function KvkkAydinlatmaPage() {
  return (
    <>
      <PolicyLayout title="KVKK Aydınlatma Metni">
        <PolicySection heading="1. Veri Sorumlusu">
          <p>Sanayicin, 6698 sayılı Kanun kapsamında veri sorumlusudur.</p>
        </PolicySection>
        <PolicySection heading="2. İşleme Amaçları ve Hukuki Sebepler">
          <p>Üyelik, hizmet sunumu, güvenlik ve mevzuat yükümlülükleri kapsamında; sözleşme, meşru menfaat, kanuni yükümlülük ve açık rıza.</p>
        </PolicySection>
        <PolicySection heading="3. Saklama Süreleri ve Haklar">
          <p>Kategori bazında belirlenen süreler; erişim, düzeltme, silme talepleri için başvuru kanalları.</p>
        </PolicySection>
      </PolicyLayout>
    </>
  );
}

export default KvkkAydinlatmaPage;

