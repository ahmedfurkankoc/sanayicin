'use client';

import { useState } from "react";
import { iconMapping } from "@/app/utils/iconMapping";
import { useRouter } from "next/navigation";
import Icon from "@/app/components/ui/Icon";

export default function FAQSection() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqData = [
    { q: "Sanayicin ücretli mi?", a: "Kullanıcılar için talep oluşturmak ücretsizdir. Esnaflar için planlar ve komisyon modeli bulunur." },
    { q: "Teklifleri nasıl karşılaştırırım?", a: "Fiyat, zaman ve yorum puanlarını birlikte görür; sohbetten detay sorabilirsiniz." },
    { q: "Esnaf seçerken nelere dikkat etmeliyim?", a: "Yorumları, puanları, deneyim yıllarını ve yakınlık mesafesini kontrol edin. Profildeki hizmet alanları ve önceki iş örneklerini inceleyin." },
    { q: "Nasıl hizmet bulurum?", a: "Anasayfadaki arama bölümünden ihtiyacın olan hizmeti ve konumu seçerek arama yapabilirsin." },
    { q: "Teklif nasıl isterim?", a: "İlgilendiğin usta/esnaf profiline girip 'Teklif İste' butonuna tıklayarak talebini detaylandır." },
    { q: "Hesap oluşturmak zorunlu mu?", a: "Teklif istemek ve mesajlaşmak için ücretsiz bir müşteri hesabı gereklidir." },
    { q: "Usta ile nasıl mesajlaşırım?", a: "Teklif isteği sonrasında sohbet ekranı açılır. 'Mesajlarım' üzerinden görüşmeyi sürdürebilirsin." },
    { q: "Rezervasyon yapabilir miyim?", a: "Usta uygunluk sağlıyorsa profil üzerinden rezervasyon istek formunu doldurarak randevu talep edebilirsin." },
    { q: "Yorum yapabilir miyim?", a: "Hizmet tamamlandıktan sonra esnaf hakkında yorum ve puan verebilirsin." },
    { q: "Favorilere ekleyebilir miyim?", a: "Evet, beğendiğin esnafları favorilerine ekleyerek daha sonra kolayca bulabilirsin." }
  ];

  const genelFaqs = faqData.slice(0, 5);
  const platformFaqs = faqData.slice(5);

  return (
    <>
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
                  {genelFaqs.map((item, idx) => {
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
                  {platformFaqs.map((item, idx) => {
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
    </>
  );
}

