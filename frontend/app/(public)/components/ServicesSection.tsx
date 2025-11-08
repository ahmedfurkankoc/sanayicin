"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useServices } from "@/app/hooks/useServices";
import { iconMapping } from "@/app/utils/iconMapping";

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

// Hizmet adı/ID -> ikon anahtarı eşlemesi (başlıkla uyumlu olacak şekilde)
const getServiceIconKey = (serviceId: number, serviceName?: string): keyof typeof iconMapping => {
  const name = (serviceName || '').toLowerCase();
  // İsim bazlı güçlü eşleme
  if (name.includes('mekanik')) return 'wrench';
  if (name.includes('elektrik') || name.includes('elektronik')) return 'zap';
  if (name.includes('kaporta') || name.includes('boya')) return 'paintbrush';
  if (name.includes('lastik') || name.includes('jant')) return 'car';
  if (name.includes('temizlik') || name.includes('bakım') || name.includes('bakim')) return 'sparkles';
  if (name.includes('cam') || name.includes('anahtar') || name.includes('güvenlik') || name.includes('guvenlik')) return 'shield';
  if (name.includes('klima') || name.includes('ısıtma') || name.includes('isitma')) return 'snowflake';
  if (name.includes('multimedya') || name.includes('donanım') || name.includes('donanim')) return 'smartphone';
  if (name.includes('yedek parça') || name.includes('yedek parca') || name.includes('aksesuar')) return 'cog';
  if (name.includes('ticari')) return 'truck';
  if (name.includes('kaplama') || name.includes('görsel') || name.includes('gorsel') || name.includes('film')) return 'palette';
  if (name.includes('yol yardım') || name.includes('çekici') || name.includes('cekici') || name.includes('kurtarma')) return 'truck';

  // ID bazlı geri dönüş (API ID sıralaması değişirse en azından makul görünür)
  const iconMap: { [key: number]: keyof typeof iconMapping } = {
    1: 'wrench',
    2: 'zap',
    3: 'paintbrush',
    4: 'car',
    5: 'sparkles',
    6: 'shield',
    7: 'snowflake',
    8: 'smartphone',
    9: 'cog',
    10: 'truck',
    11: 'palette',
    12: 'truck',
  };
  return iconMap[serviceId] || 'wrench';
};

const ServicesSection = () => {
  const { services, loading, error } = useServices();

  // API'den gelen hizmetleri görsellerle birleştir
  const serviceAreasWithImages = useMemo(() => {
    return services.map(service => ({
      id: service.id,
      name: service.name,
      image: getServiceImage(service.id),
      iconKey: getServiceIconKey(service.id, service.name)
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
                {/* Sağ üst ikon rozeti */}
                {(() => {
                  const Icon = iconMapping[serviceArea.iconKey as keyof typeof iconMapping] as any;
                  return (
                    <div className="serviceIconBadge" aria-hidden="true">
                      {Icon ? <Icon size={20} color="#111" /> : null}
                    </div>
                  );
                })()}
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