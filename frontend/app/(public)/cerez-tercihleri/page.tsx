import type { Metadata } from "next";
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../../components/Footer";
import PolicyLayout from "../components/PolicyLayout";
import PolicySection from "../components/PolicySection";

export const metadata: Metadata = {
  title: "Çerez Tercihleri",
  description: "Sanayicin çerez tercihleri yönetim sayfası. Analitik ve pazarlama çerezleri için tercihlerinizi yönetin.",
  robots: {
    index: false,
    follow: true,
  },
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

