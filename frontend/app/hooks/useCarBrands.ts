import { useState, useEffect } from 'react';
import { api } from '@/app/utils/api';

interface CarBrand {
  id: number;
  name: string;
  logo?: string;
  description?: string;
  is_active: boolean;
}

export const useCarBrands = () => {
  const [carBrands, setCarBrands] = useState<CarBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCarBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getCarBrands();
      const brands = response.data || response;
      
      // Sadece aktif markaları filtrele
      const activeBrands = brands.filter((brand: CarBrand) => brand.is_active);
      setCarBrands(activeBrands);
    } catch (err) {
      console.error('Araç markaları yüklenemedi:', err);
      setError('Araç markaları yüklenirken bir hata oluştu');
      setCarBrands([]);
    } finally {
      setLoading(false);
    }
  };

  // Hook ilk kullanıldığında markaları yükle
  useEffect(() => {
    if (carBrands.length === 0) {
      loadCarBrands();
    }
  }, []);

  return {
    carBrands,
    loading,
    error,
    loadCarBrands
  };
};
