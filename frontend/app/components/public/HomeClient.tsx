'use client';

import { useEffect } from "react";
import SearchBar from "./SearchBar";
import VendorCard from "./VendorCard";
import VendorCardSkeleton from "@/app/components/VendorCardSkeleton";
import AppBanner from "./AppBanner";
import CTASection from "./CTASection";
import PlatformAdvantages from "./PlatformAdvantages";
import HowItWorks from "./HowItWorks";
import CityVendorsSection from "./CityVendorsSection";
import ServicesSection from "./ServicesSection";
import { useMobileVendors } from "@/app/hooks/useMobileVendors";
import { useServices } from "@/app/hooks/useServices";

export default function HomeClient() {
  const { vendors, loading, error } = useMobileVendors();
  const { services, loading: servicesLoading } = useServices();
  
  // Fallback mock data
  const mockVendors = [
    { name: "Usta Otomotiv", experience: "10+ yıl deneyim", type: "Renair Servisi", city: "İstanbul", img: "/images/vendor-1.jpg" },
    { name: "Yılmaz Elektrik", experience: "7 yıl deneyim", type: "Elektrik Servisi", city: "Ankara", img: "/images/vendor-2.jpg" },
    { name: "Kaporta Ustası", experience: "12 yıl deneyim", type: "Kaporta", city: "İzmir", img: "/images/vendor-3.jpg" },
    { name: "Boya Merkezi", experience: "9 yıl deneyim", type: "Boya", city: "Bursa", img: "/images/vendor-4.jpg" },
  ];

  // Gerçek veri varsa onu kullan, yoksa mock data
  const displayVendors = vendors.length > 0 ? vendors : mockVendors;

  // SEO Structured Data
  useEffect(() => {
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Sanayicin",
      "url": "https://sanayicin.com",
      "logo": "https://sanayicin.com/sanayicin-logo.png",
      "description": "Türkiye'nin en büyük oto sanayi platformu. Size en yakın, güvenilir ve kaliteli otomotiv ustalarını bulun.",
      "sameAs": [],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Müşteri Hizmetleri",
        "url": "https://sanayicin.com/iletisim"
      }
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Sanayicin",
      "url": "https://sanayicin.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://sanayicin.com/musteri/esnaflar?search={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    };

    const serviceSchema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Oto Sanayi Hizmetleri",
      "provider": {
        "@type": "Organization",
        "name": "Sanayicin"
      },
      "areaServed": {
        "@type": "Country",
        "name": "Türkiye"
      },
      "description": "Mekanik, elektrik, kaporta, boya ve daha fazlası için profesyonel oto sanayi hizmetleri"
    };

    // Mevcut schema script'lerini temizle
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-homepage]');
    existingScripts.forEach(script => script.remove());

    // Yeni schema script'lerini ekle
    [organizationSchema, websiteSchema, serviceSchema].forEach((schema, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-homepage', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"][data-homepage]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  return (
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
              <a className="btn-primary" href="/musteri/esnaflar">Hemen Usta Bul</a>
              <a className="btn-secondary" href="/esnaf/giris">Ben de Esnafım</a>
            </div>
          </div>

          <div className="mobile-quick-cats">
            {servicesLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={`loading-${index}`} className="category-chip loading">
                  <div className="loading-shimmer"></div>
                </div>
              ))
            ) : (
              services.slice(0, 8).map((service) => (
                <button 
                  key={service.id} 
                  className="category-chip"
                  onClick={() => {
                    window.location.href = `/musteri/esnaflar?service=${encodeURIComponent(service.name)}`;
                  }}
                >
                  {service.name}
                </button>
              ))
            )}
          </div>

          <div className="mobile-trust-badges">
            <div className="badge"><span className="icon">✓</span> Onaylı Esnaflar</div>
            <div className="badge"><span className="icon">★</span> Gerçek Yorumlar</div>
            <div className="badge"><span className="icon">🛡</span> Güvenli İletişim</div>
          </div>

          <div className="mobile-nearby">
            <h3 className="sectionTitle">En Çok Yorum Alan Esnaflar</h3>
            <div className="h-scroll-cards">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <VendorCardSkeleton key={`skeleton-${index}`} />
                ))
              ) : error ? (
                mockVendors.map((v) => (
                  <VendorCard key={v.name} {...v} />
                ))
              ) : (
                displayVendors.slice(0, 5).map((vendor, index) => {
                  const vendorData = {
                    name: 'display_name' in vendor ? (vendor.display_name || vendor.company_title || 'Esnaf') : vendor.name,
                    experience: `${Math.floor(Math.random() * 10) + 1}+ yıl deneyim`,
                    type: 'service_areas' in vendor ? (vendor.service_areas?.[0]?.name || 'Hizmet') : vendor.type,
                    city: 'city' in vendor ? vendor.city : (vendor as any).city,
                    img: 'avatar' in vendor ? ((vendor as any).avatar || '/images/vendor-default.jpg') : (vendor as any).img,
                    slug: 'slug' in vendor ? vendor.slug : undefined,
                    rating: 'rating' in vendor ? (vendor.rating || 0) : 0,
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
              
              <p className="hero-copy-desc">
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
          imageSrc="/images/hizmet-ver.jpeg"
          imageAlt="Hizmet verenler için kayıt görseli"
        />
        
        <ServicesSection />

        <CityVendorsSection />

        <CTASection
          title="Usta Bul"
          description="Aracınızda bir sorun mu var? Elektrik, elektronik, mekanik veya kaporta boya işleriniz için güvenilir ustalar mı arıyorsunuz? Sanayicin ile size en yakın, deneyimli ve güvenilir otomotiv ustalarını bulun. Hızlı fiyat teklifleri alın, değerlendirmeleri inceleyin ve aracınızı güvenle teslim edin."
          buttonText="Hemen Bul"
          buttonHref="/usta-ariyorum"
          variant="user"
          imageSrc="/images/hizmet-bul.jpg"
          imageAlt="Hizmet alanlar için usta bul görseli"
          reverse
        />
        
        <AppBanner /> 
      </div>
    </main>
  );
}

