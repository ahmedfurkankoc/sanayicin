'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { iconMapping } from '@/app/utils/iconMapping';
import { getAuthToken } from '@/app/utils/api';
import Sidebar from './components/Sidebar';

interface ServiceArea {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  service_area: number;
}

// Statik hizmet alanları verisi
const STATIC_SERVICE_AREAS: ServiceArea[] = [
  {
    id: 1,
    name: "Mekanik Hizmetler",
    description: "Motor, şanzıman, fren sistemi ve diğer mekanik onarımlar",
    icon: "wrench"
  },
  {
    id: 2,
    name: "Elektrik ve Elektronik",
    description: "Araç elektrik sistemleri, batarya, alternator ve elektronik onarımlar",
    icon: "zap"
  },
  {
    id: 3,
    name: "Kaporta ve Boya",
    description: "Hasar onarımı, boyama, döşeme ve estetik işlemler",
    icon: "palette"
  },
  {
    id: 4,
    name: "Lastik ve Jant Hizmetleri",
    description: "Lastik değişimi, balans, rot balans ve jant işlemleri",
    icon: "car"
  },
  {
    id: 5,
    name: "Detaylı Temizlik ve Bakım",
    description: "İç ve dış temizlik, parlatma, koruma ve bakım hizmetleri",
    icon: "sparkles"
  },
  {
    id: 6,
    name: "Cam, Anahtar ve Güvenlik Sistemleri",
    description: "Cam değişimi, anahtar yapımı ve güvenlik sistem kurulumu",
    icon: "shield"
  },
  {
    id: 7,
    name: "Klima ve Isıtma Sistemleri",
    description: "Klima bakımı, gaz dolumu ve ısıtma sistemi onarımları",
    icon: "snowflake"
  },
  {
    id: 8,
    name: "Multimedya ve Donanım",
    description: "Ses sistemi, navigasyon ve araç içi teknolojik donanım",
    icon: "smartphone"
  },
  {
    id: 9,
    name: "Yedek Parça ve Aksesuar",
    description: "Orijinal ve yan sanayi yedek parçalar, aksesuar satışı",
    icon: "cog"
  },
  {
    id: 10,
    name: "Hafif Ticari ve Ticari Araç Hizmetleri",
    description: "Kamyonet, kamyon ve ticari araç özel hizmetleri",
    icon: "truck"
  }
];

// Statik kategoriler verisi
const STATIC_CATEGORIES: Category[] = [
  // Mekanik Hizmetler kategorileri
  { id: 1, name: "Motor Onarımı", service_area: 1 },
  { id: 2, name: "Şanzıman Servisi", service_area: 1 },
  { id: 3, name: "Fren Sistemi", service_area: 1 },
  { id: 4, name: "Amortisör", service_area: 1 },
  { id: 5, name: "Egzoz Sistemi", service_area: 1 },
  
  // Elektrik ve Elektronik kategorileri
  { id: 6, name: "Batarya Servisi", service_area: 2 },
  { id: 7, name: "Alternatör", service_area: 2 },
  { id: 8, name: "Marş Motoru", service_area: 2 },
  { id: 9, name: "Araç Elektroniği", service_area: 2 },
  { id: 10, name: "Kablo Tesisatı", service_area: 2 },
  
  // Kaporta ve Boya kategorileri
  { id: 11, name: "Hasar Onarımı", service_area: 3 },
  { id: 12, name: "Boyama İşlemleri", service_area: 3 },
  { id: 13, name: "Döşeme", service_area: 3 },
  { id: 14, name: "Pasta Cila", service_area: 3 },
  
  // Lastik ve Jant kategorileri
  { id: 15, name: "Lastik Değişimi", service_area: 4 },
  { id: 16, name: "Balans Ayarı", service_area: 4 },
  { id: 17, name: "Rot Balans", service_area: 4 },
  { id: 18, name: "Jant Onarımı", service_area: 4 },
  
  // Detaylı Temizlik kategorileri
  { id: 19, name: "İç Temizlik", service_area: 5 },
  { id: 20, name: "Dış Temizlik", service_area: 5 },
  { id: 21, name: "Motor Temizliği", service_area: 5 },
  { id: 22, name: "Parlatma", service_area: 5 },
  
  // Cam, Anahtar kategorileri
  { id: 23, name: "Cam Değişimi", service_area: 6 },
  { id: 24, name: "Anahtar Yapımı", service_area: 6 },
  { id: 25, name: "Alarm Sistemi", service_area: 6 },
  { id: 26, name: "İmmobilizer", service_area: 6 },
  
  // Klima kategorileri
  { id: 27, name: "Klima Bakımı", service_area: 7 },
  { id: 28, name: "Gaz Dolumu", service_area: 7 },
  { id: 29, name: "Kalorifer Onarımı", service_area: 7 },
  
  // Multimedya kategorileri
  { id: 30, name: "Ses Sistemi", service_area: 8 },
  { id: 31, name: "Navigasyon", service_area: 8 },
  { id: 32, name: "Geri Vites Kamerası", service_area: 8 },
  
  // Yedek Parça kategorileri
  { id: 33, name: "Orijinal Parça", service_area: 9 },
  { id: 34, name: "Yan Sanayi Parça", service_area: 9 },
  { id: 35, name: "Aksesuar", service_area: 9 },
  
  // Ticari Araç kategorileri
  { id: 36, name: "Kamyonet Servisi", service_area: 10 },
  { id: 37, name: "Kamyon Bakımı", service_area: 10 },
  { id: 38, name: "Ticari Araç Modifikasyonu", service_area: 10 }
];

