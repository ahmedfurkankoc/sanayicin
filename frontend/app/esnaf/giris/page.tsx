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
      <main className="esnaf-login-main">
        <div className="esnaf-login-container">
          <div className="esnaf-login-loading">
            <p>Yönlendiriliyor...</p>
          </div>
        </div>
      </main>
      {/* Footer intentionally hidden on auth page */}
      </>
    );
  }

  return (
    <>
    <AuthHeader currentPage="login" />
    <main className="esnaf-login-main">
      <div className="esnaf-login-container">
        {/* Header */}

        <h1 className="esnaf-login-title">Esnaf Girişi</h1>
        <p className="esnaf-login-subtitle">Esnaf hesabınıza giriş yaparak hizmet vermeye başlayın</p>
        
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
          <a className="esnaf-modal-btn text-black" href="/" onClick={(e) => { e.preventDefault(); if (typeof window !== 'undefined') { window.location.href = '/'; } }}>Ana Sayfaya Dön</a>
        </div>
      </div>
    </main>
    {/* Footer intentionally hidden on auth page */}
    </>
  );
} 