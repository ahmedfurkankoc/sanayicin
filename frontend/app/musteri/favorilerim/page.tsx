'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/utils/api';
import { useMusteri } from '../context/MusteriContext';
import { iconMapping } from '@/app/utils/iconMapping';
import '../../styles/musteri.css';

interface Vendor {
  id: number;
  user: {
    email: string;
    is_verified: boolean;
    avatar?: string;
  };
  business_type: string;
  company_title: string;
  display_name: string;
  phone: string;
  city: string;
  district: string;
  subdistrict: string;
  address: string;
  about?: string;
  service_areas?: any[];
  categories?: any[];
  slug: string;
}

interface FavoriteVendor {
  id: number;
  vendor: Vendor;
  created_at: string;
}

export default function FavorilerimPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useMusteri();
  const [favorites, setFavorites] = useState<FavoriteVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication kontrolü
  useEffect(() => {
    if (loading) return; // Auth hazır değilken yönlendirme yapma
    if (!isAuthenticated) {
      router.replace('/musteri/giris?next=/musteri/favorilerim');
    }
  }, [isAuthenticated, loading, router]);

  // Favorileri yükle
  const loadFavorites = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getFavorites();
      setFavorites(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error);
      setError('Favoriler yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated]);

  // Favoriden çıkar
  const removeFavorite = async (vendorId: number) => {
    try {
      await api.removeFavorite(vendorId);
      setFavorites(prev => prev.filter(fav => fav.vendor.id !== vendorId));
    } catch (error) {
      console.error('Favoriden çıkarma hatası:', error);
      setError('Favoriden çıkarılırken bir hata oluştu.');
    }
  };

  // Esnaf sayfasına git
  const goToVendor = (vendor: Vendor) => {
    router.push(`/musteri/esnaf/${vendor.slug}`);
  };

  // Kullanıcı adının ilk harflerini al
  const getInitials = (vendor: Vendor) => {
    const name = vendor.display_name || vendor.company_title || '';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  if (loading || isLoading) {
    return (
      <div className="container">
        <div className="musteri-loading">
          <div className="musteri-loading-spinner"></div>
          <div>Favoriler yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect will handle this
  }

  return (
    <div className="container">
      <div className="musteri-page-header">
        <h1>Favorilerim</h1>
        <p>Favori esnaflarınızı buradan takip edebilirsiniz</p>
      </div>

      {error && (
        <div className="musteri-error-message">
          {error}
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="musteri-empty-state">
          <div className="musteri-empty-icon">
            {React.createElement(iconMapping.heart, { size: 40 })}
          </div>
          <h3>Henüz favori esnafınız yok</h3>
          <p>
            Beğendiğiniz esnafları favorilerinize ekleyin ve buradan kolayca erişin.
          </p>
          <button
            onClick={() => router.push('/musteri/esnaflar')}
            className="musteri-empty-btn"
          >
            Esnaf Ara
          </button>
        </div>
      ) : (
        <div className="musteri-search-results">
          {favorites.map((favorite) => (
            <div 
              key={favorite.id} 
              className="musteri-vendor-card"
              onClick={() => goToVendor(favorite.vendor)}
              style={{ position: 'relative' }}
            >
              {/* Favoriden Çıkar Butonu */}
              <button
                onClick={(e) => { e.stopPropagation(); removeFavorite(favorite.vendor.id); }}
                title="Favorilerden Çıkar"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {React.createElement(iconMapping.heart, { size: 16, fill: '#ef4444', color: '#ef4444' })}
              </button>

              {/* Avatar */}
              <div className="musteri-vendor-avatar">
                {favorite.vendor.user.avatar ? (
                  <img src={favorite.vendor.user.avatar} alt={favorite.vendor.display_name} />
                ) : (
                  getInitials(favorite.vendor)
                )}
              </div>

              {/* İçerik */}
              <div className="musteri-vendor-info">
                <h3 className="musteri-vendor-name">
                  {favorite.vendor.display_name || favorite.vendor.company_title}
                </h3>
                <p className="musteri-vendor-location" style={{ marginBottom: 8 }}>
                  {favorite.vendor.district}, {favorite.vendor.city}
                </p>
                {favorite.vendor.service_areas && favorite.vendor.service_areas.length > 0 && (
                  <div className="musteri-vendor-services">
                    {favorite.vendor.service_areas.slice(0, 4).map((service: any, index: number) => (
                      <span key={service.id || index} className="musteri-service-tag">
                        {service.name}
                      </span>
                    ))}
                    {favorite.vendor.service_areas.length > 4 && (
                      <span className="musteri-service-tag">+{favorite.vendor.service_areas.length - 4} daha</span>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  <button
                    className="m-btn m-btn-apt"
                    onClick={(e) => { e.stopPropagation(); goToVendor(favorite.vendor); }}
                  >
                    Detayları Gör
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
