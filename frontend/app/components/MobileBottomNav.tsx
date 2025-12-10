"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { iconMapping, iconColors } from "@/app/utils/iconMapping";
import React, { useState, useEffect } from "react";
import { api } from "@/app/utils/api";

type NavItem = { href: string; label: string; iconKey: keyof typeof iconMapping };

const items: NavItem[] = [
  { href: "/", label: "Ana Sayfa", iconKey: "home" },
  { href: "/musteri/favorilerim", label: "Favorilerim", iconKey: "heart" },
  { href: "/musteri/taleplerim", label: "Taleplerim", iconKey: "clipboard" },
  { href: "/musteri/mesajlar", label: "Mesajlar", iconKey: "message" },
  { href: "/musteri/hesabim", label: "Profil", iconKey: "user" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Session authentication kontrolü - backend'den profil bilgisi çek
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vendor veya client profilini dene
        try {
          const vendorResponse = await api.getProfile('vendor');
          if (vendorResponse.status === 200) {
            setIsAuthenticated(true);
            setIsChecking(false);
            return;
          }
        } catch (e: any) {
          // 401/403 normal (session yok) - sessizce handle et
          const status = e.response?.status;
          if (status !== 401 && status !== 403 && e.code !== 'ERR_NETWORK') {
            // Beklenmeyen hata - sadece development'ta console'a yaz
            if (process.env.NODE_ENV === 'development') {
              console.error('Vendor profil kontrolü hatası:', e);
            }
          }
        }
        
        try {
          const clientResponse = await api.getProfile('client');
          if (clientResponse.status === 200) {
            setIsAuthenticated(true);
            setIsChecking(false);
            return;
          }
        } catch (e2: any) {
          // 401/403 normal (session yok) - sessizce handle et
          const status2 = e2.response?.status;
          if (status2 !== 401 && status2 !== 403 && e2.code !== 'ERR_NETWORK') {
            // Beklenmeyen hata - sadece development'ta console'a yaz
            if (process.env.NODE_ENV === 'development') {
              console.error('Client profil kontrolü hatası:', e2);
            }
          }
        }
        
        setIsAuthenticated(false);
        setIsChecking(false);
      } catch (error: any) {
        // Network hatası veya beklenmeyen hata
        const status = error.response?.status;
        if (status !== 401 && status !== 403 && error.code !== 'ERR_NETWORK') {
          // Beklenmeyen hata - sadece development'ta console'a yaz
          if (process.env.NODE_ENV === 'development') {
            console.error('Auth kontrolü hatası:', error);
          }
        }
        setIsAuthenticated(false);
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  // Link click handler - auth kontrolü yap
  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    // Ana sayfa herkese açık
    if (href === "/") {
      return;
    }

    // Hala kontrol ediliyorsa bekle
    if (isChecking) {
      e.preventDefault();
      return;
    }

    // Giriş yapmamışsa giriş sayfasına yönlendir
    if (!isAuthenticated) {
      e.preventDefault();
      router.push('/musteri/giris');
    }
  };

  // WS ve unread badge kaldırıldı

  return (
    <nav className="mobile-bottom-nav mobile-only" aria-label="Alt gezinme">
      {items.map((it) => {
        const active = pathname === it.href;
        const Icon = iconMapping[it.iconKey];
        return (
          <Link 
            key={it.href} 
            href={it.href} 
            className={`mbn-item${active ? " active" : ""}`}
            onClick={(e) => handleLinkClick(e, it.href)}
          >
            <span className="mbn-icon" aria-hidden>
              {Icon ? <Icon size={20} color={active ? iconColors.primary : "#bbb"} /> : null}
            </span>
            <span className="mbn-label">{it.label}</span>
            {/* Badge kaldırıldı */}
          </Link>
        );
      })}
    </nav>
  );
}


