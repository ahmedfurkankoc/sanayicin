"use client";

import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import VendorCard from "./components/VendorCard";
import VendorCardSkeleton from "../components/VendorCardSkeleton";
import MobileBottomNav from "../components/MobileBottomNav";
import AppBanner from "./components/AppBanner";
import Footer from "../components/Footer";
import CTASection from "./components/CTASection";
import PlatformAdvantages from "./components/PlatformAdvantages";
import HowItWorks from "./components/HowItWorks";
import CityVendorsSection from "./components/CityVendorsSection";
import ServicesSection from "./components/ServicesSection";
import { useMobileVendors } from "../hooks/useMobileVendors";

export default function Home() {
  const { vendors, loading, error } = useMobileVendors();
  
  // Fallback mock data
  const mockVendors = [
    { name: "Usta Otomotiv", experience: "10+ yıl deneyim", type: "Renair Servisi", city: "İstanbul", img: "/images/vendor-1.jpg" },
    { name: "Yılmaz Elektrik", experience: "7 yıl deneyim", type: "Elektrik Servisi", city: "Ankara", img: "/images/vendor-2.jpg" },
    { name: "Kaporta Ustası", experience: "12 yıl deneyim", type: "Kaporta", city: "İzmir", img: "/images/vendor-3.jpg" },
    { name: "Boya Merkezi", experience: "9 yıl deneyim", type: "Boya", city: "Bursa", img: "/images/vendor-4.jpg" },
  ];

  // Gerçek veri varsa onu kullan, yoksa mock data
  const displayVendors = vendors.length > 0 ? vendors : mockVendors;
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
                <a className="btn-primary" href="/musteri/arama-sonuclari">Hemen Usta Bul</a>
                <a className="btn-secondary" href="/esnaf/giris">Ben de Esnafım</a>
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
                {loading ? (
                  // Skeleton loading göster
                  Array.from({ length: 4 }).map((_, index) => (
                    <VendorCardSkeleton key={`skeleton-${index}`} />
                  ))
                ) : error ? (
                  // Hata durumunda mock data göster
                  mockVendors.map((v) => (
                    <VendorCard key={v.name} {...v} />
                  ))
                ) : (
                  // Gerçek veri göster
                  displayVendors.slice(0, 5).map((vendor, index) => {
                    // API'den gelen veri formatını VendorCard'a uygun hale getir
                    const vendorData = {
                      name: 'display_name' in vendor ? (vendor.display_name || vendor.company_title || 'Esnaf') : vendor.name,
                      experience: `${Math.floor(Math.random() * 10) + 1}+ yıl deneyim`, // Geçici olarak random
                      type: 'service_areas' in vendor ? (vendor.service_areas?.[0]?.name || 'Hizmet') : vendor.type,
                      city: 'city' in vendor ? vendor.city : (vendor as any).city,
                      img: 'store_logo' in vendor ? (vendor.store_logo || (vendor as any).avatar || '/images/vendor-default.jpg') : (vendor as any).img,
                      slug: 'slug' in vendor ? vendor.slug : undefined,
                      rating: 'rating' in vendor ? (vendor.rating || 0) : 0, // Rating yoksa 0 göster
                      reviewCount: 'review_count' in vendor ? (vendor.review_count || 0) : 0,
                      about: 'about' in vendor ? vendor.about : undefined,
                      serviceAreas: 'service_areas' in vendor ? vendor.service_areas : undefined,
                      categories: 'categories' in vendor ? vendor.categories : undefined
                    };
                    const key = 'id' in vendor ? vendor.id : index;
                    return <VendorCard key={key} {...vendorData} />;
                  })
                )}
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
          
          <ServicesSection />

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
 