'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/utils/api';

interface MusteriContextType {
  isAuthenticated: boolean;
  user: any | null;
  role: 'client' | 'vendor' | null;
  permissions: {
    can_provide_services: boolean;
    can_request_services: boolean;
    can_access_vendor_panel: boolean;
    can_access_customer_features: boolean;
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
    can_access_customer_features: true,
  });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Token kontrolü - vendor token'ı varsa customer olarak da davran
  const checkAuth = (): { isAuthenticated: boolean; role: 'client' | 'vendor' | null } => {
    if (!mounted) return { isAuthenticated: false, role: null };
    
    const customerToken = localStorage.getItem('customer_access_token');
    const vendorToken = localStorage.getItem('esnaf_access_token');
    
    // Vendor token varsa hem vendor hem customer olarak davran
    if (vendorToken) {
      return { isAuthenticated: true, role: 'vendor' };
    } else if (customerToken) {
      return { isAuthenticated: true, role: 'client' };
    }
    
    return { isAuthenticated: false, role: null };
  };

  // Permission'ları set et
  const setUserPermissions = (userRole: 'client' | 'vendor' | null) => {
    if (userRole === 'vendor') {
      setPermissions({
        can_provide_services: true,
        can_request_services: true,
        can_access_vendor_panel: true,
        can_access_customer_features: true, // Vendor'lar customer özelliklerini de kullanabilir
      });
    } else if (userRole === 'client') {
      setPermissions({
        can_provide_services: false,
        can_request_services: true,
        can_access_vendor_panel: false,
        can_access_customer_features: true,
      });
    } else {
      setPermissions({
        can_provide_services: false,
        can_request_services: false,
        can_access_vendor_panel: false,
        can_access_customer_features: false,
      });
    }
  };

  // Kullanıcı bilgilerini yenile
  const refreshUser = async () => {
    try {
      setLoading(true);
      const authCheck = checkAuth();
      
      if (!authCheck.isAuthenticated) {
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
        setUserPermissions(null);
        setLoading(false);
        return;
      }

      // Role'e göre profil bilgilerini çek
      let response;
      
      if (authCheck.role === 'vendor') {
        // Vendor token varsa vendor profil bilgilerini çek
        response = await api.getProfile('vendor');
      } else {
        // Customer token varsa customer profil bilgilerini çek
        response = await api.getProfile('customer');
      }
      
      if (response.status === 200) {
        console.log('Profil bilgileri yüklendi:', response.data);
        console.log('User data:', response.data);
        console.log('User object details:', JSON.stringify(response.data.user, null, 2));
        console.log('User first_name:', response.data.user?.first_name);
        console.log('User last_name:', response.data.user?.last_name);
        console.log('User email:', response.data.user?.email);
        
        // Vendor response'da user field'ı nested olarak geliyor
        // Client response'da da user field'ı nested olarak geliyor
        const userData = response.data.user || response.data;
        console.log('Extracted user data:', userData);
        
        setUser(userData);
        setIsAuthenticated(true);
        setRole(authCheck.role);
        setUserPermissions(authCheck.role);
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
        const { access, refresh, role } = response.data;
        
        // Role'e göre token'ları sakla
        if (role === 'vendor') {
          localStorage.setItem('esnaf_access_token', access);
          localStorage.setItem('esnaf_refresh_token', refresh);
          localStorage.setItem('esnaf_email', email);
        } else {
          localStorage.setItem('customer_access_token', access);
          localStorage.setItem('customer_refresh_token', refresh);
          localStorage.setItem('customer_email', email);
        }
        
        // Role bilgisini hemen set et
        setRole(role);
        setUserPermissions(role);
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
    localStorage.removeItem('customer_access_token');
    localStorage.removeItem('customer_refresh_token');
    localStorage.removeItem('customer_email');
    localStorage.removeItem('esnaf_access_token');
    localStorage.removeItem('esnaf_refresh_token');
    localStorage.removeItem('esnaf_email');
    
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    setUserPermissions(null);
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
    const authCheck = checkAuth();
    if (authCheck.isAuthenticated) {
      refreshUser();
    } else {
      setLoading(false);
    }
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