export default function HizmetlerPage() {
  const router = useRouter();

  // Auth guard: sadece giriş yapanlar erişebilsin (client veya vendor)
  useEffect(() => {
    const vendorToken = getAuthToken('vendor');
    const clientToken = getAuthToken('client');
    if (!vendorToken && !clientToken) {
      router.push('/musteri/giris?next=/musteri');
    }
  }, [router]);

  // Statik veri kullan
  const serviceAreas = STATIC_SERVICE_AREAS;
  const categories = STATIC_CATEGORIES;

  // Kategorileri hizmet alanına göre grupla (memoized)
  const categoriesByService = useMemo(() => {
    const grouped: { [serviceId: number]: Category[] } = {};
    categories.forEach(category => {
      if (!grouped[category.service_area]) {
        grouped[category.service_area] = [];
      }
      grouped[category.service_area].push(category);
    });
    return grouped;
  }, [categories]);

  // Hizmet alanına göre kategorileri getir (memoized)
  const getCategoriesByService = useCallback((serviceId: number) => {
    return categoriesByService[serviceId] || [];
  }, [categoriesByService]);

  // Hizmet alanına tıklandığında (memoized)
  const handleServiceClick = useCallback((serviceId: number) => {
    router.push(`/musteri/arama-sonuclari?service=${serviceId}`);
  }, [router]);

  return (
    <div className="musteri-page-container" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', minHeight: '100vh' }}>
      <Sidebar />
      <div className="musteri-page">
        <div className="container" >
          {/* Hero Section */}
          <div className="musteri-hero-section">
            <h1>Hizmet Arayın, Esnaf Bulun</h1>
            <p>İhtiyacınız olan hizmeti bulun ve güvenilir esnaflarla çalışın</p>
            
            {/* Arama Butonu */}
            <Link href="/musteri/arama-sonuclari" className="musteri-hero-search-btn">
              Tüm Esnafları Gör
            </Link>
          </div>

        {/* Hizmet Alanları */}
        <section className="musteri-services-section">
          <h2>Hizmet Alanları</h2>
          <div className="musteri-services-grid">
            {serviceAreas.map((service) => {
              const serviceCategories = getCategoriesByService(service.id);
              const displayCategories = serviceCategories.slice(0, 3);
              const remainingCount = serviceCategories.length - 3;
              
              return (
                <div 
                  key={service.id} 
                  className="musteri-service-card"
                  onClick={() => handleServiceClick(service.id)}
                >
                  <div className="musteri-service-icon">
                    {service.icon && iconMapping[service.icon as keyof typeof iconMapping] ? 
                      React.createElement(iconMapping[service.icon as keyof typeof iconMapping], { size: 32 }) :
                      React.createElement(iconMapping.wrench, { size: 32 })
                    }
                  </div>
                  <h3>{service.name}</h3>
                  {service.description && <p>{service.description}</p>}
                  
                  {/* Bu hizmet alanındaki kategoriler */}
                  <div className="musteri-service-categories">
                    {displayCategories.map((category) => (
                      <span key={category.id} className="musteri-category-tag">
                        {category.name}
                      </span>
                    ))}
                    {remainingCount > 0 && (
                      <span className="musteri-category-more">
                        +{remainingCount} daha
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>


        </div>
      </div>
    </div>
  );
}
