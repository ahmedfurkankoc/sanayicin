'use client';

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { iconMapping } from '@/app/utils/iconMapping';
import Sidebar from './components/Sidebar';
import Image from 'next/image';
import VendorCard from '@/app/(public)/components/VendorCard';
import VendorCardSkeleton from '@/app/components/VendorCardSkeleton';
import { useMobileVendors } from '@/app/hooks/useMobileVendors';
import { api } from '@/app/utils/api';
import VideoBanner from '@/app/components/VideoBanner';

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
  icon: "paintbrush"
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
  },
  {
    id: 11,
    name: "Kaplama ve Görsel Tasarım",
    description: "Reklam kaplama, renk değişim, cam filmi ve şerit uygulamaları",
    icon: "palette"
  },
  {
    id: 12,
    name: "Yol Yardım ve Çekici Hizmetleri",
    description: "Çekici, akü takviye, lastik değişimi, yakıt ikmali ve kurtarma",
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
  ,
  // Kaplama ve Görsel Tasarım kategorileri
  { id: 39, name: "Reklam & Logo Kaplama", service_area: 11 },
  { id: 40, name: "Cam Filmi Uygulaması", service_area: 11 },
  { id: 41, name: "Sticker & Şerit Uygulamaları", service_area: 11 },
  { id: 42, name: "Renk Değişim Kaplama", service_area: 11 },
  
  // Yol Yardım ve Çekici Hizmetleri kategorileri
  { id: 43, name: "Çekici Hizmeti (şehir içi ağırlıklı)", service_area: 12 },
  { id: 44, name: "Akü Takviye", service_area: 12 },
  { id: 45, name: "Lastik Değişimi / Tamiri", service_area: 12 },
  { id: 46, name: "Yakıt İkmal", service_area: 12 },
  { id: 47, name: "Kaza Sonrası Kurtarma", service_area: 12 }
];

