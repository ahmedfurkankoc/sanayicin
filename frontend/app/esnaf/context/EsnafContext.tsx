'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

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

  const handleLogout = () => {
    localStorage.removeItem("esnaf_access_token");
    localStorage.removeItem("esnaf_refresh_token");
    localStorage.removeItem("esnaf_email");
    localStorage.removeItem("esnaf_email_verified"); // Eski veriyi temizle
    setIsAuthenticated(false);
    setUser(null);
    setEmail('');
    setIsAdmin(false);
    setEmailVerified(false);
    router.replace("/esnaf/giris");
  };

  const checkAuthStatus = (): boolean => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("esnaf_access_token");
    return !!token;
  };

  // Token refresh fonksiyonu
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem("esnaf_refresh_token");
      if (!refreshToken) {
        console.log("EsnafContext - No refresh token available");
        return false;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      if (!apiUrl) {
        console.error("API URL tanımlanmamış!");
        return false;
      }

      console.log("EsnafContext - Attempting token refresh");
      
      const response = await axios.post(`${apiUrl}/auth/token/refresh/`, {
        refresh: refreshToken
      });

      if (response.data.access) {
        localStorage.setItem("esnaf_access_token", response.data.access);
        console.log("EsnafContext - Token refreshed successfully");
        return true;
      } else {
        console.log("EsnafContext - Token refresh failed - no access token in response");
        return false;
      }
    } catch (error) {
      console.error("EsnafContext - Token refresh failed:", error);
      return false;
    }
  };

  const refreshUser = async () => {
    if (typeof window === "undefined") return;
    
    const token = localStorage.getItem("esnaf_access_token");
    const userEmail = localStorage.getItem("esnaf_email") || "";
    
    console.log("EsnafContext - refreshUser called");
    console.log("EsnafContext - token:", token ? "exists" : "missing");
    console.log("EsnafContext - userEmail:", userEmail);
    
    if (!token) {
      console.log("EsnafContext - No token, resetting state");
      setIsAuthenticated(false);
      setUser(null);
      setEmail('');
      setEmailVerified(false);
      setLoading(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    
    if (!apiUrl) {
      console.error("API URL tanımlanmamış!");
      setLoading(false);
      return;
    }
    
    try {
      console.log("EsnafContext - Making API call to:", `${apiUrl}/vendors/profile/`);
      
      const response = await axios.get(`${apiUrl}/vendors/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 saniye timeout
      });
      
      console.log("EsnafContext - API response:", response.data);
      console.log("EsnafContext - user data:", response.data.user);
      console.log("EsnafContext - email_verified from backend:", response.data.user?.email_verified);
      
      // Kullanıcı verilerini güncelle
      setUser(response.data);
      setEmail(userEmail);
      setIsAuthenticated(true);
      
      // Email verification durumunu sadece backend'den al
      const backendEmailVerified = response.data.user?.email_verified || false;
      console.log("EsnafContext - Setting emailVerified to:", backendEmailVerified);
      setEmailVerified(backendEmailVerified);
      
      // Admin kontrolü - backend'den gelen user bilgisine göre
      const isAdminUser = response.data.user?.is_staff || response.data.user?.is_superuser;
      setIsAdmin(!!isAdminUser);
      
    } catch (error) {
      console.error("Kullanıcı bilgileri yüklenirken hata:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          console.log("EsnafContext - 401 error, checking for refresh token");
          
          // Refresh token var mı kontrol et
          const refreshTokenExists = localStorage.getItem("esnaf_refresh_token");
          
          if (!refreshTokenExists) {
            console.log("EsnafContext - No refresh token available, logging out");
            handleLogout();
            return;
          }
          
          console.log("EsnafContext - Refresh token found, attempting token refresh");
          
          // Token refresh dene
          const refreshSuccess = await refreshToken();
          
          if (refreshSuccess) {
            console.log("EsnafContext - Token refreshed, retrying profile request");
            // Token yenilendi, tekrar dene
            try {
              const newToken = localStorage.getItem("esnaf_access_token");
              const retryResponse = await axios.get(`${apiUrl}/vendors/profile/`, {
                headers: { Authorization: `Bearer ${newToken}` },
                timeout: 10000,
              });
              
              console.log("EsnafContext - Retry successful:", retryResponse.data);
              
              // Kullanıcı verilerini güncelle
              setUser(retryResponse.data);
              setEmail(userEmail);
              setIsAuthenticated(true);
              
              const backendEmailVerified = retryResponse.data.user?.email_verified || false;
              setEmailVerified(backendEmailVerified);
              
              const isAdminUser = retryResponse.data.user?.is_staff || retryResponse.data.user?.is_superuser;
              setIsAdmin(!!isAdminUser);
              
              setLoading(false);
              return; // Başarılı, fonksiyondan çık
            } catch (retryError) {
              console.error("EsnafContext - Retry failed:", retryError);
              // Retry de başarısız, logout yap
              handleLogout();
            }
          } else {
            console.log("EsnafContext - Token refresh failed, logging out");
            // Token refresh başarısız, logout yap
            handleLogout();
          }
        } else if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
          // Network hatası - kullanıcıya bilgi ver
          console.error("Backend bağlantısı kurulamadı. Backend'in çalıştığından emin olun.");
        } else {
          // Diğer HTTP hataları
          console.error("HTTP Hatası:", error.response?.status, error.response?.data);
        }
      } else {
        // Diğer hatalar
        console.error("Beklenmeyen hata:", error);
      }
      
      // Hata durumunda state'i sıfırla
      setIsAuthenticated(false);
      setUser(null);
      setEmail('');
      setEmailVerified(false);
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