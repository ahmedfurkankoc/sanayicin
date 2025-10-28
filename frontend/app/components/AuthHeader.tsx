import React from "react";
import { useRouter } from "next/navigation";

interface AuthHeaderProps {
  currentPage: 'login' | 'register';
  segment?: 'esnaf' | 'musteri';
  theme?: 'yellow' | 'dark';
}

export default function AuthHeader({ currentPage, segment = 'esnaf', theme }: AuthHeaderProps) {
  const router = useRouter();

  const basePath = `/${segment}`;
  const resolvedTheme: 'yellow' | 'dark' = theme ?? (segment === 'musteri' ? 'dark' : 'yellow');
  const logoSrc = resolvedTheme === 'dark' ? '/sanayicin-esnaf-logo.png' : '/sanayicin-logo.png';
  const isEsnaf = segment === 'esnaf';
  const registerBtnClass = 'auth-btn auth-btn-register-alt';
  const loginBtnClass = isEsnaf ? registerBtnClass : 'auth-btn auth-btn-login';

  return (
    <div className={`auth-header ${resolvedTheme === 'dark' ? 'auth-header--dark' : ''}`}>
      <div className="auth-logo">
        <img 
          src={logoSrc}
          alt="Sanayicin"
          onClick={() => window.location.href = '/'}
          style={{ cursor: 'pointer' }}
        />
      </div>
      
      {/* Giriş/Kayıt Butonları */}
      <div className="auth-buttons">
        {currentPage === 'login' ? (
          <button 
            onClick={() => router.push(`${basePath}/kayit`)}
            className={registerBtnClass}
          >
            Kayıt Ol
          </button>
        ) : (
          <button 
            onClick={() => router.push(`${basePath}/giris`)}
            className={loginBtnClass}
          >
            Giriş Yap
          </button>
        )}
      </div>
    </div>
  );
} 