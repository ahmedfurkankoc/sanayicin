'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Banner from "../components/Banner";
import Icon from "@/app/components/ui/Icon";
import { iconMapping } from "@/app/utils/iconMapping";

export default function HowItWorksClient() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeStep, setActiveStep] = useState<number | null>(0);

  return (
    <div className="nasil-calisir-page">
      <Banner
        title="Nasıl Çalışır?"
        description="Sanayicin'de müşteri ve esnaflar için süreçler basit, hızlı ve şeffaftır."
        backgroundColor="var(--black)"
        textColor="var(--white)"
        backgroundImageUrl="/images/banner/nasil-calisir.jpg"
      />

      {/* How it works - redesigned to match the provided reference */}
      <section className="nasil-calisir-cards-section">
        <div className="container nasil-calisir-cards-container">
          <div className="nasil-calisir-cards-grid">
            {[
              { n: 1, t: "İhtiyacını Tanımla", d: "Kısa bilgileri gir, konumunu ekle ve talebini oluştur.", img: "/images/nasil-calisir/1.png" },
              { n: 2, t: "Teklifleri Al", d: "Onaylı esnaflardan kişiselleştirilmiş teklifleri gör.", img: "/images/nasil-calisir/2.png" },
              { n: 3, t: "Karşılaştır ve Seç", d: "Fiyat, yorum ve yakınlıkla en uygun seçimi yap.", img: "/images/nasil-calisir/3.png" },
              { n: 4, t: "Randevu ve Destek", d: "Randevunuzu tamamlayın, süreç boyunca destek alın.", img: "/images/nasil-calisir/4.png" },
            ].map((c, i) => (
              <div key={i} className="nasil-calisir-card-wrapper">
                <div className="nasil-calisir-card-badge">{c.n}</div>
                <div className="nasil-calisir-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt={c.t} className="nasil-calisir-card-img" />
                  <div className="nasil-calisir-card-content">
                    <h3 className="nasil-calisir-card-title">{c.t}</h3>
                    <p className="nasil-calisir-card-desc">{c.d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive How It Works Section - Modern Accordion Style */}
      <section className="nasil-calisir-accordion-section">
        <div className="container">
          <div className="nasil-calisir-accordion-grid">
            {/* Left Column - Accordion Steps */}
            <div>
              <div className="nasil-calisir-accordion-header">
                <p className="nasil-calisir-accordion-label">
                  Nasıl Çalışır
                </p>
                <h2 className="nasil-calisir-accordion-title">
                  Sanayicin Nasıl Çalışır
                </h2>
                <p className="nasil-calisir-accordion-subtitle">
                  Platformumuzu kullanarak hızlı ve kolay bir şekilde ihtiyacınız olan hizmeti bulun.
                </p>
              </div>
              
              <div className="nasil-calisir-accordion-steps">
                {/* Modern connecting line with gradient */}
                <div className="nasil-calisir-accordion-line" />
                
                {[
                  {
                    n: 1,
                    icon: "user",
                    title: "Kayıt Ol",
                    details: [
                      "Hızlı ve kolay kayıt süreci ile başlayın.",
                      "E-posta veya telefon numaranızla ücretsiz hesap oluşturun.",
                      "Kayıt sonrası e-posta doğrulaması ile hesabınızı aktifleştirin."
                    ]
                  },
                  {
                    n: 2,
                    icon: "edit",
                    title: "Profilini Özelleştir",
                    details: [
                      "Kişisel bilgilerini ve tercihlerini ekle.",
                      "Profil fotoğrafı ve iletişim bilgilerini güncelle.",
                      "Araç bilgilerini kaydederek hızlı talep oluştur."
                    ]
                  },
                  {
                    n: 3,
                    icon: "search",
                    title: "Hizmet Ara ve Talep Oluştur",
                    details: [
                      "İhtiyacını belirle ve hızlıca talep oluştur.",
                      "Hizmet türünü seç, konumunu belirt ve detayları ekle.",
                      "Fotoğraf veya video ekleyerek daha detaylı bilgi ver."
                    ]
                  },
                  {
                    n: 4,
                    icon: "help",
                    title: "Destek Al",
                    details: [
                      "7/24 müşteri desteği ile yardım al.",
                      "Canlı sohbet veya destek talebi oluşturarak iletişime geç.",
                      "Sık sorulan sorular ve çözüm rehberlerinden faydalan."
                    ]
                  }
                ].map((step, idx) => {
                  const isActive = activeStep !== null && activeStep === idx;
                  const StepIcon = iconMapping[step.icon as keyof typeof iconMapping] as any;
                  return (
                    <div 
                      key={idx} 
                      className={`nasil-calisir-step-item ${isActive ? 'active' : ''}`}
                    >
                      <div className="nasil-calisir-step-wrapper">
                        {/* Modern Step Badge with Icon */}
                        <div className={`nasil-calisir-step-badge ${isActive ? 'active' : ''}`}>
                          {StepIcon ? (
                            <StepIcon size={24} color={isActive ? "#111" : "#9ca3af"} />
                          ) : (
                            <span>{step.n}</span>
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="nasil-calisir-step-content">
                          <button
                            onClick={() => setActiveStep(isActive ? null : idx)}
                            className="nasil-calisir-step-button"
                          >
                            <h3 className="nasil-calisir-step-title">
                              {step.title}
                            </h3>
                            <span className="nasil-calisir-step-arrow">
                              ▼
                            </span>
                          </button>
                          
                          {/* Expanded Details with Animation */}
                          <div className="nasil-calisir-step-details">
                            <div className="nasil-calisir-step-details-inner">
                              <ul className="nasil-calisir-step-details-list">
                                {step.details.map((detail, dIdx) => (
                                  <li 
                                    key={dIdx} 
                                    className="nasil-calisir-step-detail-item"
                                  >
                                    <span className="nasil-calisir-step-detail-check">
                                      ✓
                                    </span>
                                    <span className="nasil-calisir-step-detail-text">
                                      {detail}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>

            {/* Right Column - Enhanced Visual Content */}
            <div className="nasil-calisir-visual-column">
              <div className="nasil-calisir-visual-wrapper">
                {/* Gradient Overlay */}
                <div className="nasil-calisir-visual-overlay" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/nasil-calisir/sanayicin-musteri-panel.png"
                  alt="Sanayicin Müşteri Paneli"
                  className="nasil-calisir-visual-img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video walkthrough */}
      <section className="nasil-calisir-video-section">
        <div className="container nasil-calisir-video-grid">
          <div>
            <h2 className="nasil-calisir-video-title">Kısa bir tur</h2>
            <p className="nasil-calisir-video-desc">Platformda bir talep oluşturmanın ve teklif almanın ne kadar kolay olduğunu görün. Bu video, süreçteki temel adımları 60 saniyeden kısa sürede gösterir.</p>
          </div>
          <div className="nasil-calisir-video-wrapper">
            <video src="/nasil-calisir.mp4" controls className="nasil-calisir-video" autoPlay muted playsInline loop/>
          </div>
        </div>
      </section>

      {/* FAQ - Using help page styles */}
      <section className="help-faq-section">
        <div className="container">
          <div>
            <div className="faq-header">
              <h2 className="faq-main-title">Merak edilen sorular?</h2>
              <p className="faq-subtitle">En çok sorduğun konuları bir araya topladık. 😇</p>
            </div>
            <div className="faq-grid">
              <div className="faq-category">
                <h3 className="faq-category-title">Genel SSS</h3>
                <div className="faq-list">
                  {[
                    { q: "Sanayicin ücretli mi?", a: "Kullanıcılar için talep oluşturmak ücretsizdir. Esnaflar için planlar ve komisyon modeli bulunur." },
                    { q: "Teklifleri nasıl karşılaştırırım?", a: "Fiyat, zaman ve yorum puanlarını birlikte görür; sohbetten detay sorabilirsiniz." },
                    { q: "Esnaf seçerken nelere dikkat etmeliyim?", a: "Yorumları, puanları, deneyim yıllarını ve yakınlık mesafesini kontrol edin. Profildeki hizmet alanları ve önceki iş örneklerini inceleyin." },
                    { q: "Nasıl hizmet bulurum?", a: "Anasayfadaki arama bölümünden ihtiyacın olan hizmeti ve konumu seçerek arama yapabilirsin." },
                    { q: "Teklif nasıl isterim?", a: "İlgilendiğin usta/esnaf profiline girip 'Teklif İste' butonuna tıklayarak talebini detaylandır." }
                  ].map((item, idx) => {
                    const isOpen = openFaq === idx;
                    const PlusIcon = iconMapping['plus'];
                    const MinusIcon = iconMapping['minus'];
                    return (
                      <div key={idx} className={`faq-item ${isOpen ? "active" : ""}`}>
                        <button
                          type="button"
                          className="faq-question"
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${idx}`}
                        >
                          <span>{item.q}</span>
                          <span className="faq-icon">
                            {isOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
                          </span>
                        </button>
                        <div id={`faq-answer-${idx}`} className="faq-answer">
                          <p>{item.a}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="faq-category">
                <h3 className="faq-category-title">Platform SSS</h3>
                <div className="faq-list">
                  {[
                    { q: "Hesap oluşturmak zorunlu mu?", a: "Teklif istemek ve mesajlaşmak için ücretsiz bir müşteri hesabı gereklidir." },
                    { q: "Usta ile nasıl mesajlaşırım?", a: "Teklif isteği sonrasında sohbet ekranı açılır. 'Mesajlarım' üzerinden görüşmeyi sürdürebilirsin." },
                    { q: "Rezervasyon yapabilir miyim?", a: "Usta uygunluk sağlıyorsa profil üzerinden rezervasyon istek formunu doldurarak randevu talep edebilirsin." },
                    { q: "Yorum yapabilir miyim?", a: "Hizmet tamamlandıktan sonra esnaf hakkında yorum ve puan verebilirsin." },
                    { q: "Favorilere ekleyebilir miyim?", a: "Evet, beğendiğin esnafları favorilerine ekleyerek daha sonra kolayca bulabilirsin." }
                  ].map((item, idx) => {
                    const isOpen = openFaq === (idx + 5);
                    const PlusIcon = iconMapping['plus'];
                    const MinusIcon = iconMapping['minus'];
                    return (
                      <div key={idx} className={`faq-item ${isOpen ? "active" : ""}`}>
                        <button
                          type="button"
                          className="faq-question"
                          onClick={() => setOpenFaq(isOpen ? null : (idx + 5))}
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${idx + 5}`}
                        >
                          <span>{item.q}</span>
                          <span className="faq-icon">
                            {isOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
                          </span>
                        </button>
                        <div id={`faq-answer-${idx + 5}`} className="faq-answer">
                          <p>{item.a}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help CTA Section */}
      <section className="help-cta-section">
        <div className="container">
          <div className="help-cta">
            <div className="help-cta-icon">
              <Icon name="alert" size={34} color="var(--black)" />
            </div>
            <div className="help-cta-content">
              <h3>Yardıma mı ihtiyacınız var?</h3>
              <p>Detaylı yardım makaleleri ve destek için <b>Yardım Sayfası</b>na gidebilirsiniz.</p>
            </div>
            <button
              type="button"
              className="help-cta-btn"
              onClick={() => {
                router.push('/yardim');
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e6c200"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--yellow)"; }}
            >
              Yardım Sayfasına Git
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
