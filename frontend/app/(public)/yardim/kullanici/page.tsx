"use client";

import React, { useState } from "react";
import Banner from "../../components/Banner";
import { iconMapping } from "../../../utils/iconMapping";

export default function MusteriYardimPage() {
  const faqs = [
    { q: "Nasıl usta bulurum?", a: "Anasayfadaki arama bölümünden ihtiyacın olan hizmeti ve konumu seçerek arama yapabilirsin. Sonuçlardan profilleri inceleyip teklif isteyebilirsin." },
    { q: "Teklif nasıl isterim?", a: "İlgilendiğin usta/esnaf profiline girip 'Teklif İste' butonuna tıklayarak talebini detaylandır ve gönder." },
    { q: "Rezervasyon yapabilir miyim?", a: "Usta uygunluk sağlıyorsa profil üzerinden rezervasyon istek formunu doldurarak randevu talep edebilirsin." },
    { q: "Hesap oluşturmak zorunlu mu?", a: "Teklif istemek ve mesajlaşmak için ücretsiz bir müşteri hesabı gereklidir." },
    { q: "Şifremi unuttum, ne yapmalıyım?", a: "Giriş sayfasındaki 'Şifremi Unuttum' bağlantısından e‑posta adresinle şifre sıfırlama talebi oluşturabilirsin." },
    { q: "Usta ile nasıl mesajlaşırım?", a: "Teklif isteği sonrasında sohbet ekranı açılır. 'Mesajlarım' üzerinden görüşmeyi sürdürebilirsin." },
    { q: "Yorum ve puanlama nasıl yapılır?", a: "Hizmet tamamlandıktan sonra sipariş/talep detayından ustayı puanlayabilir ve yorum yazabilirsin." },
    { q: "İptal ve değişiklik kuralları nelerdir?", a: "Randevu saatinden makul süre önce iptal ve değişiklik yapılabilir. Ustanın politikaları talep detayında yer alır." },
    { q: "Hizmet garantisi var mı?", a: "Garanti, ustanın kendi garanti politikalarına göre değişir. Profilde ve teklif detayında belirtilir." },
    { q: "Anlaşmazlık durumunda ne yapmalıyım?", a: "Talep detayından 'Sorun Bildir' seçeneğiyle destek talebi oluştur; ekibimiz en kısa sürede yardımcı olur." },
    { q: "Usta profillerinde nelere dikkat etmeliyim?", a: "Puanlar, yorumlar, tamamlanan işler, fotoğraflar ve doğrulamalar güvenilir seçimi kolaylaştırır." },
    { q: "Konumuma en yakın ustayı nasıl bulurum?", a: "'En Yakın' sayfasından mevcut konumuna göre önerileri görüntüleyebilirsin." },
    { q: "Mobil uygulama var mı?", a: "Yakında! Şimdilik web sitemiz mobil uyumludur; bildirimler tarayıcı üzerinden çalışır." },
    { q: "Bildirimleri nasıl yönetirim?", a: "Profil > Ayarlar > Bildirimler bölümünden e‑posta ve anlık bildirim tercihlerini güncelleyebilirsin." },
    { q: "Destek talebi nasıl açarım?", a: "/yardim/destek sayfasından konu seç, mesajını yaz ve gerekirse dosya ekleyerek talep oluştur." },
    { q: "Kişisel verilerim güvende mi?", a: "KVKK kapsamında verilerini koruyoruz. Ayrıntılar için KVKK Aydınlatma Metni ve Çerez Politikamıza göz at." },
    { q: "Esnaf olmak istiyorum, nasıl başvururum?", a: "'Hizmet Vermek' sayfasından başvuru formunu doldurup gerekli doğrulamaları tamamlayabilirsin." },
    { q: "Hangi kategoriler mevcut?", a: "Oto bakım, tesisat, beyaz eşya, temizlik, tadilat ve daha birçok kategoride hizmet sunulmaktadır." },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <Banner
        title="Kullanıcı Yardım"
        description="Arama, teklif alma, rezervasyon ve hesap işlemleri"
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


