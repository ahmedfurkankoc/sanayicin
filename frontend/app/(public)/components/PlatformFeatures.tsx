import React from "react";
import { iconMapping } from "../../utils/iconMapping";

const PlatformFeatures = () => {
  return (
    <section className="features-section">
      <div className="container">
        <h2 className="sectionTitle">Platform Özellikleri</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              {React.createElement(iconMapping.smartphone, { size: 32 })}
            </div>
            <h3>Kolay Yönetim</h3>
            <p>Mobil uygulama ve web paneli ile işlerinizi kolayca yönetin</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              {React.createElement(iconMapping['bar-chart'], { size: 32 })}
            </div>
            <h3>Detaylı Raporlar</h3>
            <p>İş performansınızı ve gelir durumunuzu takip edin</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              {React.createElement(iconMapping.message, { size: 32 })}
            </div>
            <h3>Anlık İletişim</h3>
            <p>Müşterilerle anında mesajlaşın ve hızlı iletişim kurun</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              {React.createElement(iconMapping.calendar, { size: 32 })}
            </div>
            <h3>Randevu Sistemi</h3>
            <p>Online randevu alma sistemi ile işlerinizi planlayın</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              {React.createElement(iconMapping.star, { size: 32 })}
            </div>
            <h3>Değerlendirme Sistemi</h3>
            <p>Müşteri yorumları ve puanları ile itibarınızı artırın</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              {React.createElement(iconMapping.help, { size: 32 })}
            </div>
            <h3>7/24 Destek</h3>
            <p>Teknik destek ekibimiz her zaman yanınızda, sorularınızı yanıtlar</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformFeatures;
