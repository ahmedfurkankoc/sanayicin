"use client";

import React, { useState } from "react";
import Banner from "@/app/components/public/Banner";
import { iconMapping } from "../../../utils/iconMapping";
import SupportTicketCTA from "@/app/components/public/SupportTicketCTA";

export default function MusteriYardimPage() {
  const faqCategories = [
    {
      title: "Arama ve Usta Bulma",
      icon: "search",
      faqs: [
        { q: "Nasıl usta bulurum?", a: "Anasayfadaki arama bölümünden ihtiyacın olan hizmeti ve konumu seçerek arama yapabilirsin. Sonuçlardan profilleri inceleyip teklif isteyebilirsin." },
        { q: "Konumuma en yakın ustayı nasıl bulurum?", a: "'En Yakın' sayfasından mevcut konumuna göre önerileri görüntüleyebilirsin." },
        { q: "Usta profillerinde nelere dikkat etmeliyim?", a: "Puanlar, yorumlar, tamamlanan işler, fotoğraflar ve doğrulamalar güvenilir seçimi kolaylaştırır." },
        { q: "Hangi kategoriler mevcut?", a: "Oto bakım, tesisat, beyaz eşya, temizlik, tadilat ve daha birçok kategoride hizmet sunulmaktadır." },
      ]
    },
    {
      title: "Teklif ve Rezervasyon",
      icon: "clipboard",
      faqs: [
        { q: "Teklif nasıl isterim?", a: "İlgilendiğin usta/esnaf profiline girip 'Teklif İste' butonuna tıklayarak talebini detaylandır ve gönder." },
        { q: "Rezervasyon yapabilir miyim?", a: "Usta uygunluk sağlıyorsa profil üzerinden rezervasyon istek formunu doldurarak randevu talep edebilirsin." },
        { q: "İptal ve değişiklik kuralları nelerdir?", a: "Randevu saatinden makul süre önce iptal ve değişiklik yapılabilir. Ustanın politikaları talep detayında yer alır." },
        { q: "Hizmet garantisi var mı?", a: "Garanti, ustanın kendi garanti politikalarına göre değişir. Profilde ve teklif detayında belirtilir." },
      ]
    },
    {
      title: "Hesap ve Güvenlik",
      icon: "shield-check",
      faqs: [
        { q: "Hesap oluşturmak zorunlu mu?", a: "Teklif istemek ve mesajlaşmak için ücretsiz bir müşteri hesabı gereklidir." },
        { q: "Şifremi unuttum, ne yapmalıyım?", a: "Giriş sayfasındaki 'Şifremi Unuttum' bağlantısından e‑posta adresinle şifre sıfırlama talebi oluşturabilirsin." },
        { q: "Kişisel verilerim güvende mi?", a: "KVKK kapsamında verilerini koruyoruz. Ayrıntılar için KVKK Aydınlatma Metni ve Çerez Politikamıza göz at." },
        { q: "Bildirimleri nasıl yönetirim?", a: "Profil > Ayarlar > Bildirimler bölümünden e‑posta ve anlık bildirim tercihlerini güncelleyebilirsin." },
      ]
    },
    {
      title: "İletişim ve Değerlendirme",
      icon: "message",
      faqs: [
        { q: "Usta ile nasıl mesajlaşırım?", a: "Teklif isteği sonrasında sohbet ekranı açılır. 'Mesajlarım' üzerinden görüşmeyi sürdürebilirsin." },
        { q: "Yorum ve puanlama nasıl yapılır?", a: "Hizmet tamamlandıktan sonra sipariş/talep detayından ustayı puanlayabilir ve yorum yazabilirsin." },
        { q: "Anlaşmazlık durumunda ne yapmalıyım?", a: "Talep detayından 'Sorun Bildir' seçeneğiyle destek talebi oluştur; ekibimiz en kısa sürede yardımcı olur." },
        { q: "Destek talebi nasıl açarım?", a: "/yardim/destek sayfasından konu seç, mesajını yaz ve gerekirse dosya ekleyerek talep oluştur." },
      ]
    },
    {
      title: "Diğer Konular",
      icon: "help",
      faqs: [
        { q: "Mobil uygulama var mı?", a: "Yakında! Şimdilik web sitemiz mobil uyumludur; bildirimler tarayıcı üzerinden çalışır." },
        { q: "Esnaf olmak istiyorum, nasıl başvururum?", a: "'Hizmet Vermek' sayfasından başvuru formunu doldurup gerekli doğrulamaları tamamlayabilirsin." },
      ]
    }
  ];

  const [openFaq, setOpenFaq] = useState<{category: number, faq: number} | null>(null);

  return (
    <>
      <Banner
        title="Kullanıcı Yardım"
        description="Arama, teklif alma, rezervasyon ve hesap işlemleri"
        backgroundColor="var(--yellow)"
        textColor="var(--black)"
        breadcrumb={
          <div className="sp-breadcrumb">
            <a href="/yardim" className="sp-crumb">Yardım</a>
            <span className="sp-crumb-sep">›</span>
            <span className="sp-crumb-current">Kullanıcı Yardım</span>
          </div>
        }
      />

      <section className="help-content-section">
        <div className="container">
          <div className="howitworks-title">
            <h2 className="sectionTitle">Sık Sorulan Sorular</h2>
            <p className="sectionDescription">İhtiyacın olan bilgiyi hızlıca bulabilirsin</p>
          </div>
          
          <div className="faq-categories-grid">
            {faqCategories.map((category, categoryIdx) => (
              <div key={categoryIdx} className="faq-category-card">
                <div className="faq-category-header">
                  <div className="faq-category-title">
                    <span className="faq-category-icon">
                      {React.createElement(iconMapping[category.icon as keyof typeof iconMapping], { size: 20 })}
                    </span>
                    <span>{category.title}</span>
                  </div>
                </div>
                
                <div className="faq-category-content">
                  {category.faqs.map((faq, faqIdx) => {
                    const isOpen = openFaq?.category === categoryIdx && openFaq?.faq === faqIdx;
                    return (
                      <div key={faqIdx} className="faq-item-compact">
                        <div 
                          className="faq-question-compact"
                          onClick={() => setOpenFaq(isOpen ? null : {category: categoryIdx, faq: faqIdx})}
                        >
                          <strong>{faq.q}</strong>
                          <span className="faq-compact-arrow">
                            {React.createElement(iconMapping[isOpen ? 'chevron-up' : 'chevron-down'], { size: 16 })}
                          </span>
                        </div>
                        {isOpen && (
                          <div className="faq-answer-compact">
                            <p>{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* Support Ticket CTA */}
          <SupportTicketCTA />
        </div>
      </section>
    </>
  );
}


