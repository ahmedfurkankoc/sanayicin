import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../../components/Footer";
import PolicyLayout from "../components/PolicyLayout";
import PolicySection from "../components/PolicySection";

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

