import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../../components/Footer";
import PolicyLayout from "../components/PolicyLayout";
import PolicySection from "../components/PolicySection";

function CerezAydinlatmaPage() {
  const updatedAt = new Date().toLocaleDateString('tr-TR');
  return (
    <>
      <Navbar />
      <PolicyLayout title="Çerez Aydınlatma Metni" updatedAt={updatedAt}>
        <PolicySection heading="1. Çerez Türleri">
          <p>Zorunlu, performans, işlevsel ve reklam/hedefleme çerezleri.</p>
        </PolicySection>
        <PolicySection heading="2. Amaçlar ve Yönetim">
          <p>Deneyim iyileştirme, ölçümleme ve kişiselleştirme; çerez tercihleri sayfasından yönetilebilir.</p>
        </PolicySection>
      </PolicyLayout>
      <Footer />
    </>
  );
}

export default CerezAydinlatmaPage;

