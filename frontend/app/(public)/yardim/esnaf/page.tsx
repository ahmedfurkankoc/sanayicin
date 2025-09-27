"use client";

import React, { useState } from "react";
import Banner from "../../components/Banner";
import { iconMapping } from "../../../utils/iconMapping";

export default function EsnafYardimPage() {
  const faqs = [
    { q: "Esnaf hesabı nasıl oluştururum?", a: "'Hizmet Vermek' sayfasından başvuru formunu doldurup gerekli belgeleri yükleyerek hesap oluşturabilirsin. Doğrulama süreci sonrasında hesabın aktif olur." },
    { q: "Profilimi nasıl doğrularım?", a: "Kimlik belgesi, vergi levhası ve mesleki sertifikalarını yükleyerek profil doğrulamasını tamamlayabilirsin. Doğrulanmış profiller daha güvenilir görünür." },
    { q: "Gelen talepleri nasıl yanıtlarım?", a: "Esnaf panelindeki 'Talepler' bölümünden gelen teklifleri görüntüleyip detaylı yanıt verebilir, fiyat teklifi sunabilirsin." },
    { q: "Randevuları nasıl yönetirim?", a: "Takvim bölümünden müsaitlik durumunu güncelleyebilir, randevuları onaylayabilir veya iptal edebilirsin." },
    { q: "Fiyatlarımı nasıl belirlerim?", a: "Profil ayarlarından hizmet kategorilerine göre fiyat aralıklarını belirleyebilir, özel durumlar için özel fiyatlar sunabilirsin." },
    { q: "Müşterilerle nasıl mesajlaşırım?", a: "Teklif yanıtladıktan sonra sohbet ekranı açılır. 'Mesajlarım' bölümünden tüm görüşmeleri takip edebilirsin." },
    { q: "Yorumları nasıl yönetirim?", a: "Müşteri yorumlarını profil sayfanda görüntüleyebilir, gerekirse yanıt verebilirsin. Olumsuz yorumlar için destek ekibimizle iletişime geçebilirsin." },
    { q: "Profil fotoğraflarımı nasıl güncellerim?", a: "Profil ayarlarından fotoğraf galerisini düzenleyebilir, iş yapılan yerlerin ve tamamlanan projelerin fotoğraflarını ekleyebilirsin." },
    { q: "Hizmet alanlarımı nasıl belirlerim?", a: "Profil ayarlarından hizmet verdiğin ilçeleri seçebilir, maksimum mesafe sınırını belirleyebilirsin." },
    { q: "Acil durumlar için ne yapmalıyım?", a: "Acil durumlar için özel fiyatlandırma yapabilir, 7/24 hizmet verdiğini belirtebilirsin. Müşteriye acil durum ücretini önceden bildirmelisin." },
    { q: "Malzeme maliyetlerini nasıl hesaplarım?", a: "Teklif verirken malzeme maliyetlerini ayrı olarak belirtebilir, işçilik ve malzeme bedelini net şekilde ayırabilirsin." },
    { q: "Garanti politikamı nasıl belirlerim?", a: "Profil ayarlarından hizmet kategorilerine göre garanti sürelerini belirleyebilir, garanti kapsamını detaylandırabilirsin." },
    { q: "Müşteri şikayetleri nasıl çözülür?", a: "Şikayetler destek ekibimiz tarafından incelenir. Haklı olduğun durumlarda müşteriyle arabuluculuk yapılır." },
    { q: "İstatistiklerimi nasıl görüntülerim?", a: "Esnaf panelindeki 'İstatistikler' bölümünden aylık gelir, tamamlanan işler ve müşteri değerlendirmelerini takip edebilirsin." },
    { q: "Bildirimleri nasıl yönetirim?", a: "Profil > Ayarlar > Bildirimler bölümünden e-posta ve anlık bildirim tercihlerini güncelleyebilirsin." },
    { q: "Hesabımı nasıl güvenli tutarım?", a: "Güçlü şifre kullan, iki faktörlü doğrulamayı aktifleştir, şüpheli aktiviteleri hemen bildir ve hesap bilgilerini düzenli güncelle." },
    { q: "Destek talebi nasıl açarım?", a: "/yardim/destek sayfasından konu seç, mesajını yaz ve gerekirse dosya ekleyerek talep oluştur." },
    { q: "Hangi belgeler gereklidir?", a: "Kimlik belgesi, vergi levhası, mesleki sertifikalar ve sigorta belgeleri gerekli. Bazı kategoriler için ek belgeler istenebilir." },
    { q: "Profilimi nasıl optimize ederim?", a: "Kaliteli fotoğraflar ekle, detaylı açıklamalar yaz, müşteri yorumlarını oku, rekabetçi fiyatlar belirle ve hızlı yanıt ver." },
    { q: "Müşteri bulma stratejileri nelerdir?", a: "Profilini tamamla, rekabetçi fiyatlar sun, hızlı yanıt ver, kaliteli hizmet ver, müşteri yorumlarını takip et ve özel teklifler sun." },
    { q: "İptal ve değişiklik kuralları nelerdir?", a: "Randevu saatinden makul süre önce iptal ve değişiklik yapılabilir. İptal politikalarını profilinde net şekilde belirtmelisin." },
    { q: "Mobil uygulama ne zaman gelecek?", a: "Yakında! Şimdilik web panelimiz mobil uyumludur; bildirimler tarayıcı üzerinden çalışır." },
    { q: "Vergi ve muhasebe konularında yardım var mı?", a: "Vergi ve muhasebe konularında profesyonel danışmanlık almanı öneririz. Platform sadece hizmet eşleştirmesi yapar." },
    { q: "Rekabet analizi nasıl yaparım?", a: "Aynı kategorideki diğer esnafların fiyatlarını, hizmet alanlarını ve müşteri değerlendirmelerini inceleyerek rekabet analizi yapabilirsin." },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <Banner
        title="Esnaf Yardım"
        description="Esnaf paneli, talepler, mesajlar ve hesap yönetimi"
        backgroundColor="var(--yellow)"
        textColor="var(--black)"
      />

      <section className="help-content-section">
        <div className="container">
          <div className="howitworks-title">
            <h2 className="sectionTitle">SSS</h2>
          </div>
          <div className="faq-accordion">
            {faqs.map((item, idx) => {
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
      </section>
    </>
  );
}