export default function HizmetlerPage() {
  const router = useRouter();
  const { vendors, loading, error } = useMobileVendors();
  const [userName, setUserName] = useState<string>('Misafir');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Auth guard artık middleware'de yapılıyor, burada gerek yok

  // Statik veri kullan
  const serviceAreas = STATIC_SERVICE_AREAS;
  const categories = STATIC_CATEGORIES;
  
  // Fallback mock data (public homepage ile uyumlu)
  const mockVendors = [
    { name: "Usta Otomotiv", experience: "10+ yıl deneyim", type: "Renair Servisi", city: "İstanbul", img: "/images/vendor-1.jpg" },
    { name: "Yılmaz Elektrik", experience: "7 yıl deneyim", type: "Elektrik Servisi", city: "Ankara", img: "/images/vendor-2.jpg" },
    { name: "Kaporta Ustası", experience: "12 yıl deneyim", type: "Kaporta", city: "İzmir", img: "/images/vendor-3.jpg" },
    { name: "Boya Merkezi", experience: "9 yıl deneyim", type: "Boya", city: "Bursa", img: "/images/vendor-4.jpg" },
  ];
  // Bu ay en çok yorum alanlara göre sırala (varsa aylık sayaç alanları)
  const displayVendors = vendors.length > 0 ? vendors : mockVendors;
  const topVendors = displayVendors
    .slice()
    .sort((a: any, b: any) => {
      const getMonthly = (v: any) =>
        v.monthly_review_count ?? v.reviews_this_month ?? v.review_count ?? 0;
      return getMonthly(b) - getMonthly(a);
    })
    .slice(0, 6);

  // Kullanıcı profilini API'den çek
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getProfile('client');
        const data = res?.data || {};
        if (!mounted) return;
        const first = data.first_name || data.firstName || '';
        const last = data.last_name || data.lastName || '';
        const display = data.display_name || data.displayName || `${first} ${last}`.trim();
        const email = data.email || '';
        const finalName = (display && display.trim().length > 0) ? display : (email || 'Kullanıcı');
        setUserName(finalName);
        const avatar = data.avatar || data.photo || data.photoUrl || null;
        if (avatar) setAvatarUrl(avatar);
      } catch (e) {
        // Sessizce geç: token yoksa ya da misafir ise
      }
    })();
    return () => { mounted = false; };
  }, []);

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

  // Hizmet alanına tıklandığında (memoized)
  const handleServiceClick = useCallback((serviceId: number) => {
    const svc = serviceAreas.find(s => s.id === serviceId);
    const name = svc?.name || String(serviceId);
    router.push(`/musteri/esnaflar?service=${encodeURIComponent(name)}`);
  }, [router, serviceAreas]);

  return (
    <div className="musteri-page-container">
      <Sidebar />
      <div className="musteri-page">
        <div className="container" >
        {/* Hero Section */}
        <div className="musteri-hero-section">
          <div className="mhero-grid">
            <div className="mhero-left">
              <h1>Hizmet Arayın, Esnaf Bulun</h1>
              <p>İhtiyacınız olan hizmeti bulun ve güvenilir esnaflarla çalışın</p>
              <div className="mhero-cta-row">
                <Link href="/musteri/esnaflar" className="musteri-hero-search-btn">
                  Tüm Esnafları Gör
                </Link>
              </div>
              <div className="mhero-badges">
                <div className="mhero-badge">
                  {React.createElement(iconMapping['shield-check'], { size: 18 })}
                  Onaylı Esnaflar
                </div>
                <div className="mhero-badge">
                  {React.createElement(iconMapping['star'], { size: 18 })}
                  Gerçek Yorumlar
                </div>
                <div className="mhero-badge">
                  {React.createElement(iconMapping['message'], { size: 18 })}
                  Hızlı Teklif
                </div>
                <div className="mhero-badge">
                  {React.createElement(iconMapping['map-pin'], { size: 18 })}
                  Size En Yakın
                </div>
              </div>
            </div>
            <div className="mhero-right">
              <div className="mhero-userrow">
                <div className="mhero-avatar">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={userName} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <span>{userName.split(' ').slice(0,2).map(s=>s.charAt(0)).join('').toUpperCase() || 'S'}</span>
                  )}
                </div>
                <div className="mhero-usertexts">
                  <h3 className="mhero-username"><span className="mhero-greet">Merhaba</span> {userName}</h3>
                  <p className="mhero-welcome">Sanayicin'e tekrar hoş geldin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
          
        {/* En Çok Yorum Alan Esnaflar */}
        <section className="musteri-vendors-section" style={{ margin: '0', padding: '20px 0 0 0'  }}>
          <h2>Bu Ay En Çok Yorum Alan Esnaflar</h2>
          <div className="musteri-vendors-grid">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <VendorCardSkeleton key={`mv-skel-${index}`} />
              ))
            ) : error ? (
              mockVendors.slice(0, 6).map((v) => (
                <VendorCard key={v.name} {...v} />
              ))
            ) : (
              topVendors.map((vendor: any, index: number) => {
                // Backend'de avatar user.avatar olarak geliyor
                const avatarField = vendor.user?.avatar || null;
                const vendorData = {
                  name: vendor.display_name || vendor.company_title || vendor.name || 'Esnaf',
                  experience: `${Math.floor(Math.random() * 10) + 1}+ yıl deneyim`,
                  type: vendor.service_areas?.[0]?.name || vendor.type || 'Hizmet',
                  city: vendor.city || '',
                  img: avatarField,
                  slug: vendor.slug,
                  rating: vendor.rating || 0,
                  reviewCount: vendor.monthly_review_count || vendor.reviews_this_month || vendor.review_count || 0,
                  about: vendor.about,
                  serviceAreas: vendor.service_areas,
                  categories: vendor.categories
                };
                const key = vendor.id || index;
                return <VendorCard key={key} {...vendorData} />;
              })
            )}
          </div>
        </section>

          {/* Video Banner */}
          <VideoBanner style={{ padding: 0, margin: '40px 0' }} />

        {/* Hizmet Alanları */}
        <section className="musteri-services-section" style={{padding: '0', margin: '80px 0'}}>
          <h2>Hizmet Alanları</h2>
          <div className="musteri-services-grid">
            {serviceAreas.map((service) => {
              const serviceCategories = categoriesByService[service.id] || [];
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
