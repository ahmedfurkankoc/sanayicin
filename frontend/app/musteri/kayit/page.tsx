'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setAuthEmail } from "@/app/utils/api";
import { useTurkeyData } from "@/app/hooks/useTurkeyData";
import MusteriHeader from "../components/MusteriHeader";
import MusteriFooter from "../components/MusteriFooter";

export default function MusteriKayitPage() {
  const router = useRouter();
  const { cities, loadTurkeyData, getDistricts } = useTurkeyData();
  
  // Step-based registration
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
    phone: "",
    city: "",
    district: "",
    address: "",
    about: ""
  });
  
  // Verification state
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms'>('email');
  const [verificationError, setVerificationError] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  
  const [districts, setDistricts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Şehir verisini yükle
  React.useEffect(() => {
    loadTurkeyData();
  }, [loadTurkeyData]);

  // İl değişince ilçeleri güncelle
  React.useEffect(() => {
    if (formData.city) {
      setDistricts(getDistricts(formData.city));
      setFormData(prev => ({ ...prev, district: "" }));
    } else {
      setDistricts([]);
      setFormData(prev => ({ ...prev, district: "" }));
    }
  }, [formData.city, getDistricts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };



  const handleBackStep = () => {
    setStep(1);
    setError("");
  };

  const handleVerificationMethodSelect = (method: 'email' | 'sms') => {
    // SMS seçeneği devre dışı, sadece email seçilebilir
    if (method === 'sms') {
      return; // SMS seçimini engelle
    }
    setVerificationMethod(method);
    setVerificationError("");
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError("");
    setLoading(true);

    if (!verificationMethod) {
      setVerificationError("Lütfen bir doğrulama yöntemi seçin.");
      setLoading(false);
      return;
    }

    try {
      if (verificationMethod === 'email') {
        // Email doğrulama gönder
        const response = await api.sendVerificationEmail({
          email: formData.email
        });
        
        if (response.status === 200) {
          setVerificationEmail(formData.email);
          setStep(3); // Email verification step
        } else {
          setVerificationError("Email gönderilemedi. Lütfen tekrar deneyin.");
        }
      } else if (verificationMethod === 'sms') {
        // SMS doğrulama devre dışı
        setVerificationError("SMS doğrulama şu anda kullanılamıyor. Lütfen email doğrulama seçin.");
        return;
      }
    } catch (err: any) {
      console.log(err);
      let errorMsg = "Doğrulama gönderilemedi. Lütfen tekrar deneyin.";
      if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }
      setVerificationError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!formData.first_name || !formData.last_name || !formData.email || 
        !formData.phone || !formData.city || !formData.district || 
        !formData.address || !formData.password || !formData.password2) {
      setError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    
    if (formData.password !== formData.password2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }
    
    // Phone validation
    const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Geçerli bir telefon numarası girin.");
      return;
    }
    
    setLoading(true);

    try {
      const response = await api.register(formData, 'client');
      
      if (response.status === 201) {
        // Email bilgisini localStorage'a kaydet
        if (typeof window !== "undefined") {
          setAuthEmail("client", formData.email);
          // Password'ü hash'leyerek sakla (email verification sonrası login için)
          const hashedPassword = btoa(formData.password); // Base64 encoding (basit hash)
          localStorage.setItem("client_temp_password_hash", hashedPassword);
        }
        // Doğrulama seçimi adımına yönlendir
        setStep(2); // Verification method selection step
        setVerificationEmail(formData.email); // Email'i sakla
      } else {
        setError(response.data?.detail || "Kayıt sırasında bir hata oluştu.");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          "Kayıt sırasında bir hata oluştu.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <MusteriHeader />
        <main className="musteri-auth-main">
          <div className="musteri-auth-container">
            <div className="musteri-auth-card">
              <div className="musteri-success-message">
                <h2>Kayıt Başarılı!</h2>
                <p>Hesabınız başarıyla oluşturuldu. Email doğrulama kodu gönderildi.</p>
                <p>Giriş sayfasına yönlendiriliyorsunuz...</p>
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
            <h1 className="musteri-auth-title">Müşteri Kayıt</h1>
            <p className="musteri-auth-subtitle">
              Hızlıca hesap oluşturun ve hizmet almaya başlayın
            </p>

            {/* Step 1: Form */}
            {step === 1 && (
              <form onSubmit={handleSubmitRegistration} className="musteri-auth-form">
                <div className="musteri-form-row">
                  <div className="musteri-form-group">
                    <label htmlFor="first_name" className="musteri-form-label">
                      Ad *
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="musteri-form-input"
                      placeholder="Adınız"
                      required
                    />
                  </div>

                  <div className="musteri-form-group">
                    <label htmlFor="last_name" className="musteri-form-label">
                      Soyad *
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="musteri-form-input"
                      placeholder="Soyadınız"
                      required
                    />
                  </div>
                </div>

                <div className="musteri-form-group">
                  <label htmlFor="email" className="musteri-form-label">
                    E-posta Adresi *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="ornek@email.com"
                    required
                  />
                </div>

                <div className="musteri-form-group">
                  <label htmlFor="phone" className="musteri-form-label">
                    Telefon Numarası *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="0555 123 45 67"
                    required
                  />
                </div>

                <div className="musteri-form-row">
                  <div className="musteri-form-group">
                    <label htmlFor="city" className="musteri-form-label">
                      İl *
                    </label>
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="musteri-form-input"
                      required
                    >
                      <option value="">İl seçiniz</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div className="musteri-form-group">
                    <label htmlFor="district" className="musteri-form-label">
                      İlçe *
                    </label>
                    <select
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="musteri-form-input"
                      required
                      disabled={!formData.city}
                    >
                      <option value="">İlçe seçiniz</option>
                      {districts.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="musteri-form-group">
                  <label htmlFor="address" className="musteri-form-label">
                    Adres *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="Detaylı adres bilgisi"
                    rows={3}
                    required
                  />
                </div>

                <div className="musteri-form-group">
                  <label htmlFor="about" className="musteri-form-label">
                    Hakkımda
                  </label>
                  <textarea
                    id="about"
                    name="about"
                    value={formData.about}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="Kendiniz hakkında kısa bilgi (opsiyonel)"
                    rows={3}
                  />
                </div>

                <div className="musteri-form-row">
                  <div className="musteri-form-group">
                    <label htmlFor="password" className="musteri-form-label">
                      Şifre *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="musteri-form-input"
                      placeholder="En az 6 karakter"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="musteri-form-group">
                    <label htmlFor="password2" className="musteri-form-label">
                      Şifre Tekrar *
                    </label>
                    <input
                      type="password"
                      id="password2"
                      name="password2"
                      value={formData.password2}
                      onChange={handleInputChange}
                      className="musteri-form-input"
                      placeholder="Şifrenizi tekrar girin"
                      required
                      minLength={6}
                    />
                  </div>
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
                   {loading ? "Kayıt yapılıyor..." : "Hesap Oluştur"}
                 </button>
              </form>
            )}

            {/* Step 2: Verification Method Selection */}
            {step === 2 && (
              <form onSubmit={handleSubmitVerification} className="musteri-auth-form">
                <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#333' }}>
                  Doğrulama Yöntemi Seçin
                </h2>
                <p style={{ textAlign: 'center', marginBottom: '32px', color: '#666' }}>
                  Hesabınızı doğrulamak için bir yöntem seçin
                </p>
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                  <label 
                    className={`musteri-verification-option${verificationMethod === 'email' ? " selected" : ""}`}
                    style={{ flex: 1, textAlign: 'center', padding: '20px', border: '2px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="email"
                      checked={verificationMethod === 'email'}
                      onChange={() => handleVerificationMethodSelect('email')}
                      required
                    />
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>📧</div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Email ile Doğrulama</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {formData.email} adresine doğrulama linki gönderilir
                      </div>
                    </div>
                  </label>
                  
                  <label 
                    className={`musteri-verification-option${verificationMethod === 'sms' ? " selected" : ""}`}
                    style={{ 
                      flex: 1, 
                      textAlign: 'center', 
                      padding: '20px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      opacity: 0.5,
                      cursor: 'not-allowed',
                      position: 'relative'
                    }}
                  >
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="sms"
                      checked={verificationMethod === 'sms'}
                      onChange={() => handleVerificationMethodSelect('sms')}
                      required
                      disabled
                      style={{ cursor: 'not-allowed' }}
                    />
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>📱</div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>SMS ile Doğrulama</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {formData.phone} numarasına doğrulama kodu gönderilir
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#ff6b6b', 
                        marginTop: '8px',
                        fontWeight: 'bold'
                      }}>
                        ⚠️ Yakında Aktif Olacak
                      </div>
                    </div>
                  </label>
                </div>
                
                {verificationError && <div className="musteri-error-message">{verificationError}</div>}
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button type="button" className="musteri-auth-button" onClick={handleBackStep}>
                    Geri
                  </button>
                  <button 
                    type="submit" 
                    className="musteri-auth-button"
                    disabled={!verificationMethod || loading}
                  >
                    {loading ? "Gönderiliyor..." : "Doğrulama Gönder"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Email Verification Sent */}
            {step === 3 && verificationEmail && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📧</div>
                <h1 style={{ color: '#333', marginBottom: '16px' }}>Kayıt Tamamlandı!</h1>
                <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
                  Email adresinize doğrulama linki gönderildi. 
                  <strong>{verificationEmail}</strong> adresindeki email'i kontrol edin ve 
                  doğrulama linkine tıklayın.
                </p>
                <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '32px' }}>
                  Doğrulama tamamlandıktan sonra giriş yapabilirsiniz.
                </p>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button 
                    type="button" 
                    className="musteri-auth-button"
                    onClick={() => {
                      // Email doğrulama tekrar gönder
                      handleSubmitVerification(new Event('submit') as any);
                    }}
                  >
                    Tekrar Gönder
                  </button>
                  <Link href="/musteri/giris" className="musteri-auth-button">
                    Giriş Sayfasına Git
                  </Link>
                </div>
              </div>
            )}

            <div className="musteri-auth-footer">
              <p>
                Zaten hesabınız var mı?{" "}
                <Link href="/musteri/giris" className="musteri-auth-link-bold">
                  Giriş yapın
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <MusteriFooter />
    </>
  );
}
