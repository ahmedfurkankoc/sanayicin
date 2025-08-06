import React from "react";
import SearchBar from "../components/SearchBar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Icon from "@/app/components/ui/Icon";

const UstaAriyorumPage = () => {
  return (
    <>
    <Navbar />
    <div className="usta-ariyorum-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Size En Yakın Ustayı Hemen Bulun
            </h1>
            <p className="hero-description">
              Türkiye'nin her yerinden güvenilir ve kaliteli oto sanayi ustalarına kolayca ulaşın. 
              Aracınızın her türlü bakım ve onarım ihtiyacı için profesyonel çözümler.
            </p>
            <div className="hero-search">
              <SearchBar />
            </div>
          </div>
        </div>
      </section>

      {/* Hizmet Kategorileri */}
      <section className="services-section">
        <div className="container">
          <h2 className="section-title">Aracınız İçin Hangi Hizmete İhtiyacınız Var?</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">
                <Icon name="wrench" size={32} />
              </div>
              <h3>Mekanik Hizmetler</h3>
              <p>Motor, şanzıman, fren sistemi ve genel mekanik arızalar</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <Icon name="zap" size={32} />
              </div>
              <h3>Elektrik & Elektronik Hizmetleri</h3>
              <p>Araç elektrik sistemi, akü, şarj dinamosu ve elektronik arızalar</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <Icon name="palette" size={32} />
              </div>
              <h3>Kaporta ve Boya</h3>
              <p>Kaporta tamiri, boya işleri, çizik giderme ve dış görünüm</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <Icon name="sparkles" size={32} />
              </div>
              <h3>Detaylı Temizlik & Bakım</h3>
              <p>İç-dış detaylı temizlik, motor yıkama ve genel bakım</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <Icon name="car" size={32} />
              </div>
              <h3>Lastik ve Jant Hizmetleri</h3>
              <p>Lastik değişimi, balans ayarı, jant tamiri ve lastik bakımı</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <Icon name="snowflake" size={32} />
              </div>
              <h3>Klima ve Isıtma Sistemleri</h3>
              <p>Klima bakımı, gaz doldurma, ısıtma sistemi ve havalandırma</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <Icon name="shield" size={32} />
              </div>
              <h3>Cam, Anahtar ve Güvenlik</h3>
              <p>Cam değişimi, anahtar kopyalama, alarm sistemi ve güvenlik</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <Icon name="smartphone" size={32} />
              </div>
              <h3>Multimedya ve Donanım</h3>
              <p>Radyo, navigasyon, ses sistemi ve multimedya ekipmanları</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <Icon name="wrench" size={32} />
              </div>
              <h3>Yedek Parça ve Aksesuar</h3>
              <p>Orijinal yedek parça, aksesuar satışı ve montaj hizmetleri</p>
            </div>
          </div>
        </div>
      </section>

      {/* Nasıl Çalışır */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">Nasıl Çalışır?</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Hizmet Seçin</h3>
              <p>Aracınız için ihtiyacınız olan hizmeti kategorilerden seçin veya arama yapın</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Konum Belirleyin</h3>
              <p>Adresinizi girin, size en yakın oto sanayi ustalarını görelim</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Usta Seçin</h3>
              <p>Puanları, yorumları ve fiyatları karşılaştırın</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>İşi Tamamlayın</h3>
              <p>Ustanızla iletişime geçin ve aracınızın bakımını halledin</p>
            </div>
          </div>
        </div>
      </section>

      {/* Avantajlar */}
      <section className="advantages-section">
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

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Hemen Usta Bulmaya Başlayın</h2>
            <p>Binlerce güvenilir usta arasından size en uygun olanını seçin</p>
            <button className="cta-button">Usta Ara</button>
          </div>
        </div>
      </section>
    </div>
    <Footer />
    </>
  );
};

export default UstaAriyorumPage; 