'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiClient, getAuthToken, setAuthToken, setRefreshToken, setAuthEmail, clearAllAuthData } from '@/app/utils/api';

interface MusteriContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const MusteriContext = createContext<MusteriContextType | undefined>(undefined);

export const useMusteri = () => {
  const context = useContext(MusteriContext);
  if (context === undefined) {
    throw new Error('useMusteri must be used within a MusteriProvider');
  }
  return context;
};

interface MusteriProviderProps {
  children: ReactNode;
}

export const MusteriProvider: React.FC<MusteriProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Token kontrolü - herhangi bir token varsa authenticated kabul et
  const checkAuth = (): boolean => {
    if (!mounted) return false;
    const clientToken = getAuthToken('client');
    const vendorToken = getAuthToken('vendor');
    return Boolean(clientToken || vendorToken);
  };

  // Kullanıcı bilgilerini yenile
  const refreshUser = async () => {
    try {
      setLoading(true);
      const hasAuth = checkAuth();
      if (!hasAuth) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      // Unified CustomUser profili çek
      const response = await apiClient.get('/profile/');
      
      if (response.status === 200) {
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        // Token geçersiz, sadece logout yap - yönlendirme yapma
        console.log('Token geçersiz, logout yapıldı. Yönlendirme yapılmadı.');
        logout();
      }
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      // Hata durumunda da sadece logout yap - yönlendirme yapma
      console.log('Profil yüklenirken hata, logout yapıldı. Yönlendirme yapılmadı.');
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Giriş yap
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Tek endpoint ile giriş yap
      const response = await api.login({ email, password });
      
      if (response.status === 200 && response.data.access) {
        const { access, refresh } = response.data;

        // Tek token yaklaşımı: her iki key altına da aynı token'ı yaz
        setAuthToken('vendor', access);
        setRefreshToken('vendor', refresh);
        setAuthEmail('vendor', email);

        setAuthToken('client', access);
        setRefreshToken('client', refresh);
        setAuthEmail('client', email);

        setIsAuthenticated(true);
        
        // Kullanıcı bilgilerini yükle
        await refreshUser();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Giriş hatası:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yap
  const logout = () => {
    clearAllAuthData();
    
    setIsAuthenticated(false);
    setUser(null);
    router.push('/musteri/hizmetler'); // Çıkış yaptıktan sonra hizmetler sayfasına yönlendir
  };

  // Component mount olduktan sonra authentication kontrolü
  useEffect(() => {
    setMounted(true);
  }, []);

  // Authentication kontrolü - sadece mevcut token'ları kontrol et, yönlendirme yapma
  useEffect(() => {
    if (!mounted) return;
    
    setLoading(true);
    const hasAuth = checkAuth();
    if (hasAuth) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [mounted]);

  const value: MusteriContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    refreshUser,
    loading,
  };

  return (
    <MusteriContext.Provider value={value}>
      {children}
    </MusteriContext.Provider>
  );
};
