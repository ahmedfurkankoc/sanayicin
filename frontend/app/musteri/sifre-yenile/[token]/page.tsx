'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/app/utils/api";
import MusteriHeader from "../../components/MusteriHeader";

export default function SifreYenilePage() {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  useEffect(() => {
    // Token kontrolü yapılabilir (opsiyonel)
    if (!token) {
      setTokenValid(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== password2) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }

    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.resetPassword({ 
        uidb64: token.split('/')[0], // URL'den uidb64'ü al
        token: token.split('/')[1], // URL'den token'ı al
        new_password: password
      });
      
      if (response.status === 200) {
        setSuccess(true);
        toast.success("Şifreniz başarıyla güncellendi!");
      }
    } catch (err: any) {
      console.error("Şifre yenileme hatası:", err);
      const errorMessage = err.response?.data?.detail || "Bir hata oluştu. Lütfen tekrar deneyin.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <>
        <MusteriHeader />
        <main className="musteri-login-main">
          <div className="musteri-login-container">
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
              <h1 style={{ color: '#333', marginBottom: '16px' }}>Geçersiz Link</h1>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
                Bu şifre sıfırlama linki geçersiz veya süresi dolmuş. 
                Lütfen yeni bir şifre sıfırlama linki talep edin.
              </p>
              <Link 
                href="/musteri/sifremi-unuttum"
                style={{
                  backgroundColor: '#ffd600',
                  color: '#111111',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  display: 'inline-block'
                }}
              >
                Yeni Link Talep Et
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (success) {
    return (
      <>
        <MusteriHeader />
        <main className="musteri-login-main">
          <div className="musteri-login-container">
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h1 style={{ color: '#333', marginBottom: '16px' }}>Şifre Güncellendi!</h1>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
                Şifreniz başarıyla güncellendi. Artık yeni şifrenizle giriş yapabilirsiniz.
              </p>
              <Link 
                href="/musteri/giris"
                style={{
                  backgroundColor: '#ffd600',
                  color: '#111111',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  display: 'inline-block'
                }}
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <MusteriHeader />
      <main className="musteri-login-main">
        <div className="musteri-login-container">
          <h1 className="musteri-login-title">Yeni Şifrenizi Belirleyin</h1>
          <p style={{ 
            textAlign: 'center', 
            color: '#666', 
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            Güvenli bir şifre seçin ve tekrar girin.
          </p>
          
          <form onSubmit={handleSubmit} className="musteri-login-form">
            <div className="musteri-input-group">
              <label className="musteri-login-label">Yeni Şifre</label>
              <input
                type="password"
                className="musteri-login-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            
            <div className="musteri-input-group">
              <label className="musteri-login-label">Yeni Şifre Tekrar</label>
              <input
                type="password"
                className="musteri-login-input"
                value={password2}
                onChange={e => setPassword2(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            
            <button type="submit" className="musteri-login-btn" disabled={loading}>
              {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </form>

          <div className="musteri-login-footer">
            <p>
              <Link href="/musteri/giris" style={{ color: '#666', textDecoration: 'none' }}>
                ← Giriş Sayfasına Dön
              </Link>
            </p>
            <Link className="musteri-modal-btn text-black" href="/">Ana Sayfaya Dön</Link>
          </div>
        </div>
      </main>
    </>
  );
}
