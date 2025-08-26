import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Banner from "../components/Banner";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <Banner
        title="İletişim"
        description="Bize ulaşmak için aşağıdaki formu doldurabilirsiniz. Size en kısa sürede dönüş yapacağız."
        backgroundColor="var(--black)"
        textColor="var(--white)"
      />
      <main className="contactPageMain">
        <section className="contactSection">
          <div className="container">
            <h1 className="contactTitle">İletişim</h1>
            <p className="contactDescription">
              Bize ulaşmak için aşağıdaki formu doldurabilirsiniz.<br />
            </p>
            <form className="contactForm">
              <div className="formGroup">
                <label htmlFor="name">Ad Soyad</label>
                <input type="text" id="name" name="name" required />
              </div>
              <div className="formGroup">
                <label htmlFor="email">E-posta</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className="formGroup">
                <label htmlFor="subject">Konu</label>
                <input type="text" id="subject" name="subject" required />
              </div>
              <div className="formGroup">
                <label htmlFor="message">Mesajınız</label>
                <textarea id="message" name="message" rows={5} required></textarea>
              </div>
              <button type="submit" className="contactSubmitBtn">Mesajı Gönder</button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
} 