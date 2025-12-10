'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAuthEmail, clearAllAuthData } from '@/app/utils/api';

interface MusteriContextType {
  isAuthenticated: boolean;
  user: any | null;
  role: 'client' | 'vendor' | null;
  permissions: {
    can_provide_services: boolean;
    can_request_services: boolean;
    can_access_vendor_panel: boolean;
    can_access_client_features: boolean;
  };
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
  const [role, setRole] = useState<'client' | 'vendor' | null>(null);
  const [permissions, setPermissions] = useState({
    can_provide_services: false,
    can_request_services: true,
    can_access_vendor_panel: false,
    can_access_client_features: true,
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Token kontrolü - HttpOnly cookie'ler JavaScript ile okunamaz
  // Backend'den profil bilgisi çekerek authentication durumunu kontrol et
  const checkAuth = async (): Promise<{ isAuthenticated: boolean; role: 'client' | 'vendor' | null }> => {
    if (!mounted) return { isAuthenticated: false, role: null };
    
    try {
      // Backend'den profil bilgisi çek (HttpOnly cookie otomatik gönderilir)
      // Vendor profilini dene
      try {
        const vendorResponse = await api.getProfile('vendor');
        if (vendorResponse.status === 200) {
      return { isAuthenticated: true, role: 'vendor' };
        }
      } catch (e: any) {
        // 401/403 normal (session yok) - sessizce handle et
        const status = e.response?.status;
        if (status !== 401 && status !== 403 && e.code !== 'ERR_NETWORK') {
          // Beklenmeyen hata - console'a yaz
          console.error('Vendor profil kontrolü hatası:', e);
        }
        // Vendor profil yoksa client profilini dene
        try {
          const clientResponse = await api.getProfile('client');
          if (clientResponse.status === 200) {
      return { isAuthenticated: true, role: 'client' };
          }
        } catch (e2: any) {
          // 401/403 normal (session yok) - sessizce handle et
          const status2 = e2.response?.status;
          if (status2 !== 401 && status2 !== 403 && e2.code !== 'ERR_NETWORK') {
            // Beklenmeyen hata - console'a yaz
            console.error('Client profil kontrolü hatası:', e2);
          }
          // Her iki profil de yoksa authenticated değil
          return { isAuthenticated: false, role: null };
        }
      }
    } catch (e: any) {
      // Network hatası veya beklenmeyen hata
      const status = e.response?.status;
      if (status !== 401 && status !== 403 && e.code !== 'ERR_NETWORK') {
        console.error('Auth kontrolü hatası:', e);
      }
      // Hata durumunda authenticated değil
      return { isAuthenticated: false, role: null };
    }
    
    return { isAuthenticated: false, role: null };
  };

  // Permission'ları set et - role göre ayarlanmış versiyon
  const setUserPermissions = (userRole: 'client' | 'vendor' | null) => {
    setPermissions({
      can_provide_services: userRole === 'vendor',
      can_request_services: !!userRole, // Hem vendor hem client servis talep edebilir
      can_access_vendor_panel: userRole === 'vendor',
      can_access_client_features: !!userRole, // Hem vendor hem client müşteri özelliklerini kullanabilir
    });
  };

  // Kullanıcı bilgilerini yenile - role göre profil çekme
  const refreshUser = async () => {
    try {
      setLoading(true);
      const authCheck = await checkAuth();
      
      if (!authCheck.isAuthenticated) {
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
        setUserPermissions(null);
        return;
      }

      // Role göre profil bilgilerini çek
      if (!authCheck.role) return;
      const response = await api.getProfile(authCheck.role);
      
      if (response.status === 200) {
        const userData = response.data.user || response.data;
        setUser(userData);
        setIsAuthenticated(true);
        setRole(authCheck.role);
        setUserPermissions(authCheck.role);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
        setUserPermissions(null);
      }
    } catch (error: any) {
      // Network hatası (backend çalışmıyor) veya 401/403 hatası = session yok veya geçersiz
      // Bu hatalar normal (kullanıcı giriş yapmamış olabilir) - sessizce handle et
      const status = error.response?.status;
      const isAuthError = status === 401 || status === 403;
      const isNetworkError = error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
      
      if (isNetworkError || isAuthError) {
        // Backend çalışmıyor veya kullanıcı giriş yapmamış - sessizce state'i temizle, console'a yazma
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
        setUserPermissions(null);
      } else {
        // Beklenmeyen hata - console'a yaz
        console.error('Profil yüklenirken beklenmeyen hata:', error);
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
        setUserPermissions(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Giriş yap - role göre token ayarlaması
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await api.login({ email, password });
      
      if (response.status === 200 && response.data.role) {
        const { role: userRole, csrf_token } = response.data;
        
        // Session cookie HttpOnly olarak backend tarafından set edildi
        // CSRF token'ı kaydet
        if (csrf_token) {
          const { setCsrfToken } = await import('@/app/utils/api');
          setCsrfToken(csrf_token);
        }
        const tokenRole = userRole === 'vendor' ? 'vendor' : 'client';
        setAuthEmail(tokenRole, email);
        
        setRole(userRole);
        setUserPermissions(userRole);
        setIsAuthenticated(true);
        
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

  // Çıkış yap - backend logout endpoint'ini çağır
  const logout = async () => {
    try {
      // Backend logout endpoint'ini çağır (session ve cookie'leri temizler)
      await api.logout();
    } catch (error) {
      console.error("Logout hatası:", error);
    } finally {
      // State'i temizle
    clearAllAuthData();
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    setUserPermissions(null);
    
      // Hard redirect to ensure full state reset and proper cookie handling
      if (typeof window !== 'undefined') {
        window.location.href = '/musteri/giris';
      }
    }
  };

  // Component mount olduktan sonra authentication kontrolü
  useEffect(() => {
    setMounted(true);
  }, []);

  // Authentication kontrolü - sadece mevcut token'ları kontrol et, yönlendirme yapma
  useEffect(() => {
    if (!mounted) return;
    
    setLoading(true);
    checkAuth().then((authCheck) => {
    if (authCheck.isAuthenticated) {
      refreshUser();
    } else {
      setLoading(false);
    }
    });
  }, [mounted]);

  const value: MusteriContextType = {
    isAuthenticated,
    user,
    role,
    permissions,
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
