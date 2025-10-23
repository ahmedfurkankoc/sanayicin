import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../../components/Footer";
import Banner from "../components/Banner";
import PlatformFeatures from "../components/PlatformFeatures";
import SuccessStories from "../components/SuccessStories";

const NedenEsnafPage = () => {
  return (
    <>
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


        

        {/* Müşteri Kazanımı ve Bildirimler */}
        <section className="customer-acquisition-section">
          <div className="container">
            <div className="acquisition-content">
              <div className="acquisition-text">
                <h2 className="sectionTitle">Yeni Müşteri Kazanımı</h2>
                <p className="section-subtitle">
                  İşletmenizi yeni müşterilerle paylaşın. Müşteri türleri arasında hane halkı tüketicileri, ticari ve özel filolar yer alır.
                </p>
                
                <div className="acquisition-features">
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                        <path d="M19 15L20.09 19.26L24 20L20.09 20.74L19 25L17.91 20.74L14 20L17.91 19.26L19 15Z" fill="currentColor"/>
                        <path d="M5 8L5.45 9.63L7 10L5.45 10.37L5 12L4.55 10.37L3 10L4.55 9.63L5 8Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h3>Geniş Müşteri Ağı</h3>
                      <p>Hane halkı tüketicilerinden ticari filolara kadar geniş bir müşteri yelpazesine erişin</p>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h3>Anında Bildirimler</h3>
                      <p>İşletmeniz için bir servis randevusu oluşturulduğunda bildirim alın</p>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h3>Detaylı Bilgiler</h3>
                      <p>Servis tarihi, saati, türü ve müşteri iletişim bilgilerini size göndereceğiz</p>
                    </div>
                  </div>
                </div>
                
                <div className="acquisition-cta">
                  <Link href="/esnaf/kayit" className="acquisition-button">
                    <span>Hemen Başvur</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </div>
              
              <div className="acquisition-visual">
                <div className="visual-card">
                  <div className="card-header">
                    <div className="notification-dot"></div>
                    <span>Yeni Randevu Bildirimi</span>
                  </div>
                  <div className="card-content">
                    <div className="notification-item">
                      <div className="notification-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="notification-text">
                        <strong>Yeni Servis Talebi</strong>
                        <p>15 Ocak 2024, 14:30</p>
                      </div>
                    </div>
                    <div className="service-details">
                      <div className="detail-row">
                        <span className="label">Servis Türü:</span>
                        <span className="value">Motor Bakımı</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Müşteri:</span>
                        <span className="value">Ahmet Yılmaz</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Telefon:</span>
                        <span className="value">+90 555 123 45 67</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Otomatik Sistem Section */}
        <section className="automated-system-section">
          <div className="container">
            <div className="automated-content">
              <div className="automated-visual">
                <div className="screenshots-container">
                  <div className="screenshot-card main-screenshot">
                    <div className="screenshot-header">
                      <div className="browser-dots">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                      </div>
                      <div className="url-bar">sanayicin.com/esnaf-panel</div>
                    </div>
                    <div className="screenshot-content">
                      <div className="dashboard-preview">
                        <div className="dashboard-header">
                          <h3>Esnaf Paneli</h3>
                          <div className="status-indicator online">
                            <span className="status-dot"></span>
                            Çevrimiçi
                          </div>
                        </div>
                        <div className="dashboard-stats">
                          <div className="stat-item">
                            <div className="stat-icon">📊</div>
                            <div className="stat-info">
                              <span className="stat-number">24</span>
                              <span className="stat-label">Bugünkü Teklifler</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-icon">💰</div>
                            <div className="stat-info">
                              <span className="stat-number">₺12,450</span>
                              <span className="stat-label">Toplam Kazanç</span>
                            </div>
                          </div>
                        </div>
                        <div className="recent-requests">
                          <h4>Son Teklif Talepleri</h4>
                          <div className="request-item">
                            <div className="request-info">
                              <span className="request-type">Motor Bakımı</span>
                              <span className="request-time">2 dk önce</span>
                            </div>
                            <div className="request-status auto">Otomatik Yanıtlandı</div>
                          </div>
                          <div className="request-item">
                            <div className="request-info">
                              <span className="request-type">Fren Sistemi</span>
                              <span className="request-time">5 dk önce</span>
                            </div>
                            <div className="request-status auto">Otomatik Yanıtlandı</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="screenshot-card secondary-screenshot">
                    <div className="screenshot-header">
                      <div className="browser-dots">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                      </div>
                      <div className="url-bar">sanayicin.com/musteri</div>
                    </div>
                    <div className="screenshot-content">
                      <div className="customer-view">
                        <div className="search-section">
                          <h3>Hizmet Arıyorum</h3>
                          <div className="search-bar">
                            <input type="text" placeholder="Motor bakımı..." />
                            <button>🔍</button>
                          </div>
                        </div>
                        <div className="vendor-cards">
                          <div className="vendor-card">
                            <div className="vendor-info">
                              <h4>Ahmet Usta</h4>
                              <div className="rating">⭐⭐⭐⭐⭐ 4.9</div>
                              <div className="price">₺450 - ₺650</div>
                            </div>
                            <div className="auto-badge">Otomatik Teklif</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="automated-text">
                <h2 className="sectionTitle">%100 Otomatik Sistem</h2>
                <p className="section-subtitle">
                  Tüm işi Sanayicin yapıyor. İşletmeniz adına fiyat tekliflerini otomatik olarak yanıtlar - %100 otomatik. 7/24/365 yeni müşteriler edinin.
                </p>
                
                <div className="automated-features">
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                        <path d="M19 15L20.09 19.26L24 20L20.09 20.74L19 25L17.91 20.74L14 20L17.91 19.26L19 15Z" fill="currentColor"/>
                        <path d="M5 8L5.45 9.63L7 10L5.45 10.37L5 12L4.55 10.37L3 10L4.55 9.63L5 8Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h3>Otomatik Fiyat Teklifleri</h3>
                      <p>İşçilik ücretlerinize, parça marjlarınıza ve daha fazlasına dayalı olarak milyonlarca servis tahmini üretir</p>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h3>Akıllı Eşleştirme</h3>
                      <p>İşletmenizin hizmet verdiği araç markaları ve sunduğu hizmet uzmanlıklarıyla sizi eşleştirir</p>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h3>7/24/365 Çalışma</h3>
                      <p>Hiç durmadan çalışan sistem sayesinde hiçbir müşteri talebini kaçırmayın</p>
                    </div>
                  </div>
                </div>
                
                <div className="automated-stats">
                  <div className="stat-item">
                    <div className="stat-number">%100</div>
                    <div className="stat-label">Otomatik</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">7/24</div>
                    <div className="stat-label">Çalışma</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">365</div>
                    <div className="stat-label">Gün</div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </section>

        {/* Platform Özellikleri */}
        <PlatformFeatures />

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
    </>
  );
};

export default NedenEsnafPage; 