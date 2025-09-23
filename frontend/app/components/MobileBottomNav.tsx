"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { iconMapping, iconColors } from "@/app/utils/iconMapping";
import { getAuthToken } from "@/app/utils/api";

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
          </Link>
        );
      })}
    </nav>
  );
}


