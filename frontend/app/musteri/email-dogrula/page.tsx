'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/app/utils/api";
import MusteriHeader from "../components/MusteriHeader";
import MusteriFooter from "../components/MusteriFooter";

function EmailVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError("Doğrulama token'ı bulunamadı.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.verifyEmail({ token });
        
        if (response.status === 200) {
          setSuccess(true);
          setVerificationData(response.data);
          
          // 3 saniye sonra giriş sayfasına yönlendir
          setTimeout(() => {
            router.push('/musteri/giris?verified=true');
          }, 3000);
        } else {
          setError(response.data?.error || "Email doğrulama başarısız.");
        }
      } catch (err: any) {
        console.error('Email verification error:', err);
        const errorMessage = err.response?.data?.error || 
                            err.response?.data?.detail || 
                            "Email doğrulama sırasında hata oluştu.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  if (loading) {
    return (
      <>
        <MusteriHeader />
        <main className="musteri-auth-main">
          <div className="musteri-auth-container">
            <div className="musteri-auth-card">
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <h1 style={{ color: '#333', marginBottom: '16px' }}>Email Doğrulanıyor...</h1>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  Lütfen bekleyin, email adresiniz doğrulanıyor.
                </p>
              </div>
            </div>
          </div>
        </main>
        <MusteriFooter />
      </>
    );
  }

  if (success) {
    return (
      <>
        <MusteriHeader />
        <main className="musteri-auth-main">
          <div className="musteri-auth-container">
            <div className="musteri-auth-card">
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
                <h1 style={{ color: '#10b981', marginBottom: '16px' }}>Email Başarıyla Doğrulandı!</h1>
                <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
                  Tebrikler! Email adresiniz başarıyla doğrulandı.
                </p>
                
                {verificationData?.auto_upgraded && (
                  <div style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <p style={{ color: '#047857', margin: 0, fontWeight: 500 }}>
                      🎉 Hesabınız otomatik olarak esnaf hesabına yükseltildi!
                    </p>
                  </div>
                )}
                
                <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '32px' }}>
                  Artık giriş yapabilir ve platformumuzu kullanmaya başlayabilirsiniz.
                </p>
                
                <p style={{ color: '#999', fontSize: '14px', marginBottom: '32px' }}>
                  3 saniye sonra giriş sayfasına yönlendirileceksiniz...
                </p>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <Link href="/musteri/giris" className="musteri-auth-button">
                    Hemen Giriş Yap
                  </Link>
                  <Link href="/" className="musteri-auth-button" style={{ background: 'transparent', border: '1px solid #ddd', color: '#666' }}>
                    Ana Sayfaya Git
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
        <MusteriFooter />
      </>
    );
  }

  return (
    <>
      <MusteriHeader />
      <main className="musteri-auth-main">
        <div className="musteri-auth-container">
          <div className="musteri-auth-card">
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
              <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Email Doğrulama Başarısız</h1>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
                {error}
              </p>
              
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '32px'
              }}>
                <p style={{ color: '#991b1b', margin: 0, fontSize: '14px' }}>
                  Yaygın nedenler:
                </p>
                <ul style={{ color: '#991b1b', fontSize: '14px', textAlign: 'left', marginTop: '8px' }}>
                  <li>Doğrulama linkinin süresi dolmuş olabilir</li>
                  <li>Link daha önce kullanılmış olabilir</li>
                  <li>Geçersiz veya bozuk link olabilir</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link href="/musteri/kayit" className="musteri-auth-button">
                  Yeni Kayıt Ol
                </Link>
                <Link href="/musteri/giris" className="musteri-auth-button" style={{ background: 'transparent', border: '1px solid #ddd', color: '#666' }}>
                  Giriş Sayfasına Git
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <MusteriFooter />
    </>
  );
}

export default function MusteriEmailDogrulaPage() {
  return (
    <Suspense fallback={
      <>
        <MusteriHeader />
        <main className="musteri-auth-main">
          <div className="musteri-auth-container">
            <div className="musteri-auth-card">
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <h1 style={{ color: '#333', marginBottom: '16px' }}>Sayfa Yükleniyor...</h1>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  Lütfen bekleyin...
                </p>
              </div>
            </div>
          </div>
        </main>
        <MusteriFooter />
      </>
    }>
      <EmailVerificationContent />
    </Suspense>
  );
}
