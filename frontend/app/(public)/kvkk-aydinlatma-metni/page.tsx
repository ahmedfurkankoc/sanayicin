import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../../components/Footer";
import PolicyLayout from "../components/PolicyLayout";
import PolicySection from "../components/PolicySection";

function KvkkAydinlatmaPage() {
  const updatedAt = new Date().toLocaleDateString('tr-TR');
  return (
    <>
      <Navbar />
      <PolicyLayout title="KVKK Aydınlatma Metni" updatedAt={updatedAt}>
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
      <Footer />
    </>
  );
}

export default KvkkAydinlatmaPage;

