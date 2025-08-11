'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Navbar = () => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [userType, setUserType] = useState<string | null>(null); // 'vendor' | 'customer' | null

  useEffect(() => {
    if (typeof window === "undefined") return;
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

  // Kullanıcı tipini kontrol et
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vendorToken = localStorage.getItem('esnaf_access_token');
    const customerToken = localStorage.getItem('customer_access_token');
    
    // Vendor token varsa hem vendor hem customer olarak davran
    if (vendorToken) {
      setUserType('vendor');
    } else if (customerToken) {
      setUserType('customer');
    } else {
      setUserType(null);
    }
  }, []);

  const handleEsnafGiris = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Token kontrolü
    const token = localStorage.getItem("esnaf_access_token");
    
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
      localStorage.removeItem('esnaf_access_token');
      localStorage.removeItem('esnaf_refresh_token');
      localStorage.removeItem('esnaf_email');
    } else if (userType === 'customer') {
      localStorage.removeItem('customer_access_token');
      localStorage.removeItem('customer_refresh_token');
      localStorage.removeItem('customer_email');
    }
    setUserType(null);
    router.push('/');
    // Sayfayı yenile (güvenli çıkış için)
    setTimeout(() => window.location.reload(), 200);
  };

  // Panel veya hesabım butonu
  const handlePanel = (e: React.MouseEvent) => {
    e.preventDefault();
    if (userType === 'vendor') {
      router.push('/esnaf/panel');
    } else if (userType === 'customer') {
      // Müşteri paneli henüz mevcut değil, ana sayfaya yönlendir
      router.push('/');
    }
  };

  return (
    <nav className={`sanayicin-navbar${showSticky ? " sticky-navbar" : ""}`}>
      <div className="sanayicin-navbar-inner">
        <div className="sanayicin-logo-section">
          <Link href="/" className="sanayicin-logo-link">
            <img src="/sanayicin-logo.png" alt="Sanayicin Logo" className="sanayicin-logo-icon" />
          </Link>
        </div>
        <button
          className="sanayicin-hamburger"
          aria-label="Menüyü Aç/Kapat"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={menuOpen ? "hamburger-bar open" : "hamburger-bar"}></span>
          <span className={menuOpen ? "hamburger-bar open" : "hamburger-bar"}></span>
          <span className={menuOpen ? "hamburger-bar open" : "hamburger-bar"}></span>
        </button>
        <ul className={`sanayicin-menu-links${menuOpen ? " open" : ""}`}>
          <li><a href="/nasil-calisir">Nasıl Çalışır</a></li>
          <li><a href="#yardim">Yardım</a></li>
          {userType === null && (
            <>
          <li><a href="#giris-yap" className="sanayicin-btn-vendor">Giriş Yap</a></li>
              <li>
                <a 
                  href="/esnaf/giris" 
                  className={`sanayicin-btn-vendor${isCheckingAuth ? " disabled" : ""}`}
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
                <a href="/esnaf/panel" className="sanayicin-btn-vendor" onClick={handlePanel}>Esnaf Paneli</a>
              </li>
              <li>
                <a href="#logout" className="sanayicin-btn-vendor" onClick={handleLogout}>Çıkış</a>
              </li>
            </>
          )}
          {userType === 'customer' && (
            <>
              <li>
                <a href="/" className="sanayicin-btn-vendor" onClick={handlePanel}>Hesabım</a>
              </li>
              <li>
                <a href="#logout" className="sanayicin-btn-vendor" onClick={handleLogout}>Çıkış</a>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar; 