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

      // En çok yorum alan esnafları getir (konum izni gerektirmez)
      const searchParams: any = {
        page_size: 5,
        ordering: '-review_count' // En çok yorum alan esnafları önce getir
      };

      const response = await api.searchVendors(searchParams);
      
      if (response.data.results && response.data.results.length > 0) {
        setVendors(response.data.results);
      } else {
        // Fallback: En yüksek rating'li esnafları getir
        const topRatedResponse = await api.searchVendors({
          page_size: 5,
          ordering: '-rating'
        });
        
        if (topRatedResponse.data.results) {
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
