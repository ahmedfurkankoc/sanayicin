'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthHeader from "../../components/AuthHeader";
import { useEsnaf } from "../context/EsnafContext";
import { api, setAuthEmail, setCsrfToken } from '@/app/utils/api';

export default function EsnafGirisPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated, refreshUser } = useEsnaf();

  // Eğer kullanıcı zaten giriş yapmışsa panel'e yönlendir (sadece bir kez)
  const hasRedirectedRef = React.useRef(false);
  
  useEffect(() => {
    if (isAuthenticated && !loading && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      // Hard redirect kullan (daha güvenilir)
      if (typeof window !== 'undefined') {
        window.location.href = "/esnaf/panel";
      }
    }
  }, [isAuthenticated, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // apiClient kullan (CSRF token otomatik eklenir)
      const res = await api.login({ email, password });
      
      if (res.status === 200 && res.data.role) {
        const { role, is_verified, csrf_token } = res.data;
        
        // Sadece vendor'lar esnaf paneline girebilir
        if (role === 'vendor' || role === 'admin') {
          // Session cookie HttpOnly olarak backend tarafından set edildi
          // CSRF token'ı kaydet
          if (csrf_token) {
            setCsrfToken(csrf_token);
          }
          setAuthEmail("vendor", email);
          
          // Doğrulanmamışsa email verification sayfasına yönlendir
          if (!is_verified) {
            router.push(`/esnaf/email-dogrula?email=${email}`);
            setLoading(false);
            return;
          }
          
          // Session cookie'nin set edilmesi için kısa bir bekleme
          // Django session cookie response header'ında gelir, tarayıcı otomatik set eder
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Context'i arka planda yenile (yönlendirme beklemeden)
          refreshUser().catch((refreshError) => {
            console.error("Kullanıcı bilgileri yüklenirken hata:", refreshError);
          });
          
          // Direkt panel'e yönlendir (session cookie var, refreshUser arka planda çalışacak)
            router.push("/esnaf/panel");
        } else if (role === 'client') {
          // Client hesabı varsa vendor'a upgrade et
          setError("Bu hesap müşteri hesabı. Esnaf olmak için lütfen yeni hesap açın veya mevcut hesabınızı yükseltin.");
          setLoading(false);
        } else {
          setError("Bu hesap esnaf hesabı değil.");
          setLoading(false);
        }
      } else {
        setError("Giriş başarısız. Bilgilerinizi kontrol edin.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Giriş başarısız. Bilgilerinizi kontrol edin.");
      setLoading(false);
    }
  };

  // Eğer giriş yapılmışsa ve loading bitmişse yönlendir
  if (isAuthenticated && !loading) {
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