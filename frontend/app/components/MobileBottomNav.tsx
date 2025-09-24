"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { iconMapping, iconColors } from "@/app/utils/iconMapping";
import { api, getAuthToken } from "@/app/utils/api";
import React, { useEffect, useState } from "react";
import { useGlobalWS } from "@/app/hooks/useGlobalWS";

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
  const globalWS = useGlobalWS();
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Auth kontrolü - client veya vendor token'ı var mı?
  const isAuthenticated = () => {
    const clientToken = getAuthToken('client');
    const vendorToken = getAuthToken('vendor');
    return !!(clientToken || vendorToken);
  };

  // Link click handler - auth kontrolü yap
  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    // Ana sayfa herkese açık
    if (href === "/") {
      return;
    }

    // Giriş yapmamışsa giriş sayfasına yönlendir
    if (!isAuthenticated()) {
      e.preventDefault();
      router.push('/musteri/giris');
    }
  };

  // Unread toplamını yükle
  useEffect(() => {
    const loadUnread = async () => {
      try {
        const res = await api.chatListConversations();
        const conversations = res.data ?? res;
        const total = conversations.reduce((sum: number, c: any) => sum + (c.unread_count_for_current_user || 0), 0);
        setUnreadTotal(total);
      } catch {}
    };
    if (isAuthenticated()) loadUnread();

    // Global WS: yeni mesaj gelince artır, update gelince yeniden hesapla (daha güvenli)
    const onMsg = () => setUnreadTotal((t) => t + 1);
    const onUpdate = () => loadUnread();
    globalWS.on('message.new', onMsg as any);
    globalWS.on('conversation.update', onUpdate as any);
    return () => {
      globalWS.off('message.new', onMsg as any);
      globalWS.off('conversation.update', onUpdate as any);
    };
  }, [globalWS]);

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
            {it.href === "/musteri/mesajlar" && unreadTotal > 0 && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 16,
                background: '#ef4444',
                color: '#fff',
                borderRadius: 999,
                padding: '0 6px',
                fontSize: 10,
                fontWeight: 800,
                minWidth: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1
              }}>
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}


