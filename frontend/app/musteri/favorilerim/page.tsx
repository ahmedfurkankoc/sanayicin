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
    if (!loading && !isAuthenticated) {
      router.push('/musteri/giris?next=/musteri/favorilerim');
      return;
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
      <div className="musteri-page-container">
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
    <div className="musteri-page-container">
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
          <div className="musteri-empty-icon">💝</div>
          <h3>Henüz favori esnafınız yok</h3>
          <p>
            Beğendiğiniz esnafları favorilerinize ekleyin ve buradan kolayca erişin.
          </p>
          <button
            onClick={() => router.push('/musteri/arama-sonuclari')}
            className="musteri-empty-btn"
          >
            Esnaf Ara
          </button>
        </div>
      ) : (
        <div className="musteri-favorites-list">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="musteri-favorite-item">
              {/* Favoriden Çıkar Butonu */}
              <button
                onClick={() => removeFavorite(favorite.vendor.id)}
                className="musteri-favorite-btn-remove"
                title="Favorilerden Çıkar"
              >
                {React.createElement(iconMapping.heart, { size: 16, fill: '#ef4444' })}
              </button>

              <div className="musteri-favorite-content">
                {/* Avatar */}
                <div className="musteri-favorite-avatar">
                  {favorite.vendor.user.avatar ? (
                    <img 
                      src={favorite.vendor.user.avatar} 
                      alt={favorite.vendor.display_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    getInitials(favorite.vendor)
                  )}
                </div>

                {/* Vendor Bilgileri */}
                <div className="musteri-favorite-info">
                  <div className="musteri-favorite-header">
                    <h3 
                      className="musteri-favorite-name"
                      onClick={() => goToVendor(favorite.vendor)}
                    >
                      {favorite.vendor.display_name || favorite.vendor.company_title}
                    </h3>
                    
                    {favorite.vendor.user.is_verified && (
                      <div className="musteri-favorite-verified">
                        {React.createElement(iconMapping.check, { size: 12 })}
                        Doğrulanmış
                      </div>
                    )}
                    
                    <div className="musteri-favorite-type">
                      {favorite.vendor.business_type}
                    </div>
                  </div>

                  <div className="musteri-favorite-details">
                    <div className="musteri-favorite-location">
                      {React.createElement(iconMapping['map-pin'], { size: 16 })}
                      {favorite.vendor.district}, {favorite.vendor.city}
                    </div>
                    
                    {favorite.vendor.about && (
                      <div className="musteri-favorite-about">
                        {favorite.vendor.about}
                      </div>
                    )}

                    {favorite.vendor.service_areas && favorite.vendor.service_areas.length > 0 && (
                      <div className="musteri-favorite-services">
                        {favorite.vendor.service_areas.slice(0, 4).map((area: any, index: number) => (
                          <span key={area.id || index} className="musteri-favorite-service-tag">
                            {area.name}
                          </span>
                        ))}
                        {favorite.vendor.service_areas.length > 4 && (
                          <span className="musteri-favorite-service-more">
                            +{favorite.vendor.service_areas.length - 4} daha
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Aksiyon Butonları */}
                  <div className="musteri-favorite-actions">
                    <button
                      onClick={() => goToVendor(favorite.vendor)}
                      className="musteri-favorite-btn-primary"
                    >
                      Detayları Gör
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
