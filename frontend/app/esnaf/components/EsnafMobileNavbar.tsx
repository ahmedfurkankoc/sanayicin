'use client';

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { clearAuthTokens } from '@/app/utils/api';
import NotificationBell from '@/app/components/NotificationBell';
import { iconMapping } from '@/app/utils/iconMapping';

const EsnafMobileNavbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest('.public-mobile-search')) return;
      if (target.closest('.public-mobile-search-toggle')) return;
      setShowSearch(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Close menu when route changes (e.g., via bottom navbar navigation)
  useEffect(() => {
    if (menuOpen) setMenuOpen(false);
  }, [pathname]);

  // Mobile only navbar: no sticky/scroll behavior needed

  // Esnaf mobil navbar: client/vendor ayrımı yapılmaz; UI vendor için

  const handleEsnafGiris = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/esnaf/giris");
  };

  // Çıkış fonksiyonu
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    clearAuthTokens('vendor');
    // Sadece sayfayı yenile - middleware doğru yere yönlendirecek
    setTimeout(() => window.location.reload(), 200);
  };

  // Panel veya hesabım butonu
  const handlePanel = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/esnaf/panel');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/musteri/esnaflar?q=${encodeURIComponent(q)}`);
    setMenuOpen(false);
  };

  return (
    <nav className={`sanayicin-navbar`}>
      <div className="sanayicin-navbar-inner">
        <div className="sanayicin-logo-section">
          <Link href="/esnaf/panel" className="sanayicin-logo-link">
            <img src="/sanayicin-logo.png" alt="Sanayicin Logo" className="sanayicin-logo-icon" />
          </Link>
        </div>
        {/* Mobile-only search icon + dropdown (left/center of navbar) */}
        <div className="public-mobile-search mobile-only">
          <button
            type="button"
            className={`public-mobile-search-toggle${showSearch ? ' active' : ''}`}
            aria-label="Ara"
            onClick={() => setShowSearch((v) => !v)}
          >
            {React.createElement(iconMapping.search, { size: 20 })}
          </button>
          <div className={`public-mobile-search-dropdown${showSearch ? ' show' : ''}`}>
            <form onSubmit={handleSearch} className="public-mobile-search-form" role="search" aria-label="Site içinde ara">
              <input
                type="text"
                className="public-mobile-search-input"
                placeholder="Hizmet ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Arama"
                autoFocus
              />
              <button type="submit" className="public-mobile-search-btn" aria-label="Ara">
                {React.createElement(iconMapping.search, { size: 18 })}
              </button>
            </form>
          </div>
          {/* Mobile: notification bell */}
          <NotificationBell iconColor="var(--black)" />
        </div>
        <button
          className={`sanayicin-hamburger${menuOpen ? ' is-open' : ''}`}
          aria-label="Menüyü Aç/Kapat"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={menuOpen ? "hamburger-bar open" : "hamburger-bar"}></span>
          <span className={menuOpen ? "hamburger-bar open" : "hamburger-bar"}></span>
          <span className={menuOpen ? "hamburger-bar open" : "hamburger-bar"}></span>
        </button>
        <ul className={`sanayicin-menu-links${menuOpen ? " open" : ""}`}>
          <li>
            <a href="/esnaf/panel" onClick={handlePanel}>Esnaf Paneli</a>
          </li>
          <li>
            <a href="/esnaf/panel/mesajlar">Mesajlar</a>
          </li>
          <li>
            <a href="/esnaf/randevularim">Randevularım</a>
          </li>
          <li>
            <a href="/esnaf/takvim">Takvim</a>
          </li>
          <li>
            <a href="/esnaf/yorumlar">Yorumlar</a>
          </li>
          <li>
            <a href="/esnaf/taleplerim">Taleplerim</a>
          </li>
          <li>
            <a href="/esnaf/ayarlar">Ayarlar</a>
          </li>
          <li>
            <a href="#logout" className="logout-btn" onClick={handleLogout}>
              {React.createElement(iconMapping.logout, { size: 16 })}
              <span style={{ marginLeft: 6 }}>Çıkış</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default EsnafMobileNavbar; 