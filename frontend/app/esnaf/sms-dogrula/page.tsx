'use client';

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/app/utils/api";

// UI Components
import Footer from "@/app/components/Footer";
import EsnafAuthHeader from "../../components/AuthHeader";

function SMSDogrulaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  
  const [smsCode, setSmsCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerifySMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !phone) {
      setError("Email veya telefon bilgisi eksik.");
      setIsLoading(false);
      return;
    }

    if (!smsCode || smsCode.length !== 6) {
      setError("6 haneli doğrulama kodunu girin.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.verifySMSCode({
        email: email,
        code: smsCode
      });

      if (response.status === 200) {
        toast.success("SMS doğrulama başarılı!");
        router.push("/esnaf/giris");
      } else {
        setError("Doğrulama başarısız. Lütfen tekrar deneyin.");
      }
    } catch (err: any) {
      console.log(err);
      let errorMsg = "Doğrulama başarısız. Lütfen tekrar deneyin.";
      if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSMS = async () => {
    setIsLoading(true);
    setError("");

    if (!email || !phone) {
      setError("Email veya telefon bilgisi eksik.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.sendSMSVerification({
        email: email,
        phone_number: phone
      });

      if (response.status === 200) {
        toast.success("SMS tekrar gönderildi!");
      } else {
        setError("SMS gönderilemedi. Lütfen tekrar deneyin.");
      }
    } catch (err: any) {
      console.log(err);
      let errorMsg = "SMS gönderilemedi. Lütfen tekrar deneyin.";
      if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !phone) {
      return (
    <>
      <EsnafAuthHeader currentPage="register" />
      <main className="esnaf-register-main">
        <div className="esnaf-register-container">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <h1 style={{ color: '#333', marginBottom: '16px' }}>Geçersiz İstek</h1>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
              Email veya telefon bilgisi eksik.
            </p>
            <button 
              onClick={() => router.push("/esnaf/kayit")}
              style={{
                backgroundColor: '#ffd600',
                color: '#111111',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Kayıt Sayfasına Dön
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

return (
  <>
    <EsnafAuthHeader currentPage="register" />
    <main className="esnaf-register-main">
      <div className="esnaf-register-container">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
          <h1 style={{ color: '#333', marginBottom: '16px' }}>SMS Doğrulama</h1>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
            <strong>{phone}</strong> numarasına gönderilen 6 haneli doğrulama kodunu girin.
          </p>
          
          <form onSubmit={handleVerifySMS} style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '24px',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  outline: 'none'
                }}
                maxLength={6}
                required
              />
            </div>
            
            {error && (
              <div style={{ 
                color: '#e74c3c', 
                marginBottom: '16px', 
                padding: '12px', 
                backgroundColor: '#fdf2f2', 
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                {error}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleResendSMS}
                disabled={isLoading}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                {isLoading ? 'Gönderiliyor...' : 'Tekrar Gönder'}
              </button>
              
              <button
                type="submit"
                disabled={isLoading || smsCode.length !== 6}
                style={{
                  backgroundColor: smsCode.length === 6 ? '#ffd600' : '#ddd',
                  color: smsCode.length === 6 ? '#111111' : '#666',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: (isLoading || smsCode.length !== 6) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {isLoading ? 'Doğrulanıyor...' : 'Doğrula'}
              </button>
            </div>
          </form>
          
          <div style={{ marginTop: '32px', fontSize: '14px', color: '#666' }}>
            <p>Kod gelmedi mi? Spam klasörünü kontrol edin veya tekrar gönder butonuna tıklayın.</p>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </>
);
}

export default function SMSDogrulaPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Yükleniyor...
      </div>
    }>
      <SMSDogrulaContent />
    </Suspense>
  );
} 