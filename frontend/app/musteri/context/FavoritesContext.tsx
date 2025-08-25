'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/app/utils/api';
import { useMusteri } from './MusteriContext';

interface FavoritesContextType {
  favorites: number[];
  isLoading: boolean;
  isFavorite: (vendorId: number) => boolean;
  toggleFavorite: (vendorId: number) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useMusteri();

  // Favorileri yükle
  const refreshFavorites = async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.getFavorites();
      const favoriteVendors = response.data?.results || response.data || [];
      const vendorIds = favoriteVendors.map((fav: any) => fav.vendor.id || fav.vendor_id);
      setFavorites(vendorIds);
    } catch (error) {
      console.error('Favoriler yüklenemedi:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    if (isAuthenticated) {
      refreshFavorites();
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated]);

  // Favori durumunu kontrol et
  const isFavorite = (vendorId: number): boolean => {
    return favorites.includes(vendorId);
  };

  // Favori ekleme/çıkarma
  const toggleFavorite = async (vendorId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error('Favorilere eklemek için giriş yapmanız gerekiyor');
    }

    try {
      const isCurrentlyFavorite = isFavorite(vendorId);
      
      if (isCurrentlyFavorite) {
        // Favoriden çıkar
        await api.removeFavorite(vendorId);
        setFavorites(prev => prev.filter(id => id !== vendorId));
        return false;
      } else {
        // Favoriye ekle
        await api.addFavorite(vendorId);
        setFavorites(prev => [...prev, vendorId]);
        return true;
      }
    } catch (error) {
      console.error('Favori işlemi başarısız:', error);
      throw error;
    }
  };

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    refreshFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
