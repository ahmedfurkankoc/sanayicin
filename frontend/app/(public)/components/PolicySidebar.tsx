import React from "react";
import Link from "next/link";

function PolicySidebar() {
  return (
    <nav className="policy-sidebar-nav" aria-label="Politika ve Sözleşme Navigasyonu">
      <div className="policy-sidebar-group">
        <div className="policy-sidebar-group-title">Sözleşmeler ve Kurallar</div>
        <ul className="policy-sidebar-list">
          <li><Link href="/kullanici-sozlesmesi" className="policy-sidebar-link">Kullanıcı Sözleşmesi</Link></li>
          <li><Link href="/kullanim-kosullari" className="policy-sidebar-link">Kullanım Koşulları</Link></li>
          <li><Link href="/esnaf-sozlesmesi" className="policy-sidebar-link">Esnaf Sözleşmesi</Link></li>
          <li><Link href="/icerik-moderasyon-politikasi" className="policy-sidebar-link">İçerik Politikası</Link></li>
        </ul>
      </div>

      <div className="policy-sidebar-group">
        <div className="policy-sidebar-group-title">Kişisel Verilerin Korunması</div>
        <ul className="policy-sidebar-list">
          <li><Link href="/kvkk-aydinlatma-metni" className="policy-sidebar-link">KVKK Aydınlatma Metni</Link></li>
        </ul>
      </div>

      <div className="policy-sidebar-group">
        <div className="policy-sidebar-group-title">Çerez Yönetimi</div>
        <ul className="policy-sidebar-list">
          <li><Link href="/cerez-aydinlatma-metni" className="policy-sidebar-link">Çerez Aydınlatma Metni</Link></li>
          <li><Link href="/cerez-tercihleri" className="policy-sidebar-link">Çerez Tercihleri</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default PolicySidebar;

