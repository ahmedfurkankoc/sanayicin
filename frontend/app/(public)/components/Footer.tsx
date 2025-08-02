import React from "react";

const Footer = () => (
  <footer>
    <div className="footer-inner">
      <div className="footer-link-groups">
        <div className="footer-link-group">
          <span className="footer-logo">SANAYİCİN</span>
          <a href="/nasil-calisir">Nasıl Çalışır?</a>
          <a href="/hakkimizda">Hakkımızda</a>
          <a href="#blog">Blog</a>
          <a href="/iletisim">İletişim</a>
        </div>
        <div className="footer-link-group">
          <div className="footer-link-title">Hizmetlerimiz</div>
          <a href="/usta-ariyorum">Usta Arıyorum</a>
          <a href="/en-yakin">En Yakın</a>
        </div>
        <div className="footer-link-group">
          <div className="footer-link-title">Esnaf</div>
          <a href="/neden-esnaf">Neden Esnaf Olmalıyım?</a>
          <a href="/hizmet-vermek">Hizmet Vermek İstiyorum</a>
        </div>
        <div className="footer-link-group">
          <div className="footer-link-title">Gizlilik ve Kullanım</div>
          <a href="#kvkk">KVKK ve Gizlilik Politikası</a>
          <a href="#kullanim">Kullanım Koşulları</a>
        </div>
      </div>
      
    </div>
    <div className="footer-socials">
        <a href="#" aria-label="Instagram" className="footer-social-link">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="5" stroke="#111" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="#111" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1" fill="#111"/></svg>
        </a>
        <a href="#" aria-label="X" className="footer-social-link">
          <svg width="22" height="22" viewBox="0 0 300 271" xmlns="http://www.w3.org/2000/svg"><path d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z"/></svg>
        </a>
        <a href="#" aria-label="YouTube" className="footer-social-link">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect width="18" height="14" x="3" y="5" rx="3" stroke="#111" strokeWidth="2"/><polygon points="10,9 16,12 10,15" fill="#111"/></svg>
        </a>
        <a href="#" aria-label="Facebook" className="footer-social-link">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <rect width="18" height="18" x="3" y="3" rx="4" stroke="#111" strokeWidth="2"/>
            <text x="12" y="17" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#111" fontFamily="Arial">f</text>
          </svg>
        </a>
        <a href="#" aria-label="LinkedIn" className="footer-social-link">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="4" stroke="#111" strokeWidth="2"/><path d="M8 11v5" stroke="#111" strokeWidth="2" strokeLinecap="round"/><circle cx="8" cy="8" r="1" fill="#111"/><path d="M12 16v-3a2 2 0 1 1 4 0v3" stroke="#111" strokeWidth="2" strokeLinecap="round"/></svg>
        </a>
      </div>
    <span className="footer-copyright">© {new Date().getFullYear()} Sanayicin. Tüm hakları saklıdır.</span>
  </footer>
);

export default Footer; 