'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import MusteriHeader from "../components/MusteriHeader";
import OTPModal from "@/app/components/OTPModal";
import { api } from "@/app/utils/api";

export default function MusteriSifremiUnuttumPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [encryptedToken, setEncryptedToken] = useState<string | null>(null);
  const [phoneLast4, setPhoneLast4] = useState<string>('');
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    
    try {
      const response = await api.forgotPassword({ email });
      
      // OTP gerekiyorsa şifre formunu göster
      if (response.data?.requires_sms_verification && response.data?.encrypted_token) {
        setEncryptedToken(response.data.encrypted_token);
        setPhoneLast4(response.data.phone_last_4 || '');
        setShowPasswordForm(true);
        setMessage("Doğrulama kodu telefon numaranıza gönderildi. Lütfen yeni şifrenizi girin.");
      } else {
        // Sadece email gönderildi
      setMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || "Bir hata oluştu. Lütfen tekrar deneyin.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (code: string) => {
    if (!encryptedToken) {
      throw new Error('Doğrulama bilgileri eksik');
    }

    if (!newPassword || !newPassword2) {
      throw new Error('Lütfen yeni şifrenizi girin');
    }

    if (newPassword !== newPassword2) {
      throw new Error('Şifreler eşleşmiyor');
    }

    if (newPassword.length < 8) {
      throw new Error('Şifre en az 8 karakter olmalı');
    }

    try {
      const response = await api.resetPassword({
        encrypted_token: encryptedToken,
        sms_code: code,
        new_password: newPassword,
      });

      if (response.status === 200) {
        toast.success('Şifreniz başarıyla güncellendi!');
        setTimeout(() => {
          router.push('/musteri/giris');
        }, 1500);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Şifre sıfırlama başarısız';
      throw new Error(errorMsg);
    }
  };

  const handleOTPResend = async () => {
    try {
      const response = await api.forgotPassword({ email });
      
      if (response.data?.requires_sms_verification && response.data?.encrypted_token) {
        setEncryptedToken(response.data.encrypted_token);
        setPhoneLast4(response.data.phone_last_4 || '');
        toast.success('Doğrulama kodu tekrar gönderildi');
      } else {
        throw new Error('OTP gönderilemedi');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Kod gönderilemedi';
      throw new Error(errorMsg);
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

            {!showPasswordForm ? (
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
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newPassword || !newPassword2) {
                  setError('Lütfen yeni şifrenizi girin');
                  return;
                }
                if (newPassword !== newPassword2) {
                  setError('Şifreler eşleşmiyor');
                  return;
                }
                if (newPassword.length < 8) {
                  setError('Şifre en az 8 karakter olmalı');
                  return;
                }
                setError('');
                setShowOTPModal(true);
              }} className="musteri-auth-form">
                <div className="musteri-form-group">
                  <label htmlFor="new_password" className="musteri-form-label">
                    Yeni Şifre
                  </label>
                  <input
                    type="password"
                    id="new_password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="musteri-form-input"
                    placeholder="En az 8 karakter"
                    required
                    minLength={8}
                  />
                </div>

                <div className="musteri-form-group">
                  <label htmlFor="new_password2" className="musteri-form-label">
                    Yeni Şifre (Tekrar)
                  </label>
                  <input
                    type="password"
                    id="new_password2"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                    className="musteri-form-input"
                    placeholder="Şifrenizi tekrar girin"
                    required
                    minLength={8}
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
                >
                  Doğrulama Kodunu Gir
                </button>
              </form>
            )}

            {!showPasswordForm && (
            <div className="musteri-auth-links">
              <Link href="/musteri/giris" className="musteri-auth-link">
                Giriş Sayfasına Dön
              </Link>
              <span className="musteri-auth-divider">•</span>
              <Link href="/musteri/kayit" className="musteri-auth-link">
                Hesap Oluştur
              </Link>
            </div>
            )}
          </div>
        </div>
      </main>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
        }}
        onVerify={handleOTPVerify}
        onResend={handleOTPResend}
        phoneNumber={phoneLast4 ? `****${phoneLast4}` : undefined}
        title="Şifre Sıfırlama Doğrulama"
        subtitle="Telefon numaranıza gönderilen 6 haneli doğrulama kodunu girin"
      />
    </>
  );
}
