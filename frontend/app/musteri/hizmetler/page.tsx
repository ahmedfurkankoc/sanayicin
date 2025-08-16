'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/utils/api';
import { iconMapping } from '@/app/utils/iconMapping';

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

interface Vendor {
  id: number;
  display_name: string;
  city: string;
  district: string;
  service_areas: ServiceArea[];
  categories: Category[];
  slug: string;
}

export default function HizmetlerPage() {
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topVendors, setTopVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Hizmet alanlarını yükle
  useEffect(() => {
    const loadServiceAreas = async () => {
      try {
        const response = await api.getServiceAreas();
        setServiceAreas(response.data || []);
      } catch (err) {
        console.error('Hizmet alanları yüklenemedi:', err);
        setError('Hizmet alanları yüklenirken bir hata oluştu');
      }
    };

    // Kategorileri yükle
    const loadCategories = async () => {
      try {
        const response = await api.getCategories();
        setCategories(response.data || []);
      } catch (err) {
        console.error('Kategoriler yüklenemedi:', err);
      }
    };

    // Top vendor'ları yükle
    const loadTopVendors = async () => {
      try {
        const response = await api.searchVendors({});
        const vendors = response.data?.results || [];
        // İlk 6 vendor'ı al
        setTopVendors(vendors.slice(0, 6));
      } catch (err) {
        console.error('Vendor\'lar yüklenemedi:', err);
      }
    };

    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadServiceAreas(),
        loadCategories(),
        loadTopVendors()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Hizmet alanına göre kategorileri filtrele
  const getCategoriesByService = (serviceId: number) => {
    return categories.filter(cat => cat.service_area === serviceId);
  };

  // Hizmet alanına tıklandığında
  const handleServiceClick = (serviceId: number) => {
    router.push(`/musteri/arama-sonuclari?service=${serviceId}`);
  };

  // Vendor'a tıklandığında
  const handleVendorClick = (vendorSlug: string) => {
    router.push(`/musteri/esnaf/${vendorSlug}`);
  };

  if (loading) {
    return (
      <div className="musteri-page-container">
        <div className="musteri-loading">
          <div>Hizmetler yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="musteri-page-container">
        <div className="musteri-error">
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="musteri-page-container">
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
          {serviceAreas.map((service) => (
            <div 
              key={service.id} 
              className="musteri-service-card"
              onClick={() => handleServiceClick(service.id)}
            >
              <div className="musteri-service-icon">
                {React.createElement(iconMapping.wrench, { size: 32 })}
              </div>
              <h3>{service.name}</h3>
              {service.description && <p>{service.description}</p>}
              
              {/* Bu hizmet alanındaki kategoriler */}
              <div className="musteri-service-categories">
                {getCategoriesByService(service.id).slice(0, 3).map((category) => (
                  <span key={category.id} className="musteri-category-tag">
                    {category.name}
                  </span>
                ))}
                {getCategoriesByService(service.id).length > 3 && (
                  <span className="musteri-category-more">
                    +{getCategoriesByService(service.id).length - 3} daha
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popüler Esnaflar */}
      <section className="musteri-vendors-section">
        <h2>Popüler Esnaflar</h2>
        <div className="musteri-vendors-grid">
          {topVendors.map((vendor) => (
            <div 
              key={vendor.id} 
              className="musteri-vendor-card"
              onClick={() => handleVendorClick(vendor.slug)}
            >
              <div className="musteri-vendor-avatar">
                {vendor.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="musteri-vendor-info">
                <h3>{vendor.display_name}</h3>
                <p className="musteri-vendor-location">
                  {vendor.district}, {vendor.city}
                </p>
                <div className="musteri-vendor-services">
                  {vendor.service_areas.slice(0, 2).map((service) => (
                    <span key={service.id} className="musteri-service-tag">
                      {service.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Tüm Esnafları Gör */}
        <div className="musteri-vendors-more">
          <Link href="/musteri/arama-sonuclari" className="musteri-btn">
            Tüm Esnafları Gör
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="musteri-cta-section">
        <h2>Hizmet Vermek İstiyor musunuz?</h2>
        <p>Esnaf olarak kayıt olun ve müşterilerinize hizmet verin</p>
        <Link href="/musteri/esnaf-ol" className="musteri-btn musteri-btn-secondary">
          Esnaf Ol
        </Link>
      </section>
    </div>
  );
}
