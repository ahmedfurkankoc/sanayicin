import type { Metadata } from "next";
import React from "react";
import Navbar from "@/app/components/public/Navbar";
import Footer from "@/app/components/Footer";
import PolicyLayout from "@/app/components/public/PolicyLayout";
import PolicySection from "@/app/components/public/PolicySection";

export const metadata: Metadata = {
  title: "İçerik Politikası",
  description: "Sanayicin içerik politikası. Kabul edilebilir kullanım, yasak içerikler, bildirim ve kaldırma süreçleri hakkında bilgi.",
  openGraph: {
    title: "İçerik Politikası | Sanayicin",
    description: "Sanayicin içerik politikası ve kullanım kuralları.",
    url: "https://sanayicin.com/icerik-politikasi",
    type: "website",
  },
  alternates: {
    canonical: "https://sanayicin.com/icerik-politikasi",
  },
};

function IcerikPolitikasiPage() {
  return (
    <>
      <PolicyLayout title="İçerik Politikası">
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

