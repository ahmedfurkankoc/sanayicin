'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAuthToken, setAuthToken, setAuthEmail, clearAuthTokens, clearAllAuthData } from '@/app/utils/api';

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

  // Token kontrolü - role göre kontrol (cookie tabanlı)
  const checkAuth = (): { isAuthenticated: boolean; role: 'client' | 'vendor' | null } => {
    if (!mounted) return { isAuthenticated: false, role: null };
    
    // Cookie'den token kontrolü
    const getCookieValue = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`))
        ?.split('=')[1];
      return value || null;
    };
    
    const vendorToken = getCookieValue('vendor_token');
    const clientToken = getCookieValue('client_token');
    
    if (vendorToken) {
      return { isAuthenticated: true, role: 'vendor' };
    } else if (clientToken) {
      return { isAuthenticated: true, role: 'client' };
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
      const authCheck = checkAuth();
      
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
        logout();
      }
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Giriş yap - role göre token ayarlaması
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await api.login({ email, password });
      
      if (response.status === 200 && response.data.access) {
        const { access, role: userRole } = response.data;
        
        // Role göre token ayarla
        const tokenRole = userRole === 'vendor' ? 'vendor' : 'client';
        setAuthToken(tokenRole, access);
        // Refresh token HttpOnly cookie olarak server tarafından set edildi
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

  // Çıkış yap - basitleştirilmiş versiyon
  const logout = () => {
    clearAllAuthData();
    
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    setUserPermissions(null);
    
    // Sadece sayfayı yenile - middleware doğru yere yönlendirecek
    setTimeout(() => window.location.reload(), 200);
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
