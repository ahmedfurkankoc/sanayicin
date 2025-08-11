'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function AuthModal({ isOpen, onClose, title = "Giriş Gerekli", message = "Bu özelliği kullanmak için giriş yapmanız veya hesap oluşturmanız gerekiyor." }: AuthModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2 className="auth-modal-title">{title}</h2>
          <button className="auth-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="auth-modal-body">
          <p className="auth-modal-message">{message}</p>

          <div className="auth-modal-tabs">
            <button
              className={`auth-modal-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Giriş Yap
            </button>
            <button
              className={`auth-modal-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Hesap Oluştur
            </button>
          </div>

          <div className="auth-modal-content">
            {activeTab === 'login' ? (
              <div className="auth-login-section">
                <h3>Mevcut Hesabınızla Giriş Yapın</h3>
                <p>Zaten hesabınız varsa giriş yaparak devam edin.</p>
                <button
                  className="auth-modal-button primary"
                  onClick={() => handleNavigate('/musteri/giris')}
                >
                  Giriş Yap
                </button>
              </div>
            ) : (
              <div className="auth-register-section">
                <h3>Yeni Hesap Oluşturun</h3>
                <p>Hızlıca hesap oluşturarak tüm özellikleri kullanın.</p>
                <button
                  className="auth-modal-button secondary"
                  onClick={() => handleNavigate('/musteri/kayit')}
                >
                  Hesap Oluştur
                </button>
              </div>
            )}
          </div>

          <div className="auth-modal-footer">
            <p className="auth-modal-info">
              Hesap oluşturduktan sonra email doğrulaması yapmanız gerekecektir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
