'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/app/utils/api';

interface EsnafAuthGuardProps {
  children: React.ReactNode;
}

export default function EsnafAuthGuard({ children }: EsnafAuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // Vendor token var mı kontrol et
      const vendorToken = getAuthToken('vendor');
      
      if (!vendorToken) {
        // Vendor token yok, esnaf giriş sayfasına yönlendir
        router.push('/esnaf/giris');
        return;
      }

      // Token'ı decode et ve role kontrolü yap
      try {
        const tokenParts = vendorToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          
          // Role kontrolü - sadece vendor ve admin'ler erişebilir
          if (payload.role === 'vendor' || payload.role === 'admin') {
            setIsAuthorized(true);
          } else {
            // Client rolü, esnaf giriş sayfasına yönlendir
            router.push('/esnaf/giris');
            return;
          }
        } else {
          // Geçersiz token format, esnaf giriş sayfasına yönlendir
          router.push('/esnaf/giris');
          return;
        }
      } catch (error) {
        console.error('Token decode error:', error);
        // Token decode hatası, esnaf giriş sayfasına yönlendir
        router.push('/esnaf/giris');
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="esnaf-auth-loading">
        <div className="loading-spinner">
          <p>Yetkilendirme kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Router zaten yönlendirme yapacak
  }

  return <>{children}</>;
}
