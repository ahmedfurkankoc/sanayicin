"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { iconMapping, iconColors } from "@/app/utils/iconMapping";

type NavItem = { href: string; label: string; iconKey: keyof typeof iconMapping };

const items: NavItem[] = [
  { href: "/", label: "Ana Sayfa", iconKey: "home" },
  { href: "/(public)/en-yakin", label: "Ara", iconKey: "search" },
  { href: "/musteri/taleplerim", label: "Taleplerim", iconKey: "clipboard" },
  { href: "/mesajlar", label: "Mesajlar", iconKey: "message" },
  { href: "/musteri/profil", label: "Profil", iconKey: "user" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-bottom-nav mobile-only" aria-label="Alt gezinme">
      {items.map((it) => {
        const active = pathname === it.href;
        const Icon = iconMapping[it.iconKey];
        return (
          <Link key={it.href} href={it.href} className={`mbn-item${active ? " active" : ""}`}>
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


