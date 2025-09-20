"use client";

import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface Vendor {
  id: number;
  display_name: string;
  company_title: string;
  city: string;
  district: string;
  about: string;
  avatar: string | null;
  rating: number;
  review_count: number;
  service_areas: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  slug: string;
}

interface UseMobileVendorsReturn {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMobileVendors = (): UseMobileVendorsReturn => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Önce kullanıcının konumunu almaya çalış
      let userCity = '';
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false
            });
          });
          
          // Reverse geocoding için basit bir yaklaşım
          // Gerçek uygulamada Google Maps API veya benzeri kullanılabilir
          userCity = 'İstanbul'; // Varsayılan olarak İstanbul
        } catch (geoError) {
          console.log('Konum alınamadı, varsayılan şehir kullanılıyor');
          userCity = 'İstanbul';
        }
      } else {
        userCity = 'İstanbul';
      }

      // Önce kullanıcının şehrindeki esnafları ara
      let searchParams: any = {
        city: userCity,
        page_size: 5
      };

      const response = await api.searchVendors(searchParams);
      
      if (response.data.results && response.data.results.length > 0) {
        setVendors(response.data.results);
      } else {
        // Şehirde esnaf yoksa, en yüksek rating'li esnafları getir
        const topRatedResponse = await api.searchVendors({
          page_size: 5
        });
        
        if (topRatedResponse.data.results) {
          // Backend'de zaten rating'e göre sıralanmış
          setVendors(topRatedResponse.data.results);
        }
      }
    } catch (err: any) {
      console.error('Vendor verileri alınamadı:', err);
      setError('Esnaf verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return {
    vendors,
    loading,
    error,
    refetch: fetchVendors
  };
};
