"use client";

import React, { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import { iconMapping } from "@/app/utils/iconMapping";
// Navbar/Footer layout'ta render ediliyor
import { useRouter } from "next/navigation";

export default function HelpPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>

        <section className="help-section">
          <div className="container">
            {/* Konu seçimi + üstte Destek Taleplerim butonu */}
            <div className="u-flex u-align-center u-justify-between u-mb-16" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div className="help-title-section">
                <h1 className="sectionTitle help-title">Hangi konuda yardıma ihtiyacın var?</h1>
                <p className="help-title-subtitle">Sorularınızın cevaplarını bulmak için aşağıdaki kategorilerden birini seçin</p>
              </div>
              <button
                type="button"
                className="btn-dark"
                onClick={() => {
                  router.push('/yardim/destek?tab=tickets');
                }}
              >
                Destek Taleplerim
              </button>
            </div>
            <div className="help-grid u-mb-24">
              <a className="help-card help-card--wide" href="/yardim/kullanici" aria-label="Kullanıcı yardımı">
                <img className="help-card-img" src="/icons/users.svg" alt="Kullanıcı yardım görseli" />
                <div className="help-card-body">
                  <span className="help-card-title">Kullanıcı</span>
                  <span className="help-card-desc">Hesap, arama, teklif alma, rezervasyon gibi konular</span>
                </div>
              </a>
              <a className="help-card help-card--wide" href="/yardim/esnaf" aria-label="Esnaf yardımı">
                <img className="help-card-img" src="/icons/car-repair.svg" alt="Esnaf yardım görseli" />
                <div className="help-card-body">
                  <span className="help-card-title">Esnaf</span>
                  <span className="help-card-desc">Esnaf paneli, profil, mesajlar, talepler ve yorumlar</span>
                </div>
              </a>
            </div>

            {/* FAQ Bölümü */}
            <div className="help-faq-section">
              <div className="faq-header">
                <h2 className="faq-main-title">Merak edilen sorular?</h2>
                <p className="faq-subtitle">En çok sorduğun konuları bir araya topladık. 😇</p>
              </div>
              <div className="faq-grid">
                <div className="faq-category">
                  <h3 className="faq-category-title">Kullanıcı SSS</h3>
                  <div className="faq-list">
                    {[
                      { q: "Nasıl usta bulurum?", a: "Anasayfadaki arama bölümünden ihtiyacın olan hizmeti ve konumu seçerek arama yapabilirsin." },
                      { q: "Teklif nasıl isterim?", a: "İlgilendiğin usta/esnaf profiline girip 'Teklif İste' butonuna tıklayarak talebini detaylandır." },
                      { q: "Rezervasyon yapabilir miyim?", a: "Usta uygunluk sağlıyorsa profil üzerinden rezervasyon istek formunu doldurarak randevu talep edebilirsin." },
                      { q: "Hesap oluşturmak zorunlu mu?", a: "Teklif istemek ve mesajlaşmak için ücretsiz bir müşteri hesabı gereklidir." },
                      { q: "Usta ile nasıl mesajlaşırım?", a: "Teklif isteği sonrasında sohbet ekranı açılır. 'Mesajlarım' üzerinden görüşmeyi sürdürebilirsin." }
                    ].map((item, idx) => {
                      const isOpen = openIndex === idx;
                      const PlusIcon = iconMapping['plus'];
                      const MinusIcon = iconMapping['minus'];
                      return (
                        <div key={idx} className={`faq-item ${isOpen ? "active" : ""}`}>
                          <button
                            type="button"
                            className="faq-question"
                            onClick={() => setOpenIndex(isOpen ? null : idx)}
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
                  <h3 className="faq-category-title">Esnaf SSS</h3>
                  <div className="faq-list">
                    {[
                      { q: "Esnaf hesabı nasıl oluştururum?", a: "'Hizmet Vermek' sayfasından başvuru formunu doldurup gerekli belgeleri yükleyerek hesap oluşturabilirsin." },
                      { q: "Profilimi nasıl doğrularım?", a: "Kimlik belgesi, vergi levhası ve mesleki sertifikalarını yükleyerek profil doğrulamasını tamamlayabilirsin." },
                      { q: "Gelen talepleri nasıl yanıtlarım?", a: "Esnaf panelindeki 'Talepler' bölümünden gelen teklifleri görüntüleyip detaylı yanıt verebilirsin." },
                      { q: "Profilimi nasıl güncellerim?", a: "Esnaf panelindeki 'Profil Ayarları' bölümünden kişisel bilgilerini, hizmet alanlarını ve iletişim bilgilerini güncelleyebilirsin." },
                      { q: "Müşterilerle nasıl mesajlaşırım?", a: "Teklif yanıtladıktan sonra sohbet ekranı açılır. 'Mesajlarım' bölümünden tüm görüşmeleri takip edebilirsin." }
                    ].map((item, idx) => {
                      const isOpen = openIndex === (idx + 5); // Kullanıcı SSS'den sonraki indexler
                      const PlusIcon = iconMapping['plus'];
                      const MinusIcon = iconMapping['minus'];
                      return (
                        <div key={idx} className={`faq-item ${isOpen ? "active" : ""}`}>
                          <button
                            type="button"
                            className="faq-question"
                            onClick={() => setOpenIndex(isOpen ? null : (idx + 5))}
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

            {/* Avantajlar */}
            <section className="advantages-section help-advantages-section">
              <div className="container">
                <h2 className="section-title">Neden Sanayicin?</h2>
                <div className="advantages-grid">
                  <div className="advantage-card">
                    <div className="advantage-icon">
                      <Icon name="star" size={32} />
                    </div>
                    <h3>Güvenilir Oto Sanayi Ustaları</h3>
                    <p>Tüm oto sanayi ustalarımız özenle seçilir ve değerlendirilir</p>
                  </div>
                  <div className="advantage-card">
                    <div className="advantage-icon">
                      <Icon name="trending-down" size={32} />
                    </div>
                    <h3>Uygun Fiyatlar</h3>
                    <p>Rekabetçi fiyatlarla kaliteli araç bakım hizmeti alın</p>
                  </div>
                  <div className="advantage-card">
                    <div className="advantage-icon">
                      <Icon name="zap" size={32} />
                    </div>
                    <h3>Hızlı Hizmet</h3>
                    <p>En kısa sürede size en yakın oto sanayi ustasına ulaşın</p>
                  </div>
                  <div className="advantage-card">
                    <div className="advantage-icon">
                      <Icon name="shield-check" size={32} />
                    </div>
                    <h3>Güvenli Ödeme</h3>
                    <p>Araç bakımı tamamlandıktan sonra güvenle ödeme yapın</p>
                  </div>
                </div>
              </div>
            </section>


            {/* CTA */}
            <div className="u-mt-28">
                <div className="help-cta">
                  <div className="help-cta-icon">
                    <Icon name="alert" size={34} color="var(--black)"/>
                  </div>
                  <div className="help-cta-content">
                    <h3>Yardım istediğin konuyu destek makalelerimiz arasında bulamadın mı?</h3>
                    <p>O zaman destek talebi oluşturabilir ve taleplerini <b>Destek Taleplerim</b> bölümünden takip edebilirsin.</p>
                  </div>
                <button
                  type="button"
                  className="help-cta-btn"
                  onClick={() => {
                    router.push('/yardim/destek?tab=new');
                  }}
                >
                  Destek Talebi Oluştur
                </button>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}


