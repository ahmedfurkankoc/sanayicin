import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../../components/Footer";
import PolicyLayout from "../components/PolicyLayout";
import PolicySection from "../components/PolicySection";

function KullanimKosullariPage() {
  const updatedAt = new Date().toLocaleDateString('tr-TR');
  return (
    <>
      <PolicyLayout title="Kullanım Koşulları" updatedAt={updatedAt}>
        <PolicySection heading="1. Platform Kullanımı">
          <p>Kullanıcılar, yürürlükteki mevzuata ve işbu koşullara uygun davranmayı kabul eder.</p>
        </PolicySection>
        <PolicySection heading="2. Hesap Güvenliği">
          <p>Hesap erişimi ve şifre güvenliği kullanıcı sorumluluğundadır.</p>
        </PolicySection>
        <PolicySection heading="3. İçerik ve Fikri Haklar">
          <p>Kullanıcı tarafından yüklenen içeriklerden kullanıcı sorumludur; telif hakkı ihlali yasaktır.</p>
        </PolicySection>
        <PolicySection heading="4. Askıya Alma ve Sonlandırma">
          <p>Koşullara aykırılık halinde hizmetler askıya alınabilir ya da sonlandırılabilir.</p>
        </PolicySection>
      </PolicyLayout>
    </>
  );
}

export default KullanimKosullariPage;

