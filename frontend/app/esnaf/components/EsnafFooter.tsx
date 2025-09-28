import React from "react";
import Icon from "@/app/components/ui/Icon";

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
            <a href="/yardim" className="esnaf-footer-link">Destek</a>
            <a href="/hakkimizda" className="esnaf-footer-link">Hakkımızda</a>
            <a href="/iletisim" className="esnaf-footer-link">İletişim</a>
          </div>
          <div className="esnaf-footer-link-group">
            <div className="esnaf-footer-link-group-title">Sözleşmeler ve Kurallar</div>
            <a href="/kullanici-sozlesmesi" className="esnaf-footer-link">Kullanıcı Sözleşmesi</a>
            <a href="/kullanim-kosullari" className="esnaf-footer-link">Kullanım Koşulları</a>
            <a href="/kvkk-aydinlatma-metni" className="esnaf-footer-link">Kişisel Verilerin Korunması</a>
            <a href="/cerez-aydinlatma-metni" className="esnaf-footer-link">Çerez Yönetimi</a>
          </div>
        </div>
        <div className="esnaf-footer-socials">
          <a href="#" className="esnaf-footer-social-icon" aria-label="Instagram">
            <Icon name="instagram" size={18} color="#111" />
          </a>
          <a href="#" className="esnaf-footer-social-icon" aria-label="X">
            <Icon name="x-social" size={18} color="#111" />
          </a>
          <a href="#" className="esnaf-footer-social-icon" aria-label="YouTube">
            <Icon name="youtube" size={18} color="#111" />
          </a>
          <a href="#" className="esnaf-footer-social-icon" aria-label="Facebook">
            <Icon name="facebook" size={18} color="#111" />
          </a>
          <a href="#" className="esnaf-footer-social-icon" aria-label="LinkedIn">
            <Icon name="linkedin" size={18} color="#111" />
          </a>
        </div>
      </div>
      <div className="esnaf-footer-copyright">
        © 2025 Sanayicin. Tüm hakları saklıdır.
      </div>
    </footer>
  );
} 