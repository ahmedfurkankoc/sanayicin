'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMusteri } from "../context/MusteriContext";
import MusteriHeader from "../components/MusteriHeader";

export default function MusteriGirisPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated, login } = useMusteri();

  // Eğer kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/musteri");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        router.push("/musteri");
      } else {
        setError("Giriş başarısız. Bilgilerinizi kontrol edin.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Giriş başarısız. Bilgilerinizi kontrol edin.");
    } finally {
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
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
