'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import AuthHeader from "../../components/AuthHeader";
import { useEsnaf } from "../context/EsnafContext";
import { setAuthToken, setAuthEmail } from '@/app/utils/api';

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
      }, { withCredentials: true });
      
      if (res.status === 200 && res.data.access) {
        const { access, role, is_verified } = res.data;
        
        // Sadece vendor'lar esnaf paneline girebilir
        if (role === 'vendor' || role === 'admin') {
          // Vendor token'larını kaydet
          setAuthToken("vendor", access);
          // Refresh token HttpOnly cookie olarak server tarafından set edilir
          setAuthEmail("vendor", email);
          
          // Eski localStorage kullanımını kaldırdık (cookie tabanlı token yönetimi)
          
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
          
          // Cookie tabanlı yönetimde localStorage temizliği gereksiz
        } else {
          setError("Bu hesap esnaf hesabı değil.");
          
          // Cookie tabanlı yönetimde localStorage temizliği gereksiz
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
      <AuthHeader currentPage="login" />
      <section className="register-section">
        <div className="register-wrapper">
          <div className="register-card">
            <div className="register-loading">
              <p>Yönlendiriliyor...</p>
            </div>
          </div>
        </div>
      </section>
      {/* Footer intentionally hidden on auth page */}
      </>
    );
  }

  return (
    <>
    <AuthHeader currentPage="login" />
    <section className="register-section">
      {/* Mobile title */}
      <div className="mobile-only">
        <div className="container">
          <h1 className="register-mobile-title">Sanayicin Esnaf Paneline Giriş Yapın</h1>
        </div>
      </div>
      {/* Ana Container */}
      <div className="register-wrapper">
        {/* Vektörel Karakter - Kartın Sağ Üstünde */}
        <div className="register-character">
          <img 
            src="/images/register-vectorel-image.png" 
            alt="Esnaf karakteri" 
          />
        </div>
        
        {/* Kart */}
        <div className="register-card">
          <h1 className="register-card__title">Esnaf Girişi</h1>
          <p className="register-card__description">Esnaf hesabınıza giriş yaparak hizmet vermeye başlayın</p>
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="esnaf-input-group">
              <label className="register-label">E-posta Adresi</label>
              <input
                type="email"
                className="register-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                autoComplete="username"
              />
            </div>
            
            <div className="esnaf-input-group">
              <label className="register-label">Şifre</label>
              <input
                type="password"
                className="register-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <div className="register-forgot-password">
                <Link href="/esnaf/sifremi-unuttum" className="register-forgot-link">
                  Şifremi Unuttum
                </Link>
              </div>
            </div>
            
            {error && <div className="register-error">{error}</div>}
            
            <button type="submit" className="register-btn register-btn--primary" disabled={loading}>
              {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          {/* Footer */}
          <div className="esnaf-login-footer">
            <p>Hesabınız yok mu? <Link href="/esnaf/kayit">Hemen Kayıt Olun</Link></p>
            <a className="esnaf-modal-btn text-black" href="/" onClick={(e) => { e.preventDefault(); if (typeof window !== 'undefined') { window.location.href = '/'; } }}>Ana Sayfaya Dön</a>
            <p className="esnaf-login-copyright">
              © {new Date().getFullYear()} Sanayicin. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </section>
    {/* Footer intentionally hidden on auth page */}
    </>
  );
} 