import type { Metadata } from "next";
import React from "react";
import Navbar from "@/app/components/public/Navbar";
import Footer from "@/app/components/Footer";
import PolicyLayout from "@/app/components/public/PolicyLayout";
import PolicySection from "@/app/components/public/PolicySection";

export const metadata: Metadata = {
  title: "Çerez Tercihleri",
  description: "Sanayicin çerez tercihleri yönetim sayfası. Analitik ve pazarlama çerezleri için tercihlerinizi yönetin.",
  openGraph: {
    title: "Çerez Tercihleri | Sanayicin",
    description: "Sanayicin çerez tercihleri yönetim sayfası.",
    url: "https://sanayicin.com/cerez-tercihleri",
    type: "website",
  },
  alternates: {
    canonical: "https://sanayicin.com/cerez-tercihleri",
  },
};

function CerezTercihleriPage() {
  return (
    <>
      <PolicyLayout title="Çerez Tercihleri">
        <PolicySection heading="1. Tercih Yönetimi">
          <p>Analitik ve pazarlama çerezleri için açık rızanızı burada yönetebilirsiniz.</p>
        </PolicySection>
      </PolicyLayout>
    </>
  );
}

export default CerezTercihleriPage;

