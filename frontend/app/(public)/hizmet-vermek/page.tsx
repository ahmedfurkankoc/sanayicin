import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Banner from "../components/Banner";

const HizmetVermekPage = () => {
  return (
    <>
      <Navbar />
      <div className="hizmet-vermek-page">
        <Banner
          title="Hizmet Vermek İstiyorum"
          description="Uzmanlığınızı paraya çevirin! Sanayicin platformunda esnaf olarak yer alın, daha fazla müşteriye ulaşın ve gelirinizi artırın."
        />

        {/* Neden Katılmalı */}
        <section className="why-join-section">
          <div className="container">
            <h2 className="section-title">Neden Sanayicin'e Katılmalısınız?</h2>
            <div className="reasons-grid">
              <div className="reason-item">
                <div className="reason-number">01</div>
                <div className="reason-content">
                  <h3>Daha Fazla Müşteri</h3>
                  <p>Platform sayesinde Türkiye genelinde potansiyel müşterilerinize ulaşın. Artık sadece mahallenizdeki değil, tüm şehirdeki müşteriler sizi bulabilecek.</p>
                </div>
              </div>
              
              <div className="reason-item">
                <div className="reason-number">02</div>
                <div className="reason-content">
                  <h3>Gelir Artışı</h3>
                  <p>Daha fazla iş, daha fazla kazanç. Platform üzerinden gelen müşterilerle gelirinizi %40'a kadar artırabilirsiniz.</p>
                </div>
              </div>
              
              <div className="reason-item">
                <div className="reason-number">03</div>
                <div className="reason-content">
                  <h3>Kolay Yönetim</h3>
                  <p>Mobil uygulama ve web paneli ile işlerinizi kolayca yönetin. Randevular, müşteri iletişimi ve ödemeler tek yerden.</p>
                </div>
              </div>
              
              <div className="reason-item">
                <div className="reason-number">04</div>
                <div className="reason-content">
                  <h3>Güvenilirlik</h3>
                  <p>Platform üzerinden gelen müşteriler daha güvenilir. Değerlendirme sistemi sayesinde itibarınız artar.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hizmet Alanları */}
        <section className="service-areas-section">
          <div className="container">
            <h2 className="section-title">Hangi Hizmetleri Verebilirsiniz?</h2>
            <p className="section-subtitle">Uzmanlık alanınızı seçin ve hemen başlayın</p>
            
            <div className="service-areas-grid">
              <div className="service-area-card">
                <div className="service-icon">🔧</div>
                <h3>Mekanik Hizmetler</h3>
                <p>Motor, şanzıman, fren sistemi, genel mekanik arızalar</p>
                <div className="service-tags">
                  <span className="tag">Yüksek Talep</span>
                  <span className="tag">İyi Kazanç</span>
                </div>
              </div>
              
              <div className="service-area-card">
                <div className="service-icon">⚡</div>
                <h3>Elektrik & Elektronik</h3>
                <p>Araç elektrik sistemi, akü, şarj dinamosu, elektronik arızalar</p>
                <div className="service-tags">
                  <span className="tag">Uzman Gerektirir</span>
                  <span className="tag">Yüksek Ücret</span>
                </div>
              </div>
              
              <div className="service-area-card">
                <div className="service-icon">🎨</div>
                <h3>Kaporta ve Boya</h3>
                <p>Kaporta tamiri, boya işleri, çizik giderme, dış görünüm</p>
                <div className="service-tags">
                  <span className="tag">Görsel İş</span>
                  <span className="tag">Müşteri Memnuniyeti</span>
                </div>
              </div>
              
              <div className="service-area-card">
                <div className="service-icon">🧽</div>
                <h3>Detaylı Temizlik</h3>
                <p>İç-dış detaylı temizlik, motor yıkama, genel bakım</p>
                <div className="service-tags">
                  <span className="tag">Kolay Başlangıç</span>
                  <span className="tag">Düzenli İş</span>
                </div>
              </div>
              
              <div className="service-area-card">
                <div className="service-icon">🛞</div>
                <h3>Lastik ve Jant</h3>
                <p>Lastik değişimi, balans ayarı, jant tamiri, lastik bakımı</p>
                <div className="service-tags">
                  <span className="tag">Hızlı İş</span>
                  <span className="tag">Sezonluk</span>
                </div>
              </div>
              
              <div className="service-area-card">
                <div className="service-icon">❄️</div>
                <h3>Klima Sistemleri</h3>
                <p>Klima bakımı, gaz doldurma, ısıtma sistemi, havalandırma</p>
                <div className="service-tags">
                  <span className="tag">Sezonluk</span>
                  <span className="tag">Uzman Gerektirir</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nasıl Başlarım */}
        <section className="how-to-start-section">
          <div className="container">
            <h2 className="section-title">Nasıl Başlarım?</h2>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Ücretsiz Kayıt Olun</h3>
                <p>5 dakikada hesabınızı oluşturun ve temel bilgilerinizi girin</p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Profilinizi Tamamlayın</h3>
                <p>Uzmanlık alanlarınızı, deneyiminizi ve hizmet bölgelerinizi belirtin</p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Onay Bekleyin</h3>
                <p>Başvurunuzu inceleyelim ve 24 saat içinde onaylayalım</p>
              </div>
              <div className="step-card">
                <div className="step-number">4</div>
                <h3>İş Almaya Başlayın</h3>
                <p>Müşterilerle buluşun ve ilk işinizi alın</p>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Özellikleri */}
        <section className="platform-features-section">
          <div className="container">
            <h2 className="section-title">Platform Özellikleri</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h3>Mobil Uygulama</h3>
                <p>İşlerinizi her yerden yönetin, müşterilerle anında iletişim kurun</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Detaylı Raporlar</h3>
                <p>Kazancınızı, müşteri memnuniyetini ve performansınızı takip edin</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💬</div>
                <h3>Anlık Mesajlaşma</h3>
                <p>Müşterilerle platform üzerinden güvenli iletişim kurun</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📅</div>
                <h3>Randevu Sistemi</h3>
                <p>Müşterileriniz online randevu alabilsin, işlerinizi planlayın</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⭐</div>
                <h3>Değerlendirme Sistemi</h3>
                <p>Müşteri yorumları ve puanları ile itibarınızı artırın</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🆘</div>
                <h3>7/24 Destek</h3>
                <p>Teknik destek ekibimiz her zaman yanınızda</p>
              </div>
            </div>
          </div>
        </section>

        {/* Başarı Hikayeleri */}
        <section className="success-stories-section">
          <div className="container">
            <h2 className="section-title">Başarı Hikayeleri</h2>
            <div className="stories-grid">
              <div className="story-card">
                <div className="story-avatar">👨‍🔧</div>
                <div className="story-content">
                  <h3>Mehmet Usta - Oto Servis</h3>
                  <p>"Sanayicin sayesinde aylık müşteri sayım %60 arttı. Artık daha fazla iş alıyorum ve gelirim çok daha iyi. Platform gerçekten işimi büyüttü."</p>
                  <div className="story-stats">
                    <span>3 yıldır üye</span>
                    <span>4.9 ⭐</span>
                  </div>
                </div>
              </div>
              <div className="story-card">
                <div className="story-avatar">👩‍🔧</div>
                <div className="story-content">
                  <h3>Ayşe Hanım - Kaporta & Boya</h3>
                  <p>"Platform üzerinden gelen müşteriler çok kaliteli. İşlerim düzenli hale geldi ve kazancım arttı. Artık kendi işimi yapabiliyorum."</p>
                  <div className="story-stats">
                    <span>2 yıldır üye</span>
                    <span>4.8 ⭐</span>
                  </div>
                </div>
              </div>
              <div className="story-card">
                <div className="story-avatar">👨‍🔧</div>
                <div className="story-content">
                  <h3>Ahmet Usta - Elektrik & Elektronik</h3>
                  <p>"Sanayicin ile tanıştıktan sonra işletmemi büyüttüm. Şimdi 3 kişilik ekiple çalışıyorum. Platform sayesinde işim çok gelişti."</p>
                  <div className="story-stats">
                    <span>4 yıldır üye</span>
                    <span>4.9 ⭐</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Hemen Hizmet Vermeye Başlayın</h2>
              <p>Binlerce müşteri sizi bekliyor. Ücretsiz kayıt olun ve işinizi büyütün!</p>
              <div className="cta-buttons">
                <a href="/esnaf/kayit" className="cta-button primary">Ücretsiz Kayıt Ol</a>
                <a href="/neden-esnaf" className="cta-button secondary">Daha Fazla Bilgi</a>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default HizmetVermekPage; 