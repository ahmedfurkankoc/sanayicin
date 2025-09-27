import React from "react";
import Icon from "@/app/components/ui/Icon";
import Image from "next/image";

const Footer = () => (
  <footer>
    <div className="footer-inner">
      <div className="footer-link-groups">
        <div className="footer-link-group">
          <Image 
            src="/sanayicin-logo.png"
            alt="Sanayicin Logo"
            width={200}
            height={40}
            className="footer-logo"
          />
          <a href="/nasil-calisir">Nasıl Çalışır?</a>
          <a href="/hakkimizda">Hakkımızda</a>
          <a href="#blog">Blog</a>
          <a href="/yardim">Yardım</a>
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
          <div className="footer-link-title">Sözleşmeler ve Kurallar</div>
          <a href="/kullanici-sozlesmesi">Kullanıcı Sözleşmesi</a>
          <a href="/kullanim-kosullari">Kullanım Koşulları</a>
          <a href="/kvkk-aydinlatma-metni">Kişisel Verilerin Korunması</a>
          <a href="/cerez-aydinlatma-metni">Çerez Yönetimi</a>
        </div>
      </div>
      
    </div>
    <div className="footer-socials">
        <a href="#" aria-label="Instagram" className="footer-social-link">
          <Icon name="instagram" size={22} color="#111" />
        </a>
        <a href="#" aria-label="X" className="footer-social-link">
          <Icon name="x-social" size={22} color="#111" />
        </a>
        <a href="#" aria-label="YouTube" className="footer-social-link">
          <Icon name="youtube" size={22} color="#111" />
        </a>
        <a href="#" aria-label="Facebook" className="footer-social-link">
          <Icon name="facebook" size={22} color="#111" />
        </a>
        <a href="#" aria-label="LinkedIn" className="footer-social-link">
          <Icon name="linkedin" size={22} color="#111" />
        </a>
      </div>
    <span className="footer-copyright">© {new Date().getFullYear()} Sanayicin. Tüm hakları saklıdır.</span>
  </footer>
);

export default Footer; 