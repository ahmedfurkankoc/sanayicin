import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../../components/Footer";
import PolicyLayout from "../components/PolicyLayout";
import PolicySection from "../components/PolicySection";

function IcerikPolitikasiPage() {
  const updatedAt = new Date().toLocaleDateString('tr-TR');
  return (
    <>
      <PolicyLayout title="İçerik Politikası" updatedAt={updatedAt}>
        <PolicySection heading="1. Kabul Edilebilir Kullanım">
          <p>Hakaret, nefret söylemi, spam, yasa dışı içerik yasaktır.</p>
        </PolicySection>
        <PolicySection heading="2. Bildirim ve Kaldırma">
          <p>Şikayet edilen içerikler incelenir; ihlal halinde içerik kaldırılabilir ve hesap yaptırımı uygulanabilir.</p>
        </PolicySection>
      </PolicyLayout>
    </>
  );
}

export default IcerikPolitikasiPage;

