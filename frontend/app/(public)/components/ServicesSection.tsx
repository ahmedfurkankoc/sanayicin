"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useServices } from "@/app/hooks/useServices";

// Görseller için mapping - API'den gelen verilerle eşleştir
const getServiceImage = (serviceId: number): string => {
  const imageMap: { [key: number]: string } = {
    1: "/images/sanayicin-services/mekanik-hizmetler.jpg",
    2: "/images/sanayicin-services/elektrik-elektronik.jpg",
    3: "/images/sanayicin-services/kaporta-ve-boya.jpg",
    4: "/images/sanayicin-services/detayli-temizlik-ve-bakim.jpg",
    5: "/images/sanayicin-services/lastik-ve-jant-hizmetleri.jpg",
    6: "/images/sanayicin-services/klima-ve-isitma-sistemleri.jpg",
    7: "/images/sanayicin-services/cam-anahtar-ve-guvenlik-sistemleri.jpg",
    8: "/images/sanayicin-services/multimedya-ve-donanim.jpg",
    9: "/images/sanayicin-services/hafif-ticari-ve-ticari-arac-hizmetleri.jpg",
    10: "/images/sanayicin-services/yedek-parca-ve-aksesuar.jpg",
    11: "/images/sanayicin-services/araba-cekici.jpg",
    12: "/images/sanayicin-services/kaplama-ve-gorsel.jpg"
  };
  return imageMap[serviceId] || "/images/sanayicin-services/default-service.jpg";
};

const ServicesSection = () => {
  const { services, loading, error } = useServices();

  // API'den gelen hizmetleri görsellerle birleştir
  const serviceAreasWithImages = useMemo(() => {
    return services.map(service => ({
      id: service.id,
      name: service.name,
      image: getServiceImage(service.id)
    }));
  }, [services]);

  // Loading state
  if (loading) {
    return (
      <section className="servicesSection">
        <div className="container">
          <h2 className="sectionTitle">Hizmet Alanları</h2>
          <div className="servicesCardsWrapper servicesCardsWrapper-4col">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="serviceCard" style={{ opacity: 0.6 }}>
                <div className="serviceImgContainer">
                  <div style={{ 
                    width: '100%', 
                    height: '200px', 
                    backgroundColor: '#f0f0f0',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999'
                  }}>
                    Yükleniyor...
                  </div>
                </div>
                <div className="serviceInfo">
                  <h3 className="serviceName" style={{ backgroundColor: '#f0f0f0', height: '20px', borderRadius: '4px' }}></h3>
                  <div className="serviceExp"></div>
                  <div className="serviceType" style={{ backgroundColor: '#f0f0f0', height: '16px', borderRadius: '4px', marginTop: '8px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="servicesSection">
        <div className="container">
          <h2 className="sectionTitle">Hizmet Alanları</h2>
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>Hizmet alanları yüklenirken bir hata oluştu.</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="servicesSection">
      <div className="container">
        <h2 className="sectionTitle">Hizmet Alanları</h2>
        <div className="servicesCardsWrapper servicesCardsWrapper-4col">
          {serviceAreasWithImages.map((serviceArea, index) => (
            <div key={serviceArea.id} className="serviceCard">
              <div className="serviceImgContainer">
                <img 
                  src={serviceArea.image} 
                  alt={serviceArea.name}
                  className="serviceImg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="serviceImgTextAvatar">
                          <span class="avatarText">${serviceArea.name.charAt(0)}</span>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              <div className="serviceInfo">
                <h3 className="serviceName">{serviceArea.name}</h3>
                <div className="serviceExp"></div>
                <div className="serviceType">{serviceArea.name} · </div>
                <Link 
                  href={{ pathname: "/musteri/esnaflar", query: { service: serviceArea.name } }} 
                  className="serviceCardActionBtn"
                >
                  Esnaf Bul
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection; 