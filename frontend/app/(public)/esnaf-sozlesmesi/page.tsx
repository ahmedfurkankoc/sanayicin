import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../../components/Footer";
import PolicyLayout from "../components/PolicyLayout";
import PolicySection from "../components/PolicySection";

function EsnafSozlesmesiPage() {
  const updatedAt = new Date().toLocaleDateString('tr-TR');
  return (
    <>
      <PolicyLayout title="Esnaf Sözleşmesi" updatedAt={updatedAt}>
        <PolicySection heading="1. Taraflar ve Kapsam">
          <p>Bu sözleşme, Sanayicin platformunda hizmet veren esnaf ile Sanayicin arasındadır.</p>
        </PolicySection>
        <PolicySection heading="2. Hizmet Sunumu ve Doğrulama">
          <p>Esnaf, sunduğu hizmetlere ilişkin bilgi ve belgelerin doğruluğundan sorumludur.</p>
        </PolicySection>
        <PolicySection heading="3. Ücretlendirme ve Ödeme">
          <p>Ödeme süreçleri ve komisyon yapısı ayrıca bildirilecek esaslara tabidir.</p>
        </PolicySection>
        <PolicySection heading="4. Yorum ve Puanlama">
          <p>Müşteri yorumları platform kuralları dahilinde yayınlanır; manipülasyon yasaktır.</p>
        </PolicySection>
      </PolicyLayout>
    </>
  );
}

export default EsnafSozlesmesiPage;

