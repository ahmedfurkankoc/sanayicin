import type { Metadata } from "next";
import React from "react";
import Navbar from "@/app/components/public/Navbar";
import Footer from "@/app/components/Footer";
import PolicyLayout from "@/app/components/public/PolicyLayout";
import PolicySection from "@/app/components/public/PolicySection";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "Sanayicin platform kullanım koşulları. Platform kullanımı, hesap güvenliği, kullanıcı yükümlülükleri ve hizmet şartları hakkında bilgi.",
  openGraph: {
    title: "Kullanım Koşulları | Sanayicin",
    description: "Sanayicin platform kullanım koşulları ve hizmet şartları.",
    url: "https://sanayicin.com/kullanim-kosullari",
    type: "website",
  },
  alternates: {
    canonical: "https://sanayicin.com/kullanim-kosullari",
  },
};

function KullanimKosullariPage() {
  return (
    <>
      <PolicyLayout title="Kullanım Koşulları">
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

