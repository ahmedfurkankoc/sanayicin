import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import Footer from "../../components/Footer";
import { Backpack } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Banner
        title="Hakkımızda"
        description="Sanayicin olarak misyonumuz ve vizyonumuz hakkında bilgi edinin."
        backgroundColor="var(--black)"
        textColor="var(--white)"
      />
      <section className="about-section" style={{backgroundColor: 'var(--white)'}}>
        <div className="container">
          <h2 className="sectionTitle">Sanayicin Nedir?</h2>
          <p className="about-text">
            Sanayicin, otomotiv sektöründe hizmet veren ustalar ile hizmet almak isteyen kullanıcıları bir araya getiren modern bir platformdur. Amacımız, güvenilir ve hızlı bir şekilde en yakın ustaya ulaşmanızı sağlamak ve sektördeki dijital dönüşüme öncülük etmektir.
          </p>
          <h3 className="about-subtitle">Misyonumuz</h3>
          <p className="about-text">
            Sanayi ekosistemini dijitalleştirerek, hem ustaların hem de hizmet arayanların hayatını kolaylaştırmak. Şeffaf, güvenilir ve hızlı bir hizmet ağı oluşturmak.
          </p>
          <h3 className="about-subtitle">Vizyonumuz</h3>
          <p className="about-text">
            Türkiye'nin dört bir yanında sanayi hizmetlerine erişimi kolaylaştırmak ve sektörde dijitalleşmenin öncüsü olmak.
          </p>
          <h3 className="about-subtitle">Neden Sanayicin?</h3>
          <ul className="about-list">
            <li>Güvenilir ve onaylı ustalar</li>
            <li>Gerçek müşteri yorumları ve puanlama sistemi</li>
            <li>Kullanıcı dostu ve hızlı arayüz</li>
            <li>Farklı kategorilerde geniş hizmet ağı</li>
            <li>Şeffaf fiyatlandırma ve kolay iletişim</li>
          </ul>
          <p className="about-text">
            Sanayicin ekibi olarak, sizlere en iyi deneyimi sunmak için sürekli çalışıyoruz. Bize her türlü öneri ve geri bildiriminizi iletebilirsiniz.
          </p>
        </div>
      </section>


      <section className="company-history-section">
        <div className="container">
          <div className="history-header">
            <h2 className="sectionTitle white">Kuruluş Hikayemiz</h2>
            <p className="history-description">
              Sanayicin'in kuruluşundan bugüne kadar geçen süreçte yaşadığımız önemli dönüm noktalarını keşfedin. 
              Her adımda daha iyi hizmet sunmak için nasıl büyüdüğümüzü ve geliştiğimizi görün.
            </p>
            <div className="history-badge">Aşamalar</div>
            
          </div>
          
          <div className="history-timeline">
            <div className="timeline-line"></div>
            
            <div className="timeline-item">
              <div className="timeline-marker">
                <div className="marker-outer">
                  <div className="marker-inner"></div>
                </div>
              </div>
              <div className="timeline-content">
                <div className="timeline-year">2024</div>
                <div className="timeline-description">
                  Sanayicin projesi fikri ortaya çıktı ve ilk adımlar atıldı. Otomotiv sektöründeki dijital dönüşüm ihtiyacı tespit edildi.
                </div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker">
                <div className="marker-outer">
                  <div className="marker-inner"></div>
                </div>
              </div>
              <div className="timeline-content">
                <div className="timeline-year">2025</div>
                <div className="timeline-description">
                  Test ve yazılım geliştirme aşamalarına başlandı. Platform altyapısı oluşturuldu ve ilk prototipler geliştirildi.
                </div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker">
                <div className="marker-outer">
                  <div className="marker-inner"></div>
                </div>
              </div>
              <div className="timeline-content">
                <div className="timeline-year">2025</div>
                <div className="timeline-description">
                  Beta test süreci başlatıldı ve ilk kullanıcı geri bildirimleri alındı. Platform sürekli iyileştirildi.
                </div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker">
                <div className="marker-outer">
                  <div className="marker-inner"></div>
                </div>
              </div>
              <div className="timeline-content">
                <div className="timeline-year">2025</div>
                <div className="timeline-description">
                  Resmi lansman yapıldı ve kullanıcılara hizmet vermeye başladık. Türkiye genelinde hizmet ağı genişletildi.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <main className="container">
      </main>
    </>
  );
} 