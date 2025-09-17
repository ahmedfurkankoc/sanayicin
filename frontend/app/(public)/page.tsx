import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import VendorCard from "./components/VendorCard";
import MobileBottomNav from "./components/MobileBottomNav";
import AppBanner from "./components/AppBanner";
import Footer from "./components/Footer";
import CTASection from "./components/CTASection";
import PlatformAdvantages from "./components/PlatformAdvantages";
import HowItWorks from "./components/HowItWorks";
import CityVendorsSection from "./components/CityVendorsSection";
import VendorsSection from "./components/VendorsSection";

export default function Home() {
  const mobileVendors = [
    { name: "Usta Otomotiv", experience: "10+ yıl deneyim", type: "Renair Servisi", city: "İstanbul", img: "/images/vendor-1.jpg" },
    { name: "Yılmaz Elektrik", experience: "7 yıl deneyim", type: "Elektrik Servisi", city: "Ankara", img: "/images/vendor-2.jpg" },
    { name: "Kaporta Ustası", experience: "12 yıl deneyim", type: "Kaporta", city: "İzmir", img: "/images/vendor-3.jpg" },
    { name: "Boya Merkezi", experience: "9 yıl deneyim", type: "Boya", city: "Bursa", img: "/images/vendor-4.jpg" },
  ];
  return (
    <>
      <Navbar />

      <main>
        {/* Mobile-first simplified homepage */}
        <section className="public-mobile-home mobile-only">
          <div className="container">
            <div className="mobile-hero">
              <h1 className="mobile-hero-title">Sanayide Güvenin Dijital Adresi</h1>
              <div className="mobile-search">
                <SearchBar />
              </div>
              <div className="mobile-cta-row">
                <a className="btn-primary" href="#usta-ara">Hemen Usta Bul</a>
                <a className="btn-secondary" href="/esnaf/kayit">Ben de Esnafım</a>
              </div>
            </div>

            <div className="mobile-quick-cats">
              <button className="category-chip">Tamir</button>
              <button className="category-chip">Elektrik</button>
              <button className="category-chip">Kaporta</button>
              <button className="category-chip">Boya</button>
              <button className="category-chip">Lastik</button>
            </div>

            <div className="mobile-trust-badges">
              <div className="badge"><span className="icon">✓</span> Onaylı Esnaflar</div>
              <div className="badge"><span className="icon">★</span> Gerçek Yorumlar</div>
              <div className="badge"><span className="icon">🛡</span> Güvenli İletişim</div>
            </div>

            <div className="mobile-nearby">
              <h3 className="sectionTitle">Sana En Yakın Esnaflar</h3>
              <div className="h-scroll-cards">
                {mobileVendors.map((v) => (
                  <VendorCard key={v.name} {...v} />
                ))}
              </div>
            </div>

            <div className="mobile-promo">
              <div className="promo-card">
                <p className="promo-text">İlk 500 Esnaf 6 Ay Ücretsiz</p>
                <a className="btn-primary" href="/esnaf/kayit">Hemen Kayıt Ol</a>
              </div>
            </div>
          </div>
        </section>

        {/* Desktop/tablet existing homepage */}
        <section className="heroSection desktop-only">
          <div className="container">
            <div className="hero-grid">
              <div className="hero-card">
                <h1 className="hero-copy-title">
                  Size En 
                  <br />
                  Yakın Ustayı 
                  <br />
                  <span className="accent">Hemen Bulun!</span>
                </h1>
                
                <p className="hero-copy-desc" style={{marginTop: 12}}>
                  Türkiye'nin en iyi otomobil servisleri ve otomobil ustaları bu adreste!
                </p>
                <p className="hero-copy-desc small">
                  Ayrıca aldığınız hizmete göre işletmeleri siz değerlendiriyorsunuz.
                </p>
                <SearchBar variant="stacked" />
              </div>
            </div>
          </div>
        </section>

        <div className="desktop-only">
          <PlatformAdvantages />
          
          <HowItWorks />

          <CTASection
            title="Hizmet Ver"
            description="Daha fazla müşteriye ulaşmak, işlerinizi büyütmek ve kazancınızı artırmak ister misiniz? Esnafların ve hizmet verenlerin buluştuğu bu platformda kendi profilinizi oluşturun, hizmetlerinizi sergileyin ve anında yeni iş fırsatlarına erişin."
            buttonText="Hemen Kayıt Ol"
            buttonHref="/esnaf/kayit"
            variant="vendor"
            imageSrc="/images/hizmet-ver.jpg"
            imageAlt="Hizmet verenler için kayıt görseli"
          />
          
          <VendorsSection />

          <CityVendorsSection />

          <CTASection
            title="Usta Bul"
            description="Aracınızda bir sorun mu var? Elektrik, elektronik, mekanik veya kaporta boya işleriniz için güvenilir ustalar mı arıyorsunuz? Sanayicin ile size en yakın, deneyimli ve güvenilir otomotiv ustalarını bulun. Hızlı fiyat teklifleri alın, değerlendirmeleri inceleyin ve aracınızı güvenle teslim edin."
            buttonText="Hemen Bul"
            buttonHref="#usta-ara"
            variant="user"
            imageSrc="/images/hizmet-bul.jpg"
            imageAlt="Hizmet alanlar için usta bul görseli"
            reverse
          />
          
          <AppBanner /> 
        </div>

      </main>
      <Footer />
      {/* Safe area spacer for bottom nav on mobile */}
      <div className="mobile-bottom-spacer mobile-only" />
      <MobileBottomNav />
    </>
  );
}
 