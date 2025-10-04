'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getAuthToken, setAuthToken, setAuthEmail, clearAuthTokens } from '@/app/utils/api';

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
    clearAuthTokens('vendor');
    setIsAuthenticated(false);
    setUser(null);
    setEmail('');
    setIsAdmin(false);
    setEmailVerified(false);
    
    // Sadece sayfayı yenile - middleware doğru yere yönlendirecek
    setTimeout(() => window.location.reload(), 200);
  };

  const checkAuthStatus = (): boolean => {
    if (typeof window === "undefined") return false;
    
    // Cookie'den token kontrolü
    const getCookieValue = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`))
        ?.split('=')[1];
      return value || null;
    };
    
    const token = getCookieValue('vendor_token');
    return !!token;
  };

  const refreshUser = async () => {
    if (typeof window === "undefined") return;
    
    // Cookie'den token ve email kontrolü
    const getCookieValue = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`))
        ?.split('=')[1];
      return value || null;
    };
    
    const token = getCookieValue('vendor_token');
    const userEmail = getCookieValue('esnaf_email') || "";
    
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setEmail('');
      setEmailVerified(false);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/vendors/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      
      setUser(response.data);
      setEmail(userEmail);
      setIsAuthenticated(true);
      setEmailVerified(response.data.user?.is_verified || false);
      setIsAdmin(response.data.user?.is_staff || response.data.user?.is_superuser);
    } catch (error) {
      console.error("Kullanıcı bilgileri yüklenirken hata:", error);
      handleLogout();
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