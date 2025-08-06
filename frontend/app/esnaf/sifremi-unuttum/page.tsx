'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/app/utils/api";
import EsnafAuthHeader from "../components/EsnafAuthHeader";
import EsnafFooter from "../components/EsnafFooter";

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.forgotPassword({ email });
      
      if (response.status === 200) {
        setSuccess(true);
        toast.success("Şifre sıfırlama linki email adresinize gönderildi.");
      }
    } catch (err: any) {
      console.error("Şifre sıfırlama hatası:", err);
      const errorMessage = err.response?.data?.detail || "Bir hata oluştu. Lütfen tekrar deneyin.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <EsnafAuthHeader title={'Şifremi Unuttum'} currentPage="register" />
        <main className="esnaf-login-main">
          <div className="esnaf-login-container">
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📧</div>
              <h1 style={{ color: '#333', marginBottom: '16px' }}>Email Gönderildi!</h1>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
                Şifre sıfırlama linki <strong>{email}</strong> adresine gönderildi. 
                Email'inizi kontrol edin ve linke tıklayarak şifrenizi yenileyin.
              </p>
              <div style={{ marginTop: '24px' }}>
                <Link 
                  href="/esnaf/giris"
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
                  Giriş Sayfasına Dön
                </Link>
              </div>
            </div>
          </div>
        </main>
        <EsnafFooter />
      </>
    );
  }

  return (
    <>
      <EsnafAuthHeader title={'Şifremi Unuttum'} currentPage="register" />
      <main className="esnaf-login-main">
        <div className="esnaf-login-container">
          <h1 className="esnaf-login-title">Şifrenizi mi Unuttunuz?</h1>
          <p style={{ 
            textAlign: 'center', 
            color: '#666', 
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            Email adresinizi girin, size şifre sıfırlama linki gönderelim.
          </p>
          
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
                autoComplete="email"
              />
            </div>
            
            <button type="submit" className="esnaf-login-btn" disabled={loading}>
              {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Linki Gönder"}
            </button>
          </form>

          <div className="esnaf-login-footer">
            <p>
              <Link href="/esnaf/giris" style={{ color: '#666', textDecoration: 'none' }}>
                ← Giriş Sayfasına Dön
              </Link>
            </p>
            <Link className="esnaf-modal-btn text-black" href="/">Ana Sayfaya Dön</Link>
          </div>
        </div>
      </main>
      <EsnafFooter />
    </>
  );
} 