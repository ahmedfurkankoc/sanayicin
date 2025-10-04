'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthToken, clearAuthTokens } from '@/app/utils/api';
import NotificationBell from '@/app/components/NotificationBell';
import { iconMapping } from '@/app/utils/iconMapping';

const Navbar = () => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [userType, setUserType] = useState<string | null>(null); // 'vendor' | 'client' | null
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Disable sticky behavior on mobile (<= 900px) - navbar is always fixed on mobile
    if (window.innerWidth <= 900) {
      setShowSticky(false);
      return;
    }
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 80) {
        setShowSticky(false);
      } else if (currentY < lastScrollY) {
        setShowSticky(true);
      } else {
        setShowSticky(false);
      }
      setLastScrollY(currentY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Kullanıcı tipini kontrol et - sadece UI için, yönlendirme yapma
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vendorToken = getAuthToken('vendor');
    const clientToken = getAuthToken('client');
    
    // Vendor token varsa hem vendor hem client olarak davran
    if (vendorToken) {
      setUserType('vendor');
    } else if (clientToken) {
      setUserType('client');
    } else {
      setUserType(null);
    }
  }, []);

  const handleEsnafGiris = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Token kontrolü - sadece UI için
    const token = getAuthToken("vendor");
    
    if (token) {
      // Token varsa direkt panel'e yönlendir
      setIsCheckingAuth(true);
      router.push("/esnaf/panel");
    } else {
      // Token yoksa giriş sayfasına yönlendir
      router.push("/esnaf/giris");
    }
  };

  // Çıkış fonksiyonu
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    if (userType === 'vendor') {
      clearAuthTokens('vendor');
    } else if (userType === 'client') {
      clearAuthTokens('client');
    }
    setUserType(null);
    // Sadece sayfayı yenile - middleware doğru yere yönlendirecek
    setTimeout(() => window.location.reload(), 200);
  };

  // Panel veya hesabım butonu
  const handlePanel = (e: React.MouseEvent) => {
    e.preventDefault();
    if (userType === 'vendor') {
      router.push('/esnaf/panel');
    } else if (userType === 'client') {
      router.push('/musteri/hesabim');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/musteri/esnaflar?q=${encodeURIComponent(q)}`);
    setMenuOpen(false);
  };

  return (
    <nav className={`sanayicin-navbar${showSticky ? " sticky-navbar" : ""}`}>
      <div className="sanayicin-navbar-inner">
        <div className="sanayicin-logo-section">
          <Link href="/" className="sanayicin-logo-link">
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
          <li><a href="/nasil-calisir">Nasıl Çalışır</a></li>
          <li><a href="/yardim">Yardım</a></li>
          {userType === null && (
            <>
          <li><a href="/musteri/giris">Giriş Yap</a></li>
              <li>
                <a 
                  href="/esnaf/giris" 
                  className={`${isCheckingAuth ? " disabled" : ""}`}
                  onClick={handleEsnafGiris}
                  style={{ pointerEvents: isCheckingAuth ? "none" : "auto" }}
                >
                  Esnaf Girişi
                </a>
              </li>
            </>
          )}
          {userType === 'vendor' && (
            <>
              <li>
                <a href="/esnaf/panel" onClick={handlePanel}>Esnaf Paneli</a>
              </li>
              <li>
                <a href="#logout" className="logout-btn" onClick={handleLogout}>
                  {React.createElement(iconMapping.logout, { size: 16 })}
                  <span style={{ marginLeft: 6 }}>Çıkış</span>
                </a>
              </li>
            </>
          )}
          {userType === 'client' && (
            <>
              <li>
                <a href="/musteri/hesabim" onClick={handlePanel}>Hesabım</a>
              </li>
              <li>
                <a href="#logout" className="logout-btn" onClick={handleLogout}>
                  {React.createElement(iconMapping.logout, { size: 16 })}
                  <span style={{ marginLeft: 6 }}>Çıkış</span>
                </a>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar; 