'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAuthEmail, clearAuthTokens } from '@/app/utils/api';

interface EsnafContextType {
  user: any;
  email: string;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  handleLogout: () => void;
  refreshUser: () => Promise<void>;
  checkAuthStatus: () => boolean;
}

const EsnafContext = createContext<EsnafContextType | undefined>(undefined);

export const useEsnaf = () => {
  const context = useContext(EsnafContext);
  if (!context) {
    throw new Error('useEsnaf must be used within an EsnafProvider');
  }
  return context;
};

interface EsnafProviderProps {
  children: ReactNode;
}

export const EsnafProvider: React.FC<EsnafProviderProps> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const handleLogout = async () => {
    try {
      // Session logout endpoint'ini çağır (cookie'leri temizler)
      await api.logout();
    } catch (error) {
      console.error("Logout hatası:", error);
    } finally {
      // State'i temizle
    clearAuthTokens('vendor');
    setIsAuthenticated(false);
    setUser(null);
    setEmail('');
    setIsAdmin(false);
    setEmailVerified(false);
    
      // Hard redirect kullan (cookie'lerin temizlenmesi için)
      if (typeof window !== 'undefined') {
        window.location.href = '/esnaf/giris';
      } else {
        router.push('/esnaf/giris');
      }
    }
  };

  const checkAuthStatus = (): boolean => {
    // Session Authentication: HttpOnly cookie'ler JavaScript ile okunamaz
    // Bu fonksiyon geriye uyumluluk için bırakıldı
    // Gerçek authentication kontrolü refreshUser'da yapılıyor
    return isAuthenticated;
  };

  const refreshUser = async () => {
    if (typeof window === "undefined") return;
    
    setLoading(true);
    
    try {
      // Session Authentication: HttpOnly cookie'ler otomatik gönderilir (withCredentials: true)
      // api.getProfile kullan (session cookie otomatik gönderilir)
      const response = await api.getProfile('vendor');
      
      if (response.status === 200) {
        const userData = response.data.user || response.data;
        const userEmail = userData.email || '';
        
        setUser(response.data);
        setEmail(userEmail);
        setIsAuthenticated(true);
        setEmailVerified(userData.is_verified_user || userData.is_verified || false);
        setIsAdmin(userData.is_staff || userData.is_superuser || false);
      } else {
      setIsAuthenticated(false);
      setUser(null);
      setEmail('');
      setEmailVerified(false);
        setIsAdmin(false);
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
        setEmail('');
        setEmailVerified(false);
        setIsAdmin(false);
      } else {
        // Beklenmeyen hata - console'a yaz
        console.error("Kullanıcı bilgileri yüklenirken beklenmeyen hata:", error);
        setIsAuthenticated(false);
        setUser(null);
        setEmail('');
        setEmailVerified(false);
        setIsAdmin(false);
      }
      // handleLogout çağırma - sadece state'i temizle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value: EsnafContextType = {
    user,
    email,
    loading,
    isAuthenticated,
    isAdmin,
    emailVerified,
    handleLogout,
    refreshUser,
    checkAuthStatus,
  };

  return (
    <EsnafContext.Provider value={value}>
      {children}
    </EsnafContext.Provider>
  );
}; 