import { useState, useEffect, useCallback } from 'react';
import { api } from '@/app/utils/api';

interface ServiceArea {
  id: number;
  name: string;
  description?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  service_area: number;
}

export const useServices = () => {
  const [services, setServices] = useState<ServiceArea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hizmet alanlarını yükle
  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getServiceAreas();
      const serviceData = response.data || response;
      setServices(serviceData);
    } catch (err) {
      console.error('Hizmet alanları yüklenemedi:', err);
      setError('Hizmet alanları yüklenirken bir hata oluştu');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Kategorileri yükle
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getCategories();
      const categoryData = response.data || response;
      setCategories(categoryData);
    } catch (err) {
      console.error('Kategoriler yüklenemedi:', err);
      setError('Kategoriler yüklenirken bir hata oluştu');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Belirli bir hizmet alanına ait kategorileri getir
  const getCategoriesByService = useCallback((serviceId: number): Category[] => {
    return categories.filter(cat => cat.service_area === serviceId);
  }, [categories]);

  // Hook ilk kullanıldığında verileri yükle
  useEffect(() => {
    if (services.length === 0) {
      loadServices();
    }
    if (categories.length === 0) {
      loadCategories();
    }
  }, [services.length, categories.length, loadServices, loadCategories]);

  return {
    services,
    categories,
    loading,
    error,
    loadServices,
    loadCategories,
    getCategoriesByService
  };
};
