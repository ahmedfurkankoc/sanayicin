import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Icon from "@/app/components/ui/Icon";

const EnYakinPage = () => {
  return (
    <>
      <Navbar />
      <div className="en-yakin-page">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">
                Size En Yakın Ustaları Bulun
              </h1>
              <p className="hero-description">
                Konumunuza en yakın, güvenilir ve kaliteli ustalara anında ulaşın. 
                Hızlı, güvenli ve uygun fiyatlı hizmet alın.
              </p>
            </div>
          </div>
        </section>

        {/* Konum Seçimi */}
        <section className="location-section">
          <div className="container">
            <div className="location-content">
              <h2 className="section-title">Konumunuzu Belirleyin</h2>
              <p className="section-subtitle">Size en yakın ustaları görmek için il ve ilçe seçin</p>
              
              <div className="location-options">
                <div className="location-option">
                  <div className="option-icon">
                    <Icon name="search" size={32} />
                  </div>
                  <h3>Manuel Arama</h3>
                  <p>İl ve ilçe seçerek size en yakın ustaları bulun</p>
                  <div className="search-inputs">
                    <input type="text" placeholder="İl seçin" className="location-input" />
                    <input type="text" placeholder="İlçe seçin" className="location-input" />
                    <button className="location-btn primary">Usta Ara</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popüler Şehirler */}
        <section className="popular-cities-section">
          <div className="container">
            <h2 className="section-title">Popüler Şehirler</h2>
            <div className="cities-grid">
              <div className="city-card">
                <div className="city-icon">
                  <Icon name="building" size={32} />
                </div>
                <h3>İstanbul</h3>
                <button className="city-btn">Ustaları Gör</button>
              </div>
              <div className="city-card">
                <div className="city-icon">
                  <Icon name="landmark" size={32} />
                </div>
                <h3>Ankara</h3>
                <button className="city-btn">Ustaları Gör</button>
              </div>
              <div className="city-card">
                <div className="city-icon">
                  <Icon name="ocean" size={32} />
                </div>
                <h3>İzmir</h3>
                <button className="city-btn">Ustaları Gör</button>
              </div>
              <div className="city-card">
                <div className="city-icon">
                  <Icon name="mountain" size={32} />
                </div>
                <h3>Bursa</h3>
                <button className="city-btn">Ustaları Gör</button>
              </div>
              <div className="city-card">
                <div className="city-icon">
                  <Icon name="sunset" size={32} />
                </div>
                <h3>Antalya</h3>
                <button className="city-btn">Ustaları Gör</button>
              </div>
              <div className="city-card">
                <div className="city-icon">
                  <Icon name="factory" size={32} />
                </div>
                <h3>Adana</h3>
                <button className="city-btn">Ustaları Gör</button>
              </div>
            </div>
          </div>
        </section>

        {/* Hizmet Kategorileri */}
        <section className="services-section">
          <div className="container">
            <h2 className="section-title">Hizmet Kategorileri</h2>
            <p className="section-subtitle">İhtiyacınız olan hizmeti seçin, size en yakın ustaları bulun</p>
            
            <div className="services-grid">
              <div className="service-category">
                <div className="service-icon">
                  <Icon name="wrench" size={32} />
                </div>
                <h3>Mekanik Hizmetler</h3>
                <p>Motor, şanzıman, fren sistemi</p>
                <div className="service-stats">
                  <span>En Popüler</span>
                  <span>4.8 ⭐</span>
                </div>
              </div>
              
              <div className="service-category">
                <div className="service-icon">
                  <Icon name="zap" size={32} />
                </div>
                <h3>Elektrik & Elektronik</h3>
                <p>Araç elektrik sistemi, akü, şarj dinamosu</p>
                <div className="service-stats">
                  <span>Yüksek Talep</span>
                  <span>4.7 ⭐</span>
                </div>
              </div>
              
              <div className="service-category">
                <div className="service-icon">
                  <Icon name="palette" size={32} />
                </div>
                <h3>Kaporta ve Boya</h3>
                <p>Kaporta tamiri, boya işleri, çizik giderme</p>
                <div className="service-stats">
                  <span>Kaliteli Hizmet</span>
                  <span>4.6 ⭐</span>
                </div>
              </div>
              
              <div className="service-category">
                <div className="service-icon">
                  <Icon name="sparkles" size={32} />
                </div>
                <h3>Detaylı Temizlik</h3>
                <p>İç-dış detaylı temizlik, motor yıkama</p>
                <div className="service-stats">
                  <span>Profesyonel</span>
                  <span>4.8 ⭐</span>
                </div>
              </div>
              
              <div className="service-category">
                <div className="service-icon">
                  <Icon name="car" size={32} />
                </div>
                <h3>Lastik ve Jant</h3>
                <p>Lastik değişimi, balans ayarı, jant tamiri</p>
                <div className="service-stats">
                  <span>Hızlı Hizmet</span>
                  <span>4.7 ⭐</span>
                </div>
              </div>
              
              <div className="service-category">
                <div className="service-icon">
                  <Icon name="snowflake" size={32} />
                </div>
                <h3>Klima Sistemleri</h3>
                <p>Klima bakımı, gaz doldurma, ısıtma sistemi</p>
                <div className="service-stats">
                  <span>Uzman Kadro</span>
                  <span>4.6 ⭐</span>
                </div>
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
                <h3>Konumunuzu Belirleyin</h3>
                <p>İl ve ilçe seçerek konumunuzu belirleyin</p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Hizmet Seçin</h3>
                <p>İhtiyacınız olan hizmet kategorisini belirleyin</p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Ustaları Karşılaştırın</h3>
                <p>Mesafe, puan ve fiyatları karşılaştırın</p>
              </div>
              <div className="step-card">
                <div className="step-number">4</div>
                <h3>En Uygun Ustayı Seçin</h3>
                <p>Size en yakın ve en uygun ustayı seçin</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Hemen En Yakın Ustanızı Bulun</h2>
              <p>Size en yakın ustalara ulaşın bir tıkla güvenle ulaşın!</p>
              <div className="cta-buttons">
                <button className="cta-button primary">Usta Bul</button>
                <button className="cta-button secondary">Kayıt Ol</button>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default EnYakinPage; 