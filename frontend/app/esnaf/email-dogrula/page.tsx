'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/app/utils/api";
import EsnafAuthHeader from "../components/EsnafAuthHeader";
import EsnafFooter from "../components/EsnafFooter";
import { useEsnaf } from "../context/EsnafContext";


function EmailDogrulaContent() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useEsnaf();
  
  // URL'den token parametresini al
  const token = searchParams.get('token');
  
  // Token varsa otomatik doğrula
  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (verificationToken: string) => {
    setVerifying(true);
    setError("");

    try {
      const response = await api.verifyEmail({ token: verificationToken });
      
      if (response.status === 200) {
        setSuccess(true);
        toast.success("Email başarıyla doğrulandı!");
        
        // Email doğrulandıktan sonra otomatik login yap
        try {
          // Email'i localStorage'dan al
          const email = localStorage.getItem("esnaf_email");
          const hashedPassword = localStorage.getItem("esnaf_temp_password_hash");
          
          if (email && hashedPassword) {
            const password = atob(hashedPassword); // Base64 decode
            
            // Login yap
            const loginResponse = await api.login({ email, password });
            
            if (loginResponse.status === 200) {
              // Token'ları localStorage'a kaydet
              const { access, refresh } = loginResponse.data;
              localStorage.setItem("esnaf_access_token", access);
              localStorage.setItem("esnaf_refresh_token", refresh);
              localStorage.setItem("esnaf_email", email);
              
              // Context'i güncelle
              await refreshUser();
              
              // localStorage'ı temizle
              localStorage.removeItem("esnaf_temp_password_hash");
              
              // 2 saniye sonra panele yönlendir
              setTimeout(() => {
                router.push("/esnaf/panel");
              }, 2000);
            } else {
              // Login başarısız, giriş sayfasına yönlendir
              setTimeout(() => {
                router.push("/esnaf/giris");
              }, 2000);
            }
          } else {
            // Email/password bulunamadı, giriş sayfasına yönlendir
            setTimeout(() => {
              router.push("/esnaf/giris");
            }, 2000);
          }
        } catch (loginError) {
          console.error("Login error:", loginError);
          // Login başarısız, giriş sayfasına yönlendir
          setTimeout(() => {
            router.push("/esnaf/giris");
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error("Token doğrulama hatası:", err);
      const errorMessage = err.response?.data?.error || "Geçersiz veya süresi dolmuş doğrulama linki.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    setError("");

    try {
      // Email'i localStorage'dan al
      const email = localStorage.getItem("esnaf_email");
      
      if (!email) {
        toast.error("Email bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        router.push("/esnaf/giris");
        return;
      }

      const response = await api.sendVerificationEmail({ email });
      
      if (response.status === 200) {
        toast.success("Doğrulama linki email adresinize gönderildi.");
      }
    } catch (err: any) {
      console.error("Email gönderme hatası:", err);
      const errorMessage = err.response?.data?.detail || "Bir hata oluştu. Lütfen tekrar deneyin.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <>
        <EsnafAuthHeader title="Email Doğrulama" />
        <main className="esnaf-login-main">
          <div className="esnaf-login-container">
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
              <h1 style={{ color: '#333', marginBottom: '16px' }}>Doğrulanıyor...</h1>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Email adresiniz doğrulanıyor, lütfen bekleyin.
              </p>
            </div>
          </div>
        </main>
        <EsnafFooter />
      </>
    );
  }

  if (success) {
    return (
      <>
        <EsnafAuthHeader title="Email Doğrulama" />
        <main className="esnaf-login-main">
          <div className="esnaf-login-container">
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h1 style={{ color: '#333', marginBottom: '16px' }}>Email Doğrulandı!</h1>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
                Email adresiniz başarıyla doğrulandı. Panele yönlendiriliyorsunuz...
              </p>
            </div>
          </div>
        </main>
        <EsnafFooter />
      </>
    );
  }

  return (
    <>
      <EsnafAuthHeader title="Email Doğrulama" />
      <main className="esnaf-login-main">
        <div className="esnaf-login-container">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📧</div>
            <h1 style={{ color: '#333', marginBottom: '16px' }}>Email Doğrulama</h1>
            
            {error && (
              <div style={{ 
                backgroundColor: '#fee', 
                color: '#c33', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '20px' 
              }}>
                {error}
              </div>
            )}
            
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
              Email doğrulama linki göndermek için aşağıdaki butona tıklayın.
            </p>
            
            <button 
              onClick={handleResendEmail}
              disabled={loading}
              style={{
                backgroundColor: '#ffd600',
                color: '#111111',
                padding: '15px 30px',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "Gönderiliyor..." : "Doğrulama Linki Gönder"}
            </button>
            
            <div style={{ marginTop: '24px' }}>
              <Link className="esnaf-modal-btn text-black" href="/">Ana Sayfaya Dön</Link>
            </div>
          </div>
        </div>
      </main>
      <EsnafFooter />
    </>
  );
}

export default function EmailDogrulaPage() {
  return (
    <Suspense fallback={
      <>
        <EsnafAuthHeader title="Email Doğrulama" />
        <main className="esnaf-login-main">
          <div className="esnaf-login-container">
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
              <h1 style={{ color: '#333', marginBottom: '16px' }}>Yükleniyor...</h1>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Sayfa yükleniyor, lütfen bekleyin.
              </p>
            </div>
          </div>
        </main>
        <EsnafFooter />
      </>
    }>
      <EmailDogrulaContent />
    </Suspense>
  );
} 