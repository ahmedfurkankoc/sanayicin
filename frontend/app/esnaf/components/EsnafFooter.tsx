import React from "react";

export default function EsnafFooter() {
  return (
    <footer className="esnaf-footer">
      <div className="esnaf-footer-inner">
        <div className="esnaf-footer-link-groups">
          <div className="esnaf-footer-link-group">
            <div className="esnaf-footer-link-group-title">Sanayicin</div>
            <a href="/esnaf/kayit" className="esnaf-footer-link">Kayıt Ol</a>
            <a href="/esnaf/giris" className="esnaf-footer-link">Giriş Yap</a>
            <a href="/esnaf/panel" className="esnaf-footer-link">Panel</a>
          </div>
          <div className="esnaf-footer-link-group">
            <div className="esnaf-footer-link-group-title">Yardım</div>
            <a href="/hakkimizda" className="esnaf-footer-link">Hakkımızda</a>
            <a href="/iletisim" className="esnaf-footer-link">İletişim</a>
          </div>
          <div className="esnaf-footer-link-group">
            <div className="esnaf-footer-link-group-title">Gizlilik ve Kullanım</div>
            <a href="/kvkk" className="esnaf-footer-link">KVKK ve Gizlilik</a>
            <a href="/kullanim-kosullari" className="esnaf-footer-link">Kullanım Koşulları</a>
          </div>
        </div>
        <div className="esnaf-footer-socials">
          <a href="#" className="esnaf-footer-social-icon" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="6" stroke="#111" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="#111" strokeWidth="2"/><circle cx="17" cy="7" r="1.2" fill="#111"/></svg></a>
          <a href="#" className="esnaf-footer-social-icon" aria-label="X"><svg width="18" height="18" viewBox="0 0 300 271" xmlns="http://www.w3.org/2000/svg"><path d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z"/></svg></a>
          <a href="#" className="esnaf-footer-social-icon" aria-label="YouTube"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="4" stroke="#111" strokeWidth="2"/><path d="M10 9.5v5l5-2.5-5-2.5z" fill="#111"/></svg></a>
          <a href="#" className="esnaf-footer-social-icon" aria-label="Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="6" stroke="#111" strokeWidth="2"/><path d="M16 8h-2a2 2 0 0 0-2 2v2h4v2h-4v6h-2v-6H8v-2h2v-2a4 4 0 0 1 4-4h2v2z" fill="#111"/></svg></a>
          <a href="#" className="esnaf-footer-social-icon" aria-label="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="6" stroke="#111" strokeWidth="2"/><path d="M7 10v7M7 7v.01M12 17v-4a2 2 0 1 1 4 0v4" stroke="#111" strokeWidth="2" strokeLinecap="round"/></svg></a>
        </div>
      </div>
      <div className="esnaf-footer-copyright">
        © 2025 Sanayicin. Tüm hakları saklıdır.
      </div>
    </footer>
  );
} 