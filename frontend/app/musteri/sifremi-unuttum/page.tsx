'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MusteriHeader from "../components/MusteriHeader";

export default function MusteriSifremiUnuttumPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    
    try {
      // TODO: API endpoint'i eklenecek
      // const response = await api.forgotPassword({ email });
      
      // Şimdilik mock response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
    } catch (err: any) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="musteri-auth-main">
        <div className="musteri-auth-container">
          <div className="musteri-auth-card">
            <h1 className="musteri-auth-title">Şifremi Unuttum</h1>
            <p className="musteri-auth-subtitle">
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim
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

              {error && (
                <div className="musteri-error-message">
                  {error}
                </div>
              )}

              {message && (
                <div className="musteri-success-message">
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="musteri-auth-button"
                disabled={loading}
              >
                {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>

            <div className="musteri-auth-links">
              <Link href="/musteri/giris" className="musteri-auth-link">
                Giriş Sayfasına Dön
              </Link>
              <span className="musteri-auth-divider">•</span>
              <Link href="/musteri/kayit" className="musteri-auth-link">
                Hesap Oluştur
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
