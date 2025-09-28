"use client";

import React, { useState } from "react";
import Banner from "../../components/Banner";
import { iconMapping } from "../../../utils/iconMapping";
import SupportTicketCTA from "../../components/SupportTicketCTA";

export default function EsnafYardimPage() {
  const faqCategories = [
    {
      title: "Hesap ve Doğrulama",
      icon: "shield-check",
      faqs: [
        { q: "Esnaf hesabı nasıl oluştururum?", a: "'Hizmet Vermek' sayfasından başvuru formunu doldurup gerekli belgeleri yükleyerek hesap oluşturabilirsin. Doğrulama süreci sonrasında hesabın aktif olur." },
        { q: "Profilimi nasıl doğrularım?", a: "Kimlik belgesi, vergi levhası ve mesleki sertifikalarını yükleyerek profil doğrulamasını tamamlayabilirsin. Doğrulanmış profiller daha güvenilir görünür." },
        { q: "Hangi belgeler gereklidir?", a: "Kimlik belgesi, vergi levhası, mesleki sertifikalar ve sigorta belgeleri gerekli. Bazı kategoriler için ek belgeler istenebilir." },
        { q: "Hesabımı nasıl güvenli tutarım?", a: "Güçlü şifre kullan, iki faktörlü doğrulamayı aktifleştir, şüpheli aktiviteleri hemen bildir ve hesap bilgilerini düzenli güncelle." },
      ]
    },
    {
      title: "Talep ve Mesajlaşma",
      icon: "message",
      faqs: [
        { q: "Gelen talepleri nasıl yanıtlarım?", a: "Esnaf panelindeki 'Talepler' bölümünden gelen teklifleri görüntüleyip detaylı yanıt verebilir, fiyat teklifi sunabilirsin." },
        { q: "Müşterilerle nasıl mesajlaşırım?", a: "Teklif yanıtladıktan sonra sohbet ekranı açılır. 'Mesajlarım' bölümünden tüm görüşmeleri takip edebilirsin." },
        { q: "Randevuları nasıl yönetirim?", a: "Takvim bölümünden müsaitlik durumunu güncelleyebilir, randevuları onaylayabilir veya iptal edebilirsin." },
        { q: "İptal ve değişiklik kuralları nelerdir?", a: "Randevu saatinden makul süre önce iptal ve değişiklik yapılabilir. İptal politikalarını profilinde net şekilde belirtmelisin." },
      ]
    },
    {
      title: "Fiyatlandırma ve Garanti",
      icon: "dollar",
      faqs: [
        { q: "Fiyatlarımı nasıl belirlerim?", a: "Profil ayarlarından hizmet kategorilerine göre fiyat aralıklarını belirleyebilir, özel durumlar için özel fiyatlar sunabilirsin." },
        { q: "Malzeme maliyetlerini nasıl hesaplarım?", a: "Teklif verirken malzeme maliyetlerini ayrı olarak belirtebilir, işçilik ve malzeme bedelini net şekilde ayırabilirsin." },
        { q: "Garanti politikamı nasıl belirlerim?", a: "Profil ayarlarından hizmet kategorilerine göre garanti sürelerini belirleyebilir, garanti kapsamını detaylandırabilirsin." },
        { q: "Acil durumlar için ne yapmalıyım?", a: "Acil durumlar için özel fiyatlandırma yapabilir, 7/24 hizmet verdiğini belirtebilirsin. Müşteriye acil durum ücretini önceden bildirmelisin." },
      ]
    },
    {
      title: "Profil ve Hizmet Alanları",
      icon: "building",
      faqs: [
        { q: "Profil fotoğraflarımı nasıl güncellerim?", a: "Profil ayarlarından fotoğraf galerisini düzenleyebilir, iş yapılan yerlerin ve tamamlanan projelerin fotoğraflarını ekleyebilirsin." },
        { q: "Hizmet alanlarımı nasıl belirlerim?", a: "Profil ayarlarından hizmet verdiğin ilçeleri seçebilir, maksimum mesafe sınırını belirleyebilirsin." },
        { q: "Profilimi nasıl optimize ederim?", a: "Kaliteli fotoğraflar ekle, detaylı açıklamalar yaz, müşteri yorumlarını oku, rekabetçi fiyatlar belirle ve hızlı yanıt ver." },
        { q: "Müşteri bulma stratejileri nelerdir?", a: "Profilini tamamla, rekabetçi fiyatlar sun, hızlı yanıt ver, kaliteli hizmet ver, müşteri yorumlarını takip et ve özel teklifler sun." },
      ]
    },
    {
      title: "Değerlendirme ve İstatistikler",
      icon: "bar-chart",
      faqs: [
        { q: "Yorumları nasıl yönetirim?", a: "Müşteri yorumlarını profil sayfanda görüntüleyebilir, gerekirse yanıt verebilirsin. Olumsuz yorumlar için destek ekibimizle iletişime geçebilirsin." },
        { q: "İstatistiklerimi nasıl görüntülerim?", a: "Esnaf panelindeki 'İstatistikler' bölümünden aylık gelir, tamamlanan işler ve müşteri değerlendirmelerini takip edebilirsin." },
        { q: "Rekabet analizi nasıl yaparım?", a: "Aynı kategorideki diğer esnafların fiyatlarını, hizmet alanlarını ve müşteri değerlendirmelerini inceleyerek rekabet analizi yapabilirsin." },
        { q: "Müşteri şikayetleri nasıl çözülür?", a: "Şikayetler destek ekibimiz tarafından incelenir. Haklı olduğun durumlarda müşteriyle arabuluculuk yapılır." },
      ]
    },
    {
      title: "Diğer Konular",
      icon: "help",
      faqs: [
        { q: "Bildirimleri nasıl yönetirim?", a: "Profil > Ayarlar > Bildirimler bölümünden e-posta ve anlık bildirim tercihlerini güncelleyebilirsin." },
        { q: "Destek talebi nasıl açarım?", a: "/yardim/destek sayfasından konu seç, mesajını yaz ve gerekirse dosya ekleyerek talep oluştur." },
        { q: "Mobil uygulama ne zaman gelecek?", a: "Yakında! Şimdilik web panelimiz mobil uyumludur; bildirimler tarayıcı üzerinden çalışır." },
        { q: "Vergi ve muhasebe konularında yardım var mı?", a: "Vergi ve muhasebe konularında profesyonel danışmanlık almanı öneririz. Platform sadece hizmet eşleştirmesi yapar." },
      ]
    }
  ];

  const [openFaq, setOpenFaq] = useState<{category: number, faq: number} | null>(null);

  return (
    <>
      <Banner
        title="Esnaf Yardım"
        description="Esnaf paneli, talepler, mesajlar ve hesap yönetimi"
        backgroundColor="var(--yellow)"
        textColor="var(--black)"
        breadcrumb={
          <div className="sp-breadcrumb">
            <a href="/yardim" className="sp-crumb">Yardım</a>
            <span className="sp-crumb-sep">›</span>
            <span className="sp-crumb-current">Esnaf Yardım</span>
          </div>
        }
      />

      <section className="help-content-section">
        <div className="container">
          <div className="howitworks-title">
            <h2 className="sectionTitle">Sık Sorulan Sorular</h2>
            <p className="sectionDescription">Esnaf paneli ile ilgili tüm soruların cevapları</p>
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


