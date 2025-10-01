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
            className="auth-btn auth-btn-register"
          >
            Kayıt Ol
          </button>
        ) : (
          <button 
            onClick={() => router.push(`${basePath}/giris`)}
            className="auth-btn auth-btn-login"
          >
            Giriş Yap
          </button>
        )}
      </div>
    </div>
  );
} 