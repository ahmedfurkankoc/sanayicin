import React from "react";
import { useRouter } from "next/navigation";

interface EsnafAuthHeaderProps {
  title: string;
  currentPage: 'login' | 'register';
}

export default function EsnafAuthHeader({ title, currentPage }: EsnafAuthHeaderProps) {
  const router = useRouter();

  return (
    <div className="esnaf-login-header">
      <div className="esnaf-login-logo">
        <img 
          src="/sanayicin-logo.png" 
          alt="Sanayicin" 
          onClick={() => router.push('/')}
          style={{ cursor: 'pointer' }}
        />
        <div className="esnaf-login-subtitle">{title}</div>
      </div>
      
      {/* Giriş/Kayıt Butonları */}
      <div className="esnaf-auth-buttons">
        {currentPage === 'login' ? (
          <button 
            onClick={() => router.push('/esnaf/kayit')}
            className="esnaf-auth-btn esnaf-auth-btn-register"
          >
            Kayıt Ol
          </button>
        ) : (
          <button 
            onClick={() => router.push('/esnaf/giris')}
            className="esnaf-auth-btn esnaf-auth-btn-login"
          >
            Giriş Yap
          </button>
        )}
      </div>
    </div>
  );
} 