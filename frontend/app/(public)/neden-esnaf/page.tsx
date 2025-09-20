import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Banner from "../components/Banner";
import PlatformFeatures from "../components/PlatformFeatures";
import SuccessStories from "../components/SuccessStories";

const NedenEsnafPage = () => {
  return (
    <>
      <Navbar />
      <div className="neden-esnaf-page">
        <Banner
          title="Neden Sanayicin'de Esnaf Olmalısınız?"
          description="Türkiye'nin en büyük otomotiv hizmet platformunda yerinizi alın. Daha fazla müşteri, daha fazla kazanç ve daha fazla başarı."
          backgroundColor="var(--yellow)"
          textColor="var(--black)"
        />

        {/* Ana Avantajlar */}
        <section className="main-advantages-section">
          <div className="container">
            <div className="advantages-header">
              <h2 className="sectionTitle">Sanayicin'in Esnaflara Sunduğu Avantajlar</h2>
              <p className="section-subtitle">Platformumuzda esnaf olarak yer alarak işinizi büyütün ve daha fazla müşteriye ulaşın</p>
            </div>
            
            <div className="advantages-content">
              <div className="advantage-item">
                <div className="advantage-number">01</div>
                <div className="advantage-text">
                  <h3>Müşteri Artışı</h3>
                  <p>Platform sayesinde daha fazla müşteriye ulaşın. Türkiye genelinde potansiyel müşterileriniz sizi kolayca bulabilecek ve işleriniz artacak.</p>
                </div>
              </div>
              
              <div className="advantage-item">
                <div className="advantage-number">02</div>
                <div className="advantage-text">
                  <h3>Gelir Artışı</h3>
                  <p>Daha fazla iş, daha fazla kazanç. Platform üzerinden gelen müşterilerle gelirinizi %40'a kadar artırın ve işletmenizi büyütün.</p>
                </div>
              </div>
              
              <div className="advantage-item">
                <div className="advantage-number">03</div>
                <div className="advantage-text">
                  <h3>Hedefli Pazarlama</h3>
                  <p>Doğru müşterilere ulaşın. Hizmet alanınıza göre filtrelenmiş, kaliteli müşteri adayları ile zaman kaybetmeden iş yapın.</p>
                </div>
              </div>
              
              <div className="advantage-item">
                <div className="advantage-number">04</div>
                <div className="advantage-text">
                  <h3>Güvenilirlik ve İtibar</h3>
                  <p>Platform üzerinden gelen müşteriler daha güvenilir. Değerlendirme sistemi sayesinde itibarınız artar ve kalıcı müşteriler kazanın.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* İstatistikler */}
        <section className="stats-section">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">10,000+</div>
                <div className="stat-label">Aktif Müşteri</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">500+</div>
                <div className="stat-label">Kayıtlı Esnaf</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">50,000+</div>
                <div className="stat-label">Tamamlanan İş</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">4.8</div>
                <div className="stat-label">Ortalama Puan</div>
              </div>
            </div>
          </div>
        </section>

        {/* Nasıl Çalışır */}
        <section className="how-it-works-section">
          <div className="container">
            <h2 className="sectionTitle">Nasıl Çalışır?</h2>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Hızlı Kayıt</h3>
                <p>5 dakikada hesabınızı oluşturun ve profil bilgilerinizi tamamlayın</p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Hizmet Alanlarınızı Belirleyin</h3>
                <p>Uzmanlık alanlarınızı ve hizmet bölgelerinizi seçin</p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Müşterilerle Buluşun</h3>
                <p>Size uygun müşteriler platform üzerinden sizinle iletişime geçsin</p>
              </div>
              <div className="step-card">
                <div className="step-number">4</div>
                <h3>Kazancınızı Artırın</h3>
                <p>Daha fazla iş alın, daha fazla kazanın ve işletmenizi büyütün</p>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Özellikleri */}
        <PlatformFeatures />

        {/* Başarı Hikayeleri */}
        <SuccessStories />

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Hemen Hizmet Vermeye Başlayın</h2>
              <p>Binlerce müşteri sizi bekliyor. Platforma katılın ve işinizi büyütün!</p>
              <div className="cta-buttons">
                <Link className="cta-button primary" href="/esnaf/kayit">Ücretsiz Kayıt Ol</Link>
                <Link className="cta-button secondary" href="/#yardim">Daha Fazla Bilgi</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default NedenEsnafPage; 