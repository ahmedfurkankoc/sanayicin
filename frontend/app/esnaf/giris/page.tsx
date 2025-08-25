'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import EsnafAuthHeader from "../components/EsnafAuthHeader";
import EsnafFooter from "@/app/esnaf/components/EsnafFooter";
import { useEsnaf } from "../context/EsnafContext";
import { setAuthToken, setRefreshToken, setAuthEmail } from '@/app/utils/api';

export default function EsnafGirisPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated, refreshUser } = useEsnaf();

  // Eğer kullanıcı zaten giriş yapmışsa panel'e yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/esnaf/panel");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Tek endpoint ile giriş yap
      const apiUrl = typeof window !== 'undefined' && window.location.hostname === 'test.sanayicin.com' 
        ? 'https://test.sanayicin.com/api' 
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api');
      
      const res = await axios.post(`${apiUrl}/auth/login/`, {
        email,
        password,
      });
      
      if (res.status === 200 && res.data.access) {
        const { access, refresh, role, is_verified } = res.data;
        
        // Sadece vendor'lar esnaf paneline girebilir
        if (role === 'vendor' || role === 'admin') {
          // Vendor token'larını kaydet
          setAuthToken("vendor", access);
          setRefreshToken("vendor", refresh);
          setAuthEmail("vendor", email);
          
          // Client token'larını temizle (eğer varsa)
          localStorage.removeItem('client_access_token');
          localStorage.removeItem('client_refresh_token');
          localStorage.removeItem('client_email');
          
          localStorage.removeItem("esnaf_password_set");
          
          // Doğrulanmamışsa email verification sayfasına yönlendir
          if (!is_verified) {
            router.push(`/esnaf/email-dogrula?email=${email}`);
            return;
          }
          
          // Context'i yenile
          await refreshUser();
          
          // State güncellenmesini bekle
          setTimeout(() => {
            router.push("/esnaf/panel");
          }, 100);
        } else if (role === 'client') {
          // Client hesabı varsa vendor'a upgrade et
          setError("Bu hesap müşteri hesabı. Esnaf olmak için lütfen yeni hesap açın veya mevcut hesabınızı yükseltin.");
          
          // Client token'larını temizle (eğer varsa)
          localStorage.removeItem('esnaf_access_token');
          localStorage.removeItem('esnaf_refresh_token');
          localStorage.removeItem('esnaf_email');
        } else {
          setError("Bu hesap esnaf hesabı değil.");
          
          // Tüm token'ları temizle
          localStorage.removeItem('esnaf_access_token');
          localStorage.removeItem('esnaf_refresh_token');
          localStorage.removeItem('esnaf_email');
          localStorage.removeItem('client_access_token');
          localStorage.removeItem('client_refresh_token');
          localStorage.removeItem('client_email');
        }
      } else {
        setError("Giriş başarısız. Bilgilerinizi kontrol edin.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Giriş başarısız. Bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  // Eğer giriş yapılmışsa loading göster
  if (isAuthenticated) {
    return (
      <>
      <EsnafAuthHeader title={'Esnaf Giriş'} currentPage="login" />
      <main className="esnaf-login-main">
        <div className="esnaf-login-container">
          <div className="esnaf-login-loading">
            <p>Yönlendiriliyor...</p>
          </div>
        </div>
      </main>
      <EsnafFooter />
      </>
    );
  }

  return (
    <>
    <EsnafAuthHeader title={'Esnaf Giriş'} currentPage="login" />
    <main className="esnaf-login-main">
      <div className="esnaf-login-container">
        {/* Header */}

        <h1 className="esnaf-login-title">Hesabınıza Giriş Yapın</h1>
        
        <form onSubmit={handleSubmit} className="esnaf-login-form">
          <div className="esnaf-input-group">
            <label className="esnaf-login-label">E-posta Adresi</label>
            <input
              type="email"
              className="esnaf-login-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
              autoComplete="username"
            />
          </div>
          
          <div className="esnaf-input-group">
            <label className="esnaf-login-label">Şifre</label>
            <input
              type="password"
              className="esnaf-login-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <Link 
                href="/esnaf/sifremi-unuttum" 
                style={{ 
                  color: '#666', 
                  fontSize: '14px', 
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Şifremi Unuttum
              </Link>
            </div>
          </div>
          
          {error && <div className="esnaf-login-error">{error}</div>}
          
          <button type="submit" className="esnaf-login-btn" disabled={loading}>
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        {/* Footer */}
        <div className="esnaf-login-footer">
          <p>Hesabınız yok mu? <Link href="/esnaf/kayit">Hemen Kayıt Olun</Link></p>
          <Link className="esnaf-modal-btn text-black" href="/">Ana Sayfaya Dön</Link>
        </div>
      </div>
    </main>
    <EsnafFooter />
    </>
  );
} 