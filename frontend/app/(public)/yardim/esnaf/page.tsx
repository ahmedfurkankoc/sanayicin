"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../../components/Footer";
import React from "react";

export default function EsnafYardimPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="hero-section" style={{ background: "var(--yellow)", color: "var(--black)", padding: "40px 0 20px 0" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <h1 className="sectionTitle">Esnaf Yardım</h1>
            <p className="heroDescription" style={{ margin: 0 }}>Esnaf paneli, talepler, mesajlar, yorumlar</p>
          </div>
        </section>

        <section>
          <div className="container">
            <h2 className="sectionTitle">Sıkça Sorulanlar</h2>
            <ul>
              <li>Profilimi nasıl doğrularım?</li>
              <li>Gelen talepleri nasıl yanıtlarım?</li>
              <li>Randevuları nasıl yönetirim?</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}


