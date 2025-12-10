'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, setAuthEmail, setCsrfToken } from "@/app/utils/api";
import { useMusteri } from "../context/MusteriContext";

function MusteriGirisContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, refreshUser } = useMusteri();

  // Eğer kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      const next = searchParams?.get('next');
      // Güvenlik: sadece site içi relatif yolları kabul et
      router.replace(next && next.startsWith('/') ? next : "/musteri");
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Session Authentication: HttpOnly cookie'ler backend tarafından set edilir
      const res = await api.login({ email, password });
      
      if (res.status === 200 && res.data.role) {
        const { role, is_verified, csrf_token } = res.data;

        // CSRF token'ı kaydet
        if (csrf_token) {
          setCsrfToken(csrf_token);
        }
        
        // Email'i localStorage'a kaydet (session cookie HttpOnly)
        setAuthEmail(role === 'vendor' ? 'vendor' : 'client', email);

        // Doğrulanmamışsa müşteri email doğrulama sayfasına yönlendir
        if (!is_verified) {
          router.push(`/musteri/email-dogrula?email=${encodeURIComponent(email)}`);
          setLoading(false);
          return;
        }

        // Context'i arka planda yenile (yönlendirme beklemeden)
        refreshUser().catch((refreshError) => {
          console.error("Kullanıcı bilgileri yüklenirken hata:", refreshError);
        });
        
        // Direkt müşteri sayfasına yönlendir (session cookie var, refreshUser arka planda çalışacak)
        const next = searchParams?.get('next');
        const target = next && next.startsWith('/') ? next : '/musteri';
        
        // Cookie'nin set edilmesi için kısa bir gecikme ekle
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = target;
          }
        }, 100);
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

  return (
    <>
      <main className="musteri-auth-main">
        <div className="musteri-auth-container">
          <div className="musteri-auth-card">
            <h1 className="musteri-auth-title">Müşteri Girişi</h1>
            <p className="musteri-auth-subtitle">
              Hesabınıza giriş yaparak hizmet almaya başlayın
            </p>

            <form onSubmit={handleSubmit} className="musteri-auth-form">
              <div className="musteri-form-group">
                <label htmlFor="email" className="musteri-form-label">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="musteri-form-input"
                  placeholder="ornek@email.com"
                  required
                />
              </div>

              <div className="musteri-form-group">
                <label htmlFor="password" className="musteri-form-label">
                  Şifre
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="musteri-form-input"
                  placeholder="Şifrenizi girin"
                  required
                />
              </div>

              {error && (
                <div className="musteri-error-message">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="musteri-auth-button"
                disabled={loading}
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </form>

            <div className="musteri-auth-links">
              <Link href="/musteri/sifremi-unuttum" className="musteri-auth-link">
                Şifremi Unuttum
              </Link>
              <span className="musteri-auth-divider">•</span>
              <Link href="/musteri/kayit" className="musteri-auth-link">
                Hesap Oluştur
              </Link>
            </div>

            <div className="musteri-auth-footer">
              <p>
                Hesabınız yok mu?{" "}
                <Link href="/musteri/kayit" className="musteri-auth-link-bold">
                  Hemen kayıt olun
                </Link>
              </p>
              <p style={{ marginTop: 8, textAlign: 'center', opacity: 0.7 }}>
                © {new Date().getFullYear()} Sanayicin. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function MusteriGirisPage() {
  return (
    <Suspense fallback={
      <main className="musteri-auth-main"><div className="musteri-auth-container"><div className="musteri-auth-card">Yükleniyor...</div></div></main>
    }>
      <MusteriGirisContent />
    </Suspense>
  );
}
