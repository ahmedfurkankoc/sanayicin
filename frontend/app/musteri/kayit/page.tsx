'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setAuthEmail } from "@/app/utils/api";
import { iconMapping } from "@/app/utils/iconMapping";
import MusteriHeader from "../components/MusteriHeader";

export default function MusteriKayitPage() {
  const router = useRouter();
  
  // Step-based registration
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
    phone_number: ""
  });
  
  // Verification state
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms'>('email');
  const [verificationError, setVerificationError] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Konum bilgileri kayıt aşamasında alınmıyor

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Telefon için maskeleme: 555 555 55 55
    if (name === 'phone_number') {
      const digits = value.replace(/\D/g, '').slice(0, 10); // sadece 10 rakam
      let masked = digits;
      if (digits.length > 3) masked = `${digits.slice(0,3)} ${digits.slice(3)}`;
      if (digits.length > 6) masked = `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`;
      if (digits.length > 8) masked = `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,8)} ${digits.slice(8)}`;
      setFormData(prev => ({ ...prev, phone_number: masked }));
      return;
    }
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
        !formData.password || !formData.password2) {
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
    
    // Telefon numarası zorunlu ve 10 hane olmalı (555 555 55 55)
    const phoneDigits = formData.phone_number.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError("Telefon numarası 10 haneli olmalı (örn. 555 555 55 55)");
      return;
    }
    
    setLoading(true);

    try {
      // Backend'e +90 prefix ile gönder
      const payload = { ...formData, phone_number: `+90${phoneDigits}` };
      const response = await api.register(payload, 'client');
      
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
      </>
    );
  }

  return (
    <>
      <main className="musteri-auth-main musteri-register-split">
        <div className="musteri-register-wrapper">
          <aside className="musteri-register-left">
            <div className="mrl-inner">
              <div className="mrl-badges">
                <div className="mrl-item">
                  <div className="mrl-icon">{(() => { const Icon = iconMapping['wrench']; return <Icon size={22} />; })()}</div>
                  <div className="mrl-text">
                    <div className="mrl-title">Yüzlerce hizmet alanı</div>
                    <div className="mrl-sub">Aradığın usta kategorilere göre listelensin</div>
                  </div>
                </div>
                <div className="mrl-item">
                  <div className="mrl-icon">{(() => { const Icon = iconMapping['message']; return <Icon size={22} />; })()}</div>
                  <div className="mrl-text">
                    <div className="mrl-title">Teklifleri karşılaştır</div>
                    <div className="mrl-sub">En iyi fiyat ve zamanlamayı seç</div>
                  </div>
                </div>
                <div className="mrl-item">
                  <div className="mrl-icon">{(() => { const Icon = iconMapping['shield-check']; return <Icon size={22} />; })()}</div>
                  <div className="mrl-text">
                    <div className="mrl-title">Onaylı esnaf ağı</div>
                    <div className="mrl-sub">Değerlendirme ve doğrulama süreçlerinden geçmiş</div>
                  </div>
                </div>
                <div className="mrl-item">
                  <div className="mrl-icon">{(() => { const Icon = iconMapping['calendar']; return <Icon size={22} />; })()}</div>
                  <div className="mrl-text">
                    <div className="mrl-title">Randevu ve teyit</div>
                    <div className="mrl-sub">Uygun zamanını seç, anında onay al</div>
                  </div>
                </div>
                <div className="mrl-item">
                  <div className="mrl-icon">{(() => { const Icon = iconMapping['shield']; return <Icon size={22} />; })()}</div>
                  <div className="mrl-text">
                    <div className="mrl-title">Sanayicin güvencesi</div>
                    <div className="mrl-sub">Şeffaf süreç ve güvenli iletişim</div>
                  </div>
                </div>
              </div>
              <div className="mrc-card">
                <h2 className="mrc-title">Aradığın usta bir tık uzağında</h2>
                <p className="mrc-sub">Sanayicin ağına ücretsiz katıl, bölgendeki güvenilir işletmelere aynı anda ulaş ve ihtiyacın olan hizmet için saniyeler içinde birden fazla teklif al. Karşılaştır, bütçene ve zamanına en uygun olanı seçerek anında harekete geç.</p>
                <Link href="#register-form" className="mrc-btn" scroll={false}>
                  Hemen Başla
                  <span className="mrc-arrow">→</span>
                </Link>
              </div>
            </div>
          </aside>

          <div className="musteri-auth-container musteri-register-right">
            <div className="musteri-auth-card">
              <h1 className="musteri-auth-title">Müşteri Kayıt</h1>
              <p className="musteri-auth-subtitle">
                Hızlıca hesap oluşturun ve hizmet almaya başlayın
              </p>

            {/* Step 1: Form */}
            {step === 1 && (
              <form onSubmit={handleSubmitRegistration} className="musteri-auth-form" id="register-form">
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

                {/* Telefon Numarası (Zorunlu) */}
                <div className="musteri-form-group">
                  <label htmlFor="phone_number" className="musteri-form-label">
                    Telefon Numarası *
                  </label>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', background: '#fff' }}>
                    <span style={{ color: '#64748b', fontWeight: 600, marginRight: 8 }}>+90</span>
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      placeholder="555 555 55 55"
                      required
                      style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 0', background: 'transparent' }}
                    />
                  </div>
                </div>

                {/* İl/İlçe alanları kaldırıldı */}

                {/* Adres alanı kaldırıldı */}

                {/* Hakkımda alanı kaldırıldı */}

                <div className="musteri-form-group">
                    <label htmlFor="password" className="musteri-form-label">
                      Şifre *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onFocus={() => setShowPassword(true)}
                        className="musteri-form-input"
                        placeholder="En az 6 karakter"
                        required
                        minLength={6}
                        style={{ paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        onClick={() => setShowPassword(prev => !prev)}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          padding: 6,
                          cursor: 'pointer'
                        }}
                      >
                        {(() => { const Icon = iconMapping[showPassword ? 'eye-off' : 'eye']; return <Icon size={20} />; })()}
                      </button>
                    </div>
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

                 <p className="musteri-auth-legal">
                   "Hesap Oluştur"a tıklayarak
                   {" "}
                   <Link href="/kullanici-sozlesmesi" className="musteri-auth-legal-link">Kullanıcı Sözleşmesi</Link>
                   {" "}ve{" "}
                   <Link href="/kullanim-kosullari" className="musteri-auth-legal-link">Kullanım Koşulları</Link>
                   {" "}hükümlerini kabul etmiş,
                   {" "}
                   <Link href="/kvkk-aydinlatma-metni" className="musteri-auth-legal-link">Kişisel Verilerin Korunması Aydınlatma Metni</Link>
                   {" "}ile{" "}
                   <Link href="/cerez-aydinlatma-metni" className="musteri-auth-legal-link">Çerez Yönetimi</Link>
                   {" "}belgelerini okuduğunuzu onaylamış olursunuz.
                 </p>
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
                        SMS doğrulama yakında aktif olacak
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
        </div>
      </main>
    </>
  );
}