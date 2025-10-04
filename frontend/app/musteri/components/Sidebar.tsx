"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/app/components/ui/Icon";
import { getAuthToken, clearAllAuthData } from "@/app/utils/api";
import { useRouter } from "next/navigation";

function Sidebar() {
  const router = useRouter();
  const [isVendor, setIsVendor] = useState(false);
  useEffect(() => {
    setIsVendor(!!getAuthToken("vendor"));
  }, []);

  const handleLogout = useCallback(() => {
    clearAllAuthData();
    // Sadece sayfayı yenile - middleware doğru yere yönlendirecek
    setTimeout(() => window.location.reload(), 200);
  }, []);

  return (
    <aside
      className="musteri-sidebar"
      style={{
        width: "100%",
        alignSelf: "stretch",
        position: "sticky",
        top: 0,
        height: "100vh",
        background: "#fff",
        borderRight: "1px solid #eaeaea",
        borderRadius: 0,
        padding: 18,
        paddingTop: 24,
        boxShadow: "none",
        overflowY: "auto",
      }}
    >
      <nav style={navColStyle}>
        <Link href="/musteri" style={linkStyle}>
          <span style={linkInnerStyle}>
            <img src="/sanayicin-icon.png" alt="Sanayicin" width={18} height={18} style={{ display: 'inline-block' }} />
            <span>Sanayicin</span>
          </span>
        </Link>
        <Link href="/musteri/hesabim" style={linkStyle}>
          <span style={linkInnerStyle}>
            <Icon name="user" size={18} />
            <span>Hesabım</span>
          </span>
        </Link>
        <Link href="/musteri/aracim" style={linkStyle}>
              <span style={linkInnerStyle}>
                <Icon name="car" size={18} />
                <span>Aracım</span>
              </span>
            </Link>
        <Link href="/musteri/mesajlar" style={linkStyle}>
          <span style={linkInnerStyle}>
            <Icon name="message" size={18} />
            <span>Mesajlarım</span>
          </span>
        </Link>
        <Link href="/musteri/favorilerim" style={linkStyle}>
          <span style={linkInnerStyle}>
            <Icon name="heart" size={18} />
            <span>Favorilerim</span>
          </span>
        </Link>
        <Link href="/musteri/taleplerim" style={linkStyle}>
          <span style={linkInnerStyle}>
            <Icon name="clipboard" size={18} />
            <span>Taleplerim</span>
          </span>
        </Link>
      </nav>

      <div style={dividerStyle} />

      {isVendor && (
        <div style={{ marginTop: 12 }}>
          <div style={mutedTitleStyle}>ESNAF</div>
          <nav style={navColStyle}>
            <Link href="/esnaf/takvim" style={linkStyle}>
              <span style={linkInnerStyle}>
                <Icon name="calendar" size={18} />
                <span>Takvim</span>
              </span>
            </Link>
            <Link href="/esnaf/randevularim" style={linkStyle}>
              <span style={linkInnerStyle}>
                <Icon name="calendar" size={18} />
                <span>Randevularım</span>
              </span>
            </Link>
            <Link href="/esnaf/taleplerim" style={linkStyle}>
              <span style={linkInnerStyle}>
                <Icon name="clipboard" size={18} />
                <span>Taleplerim</span>
              </span>
            </Link>
            <Link href="/esnaf/yorumlar" style={linkStyle}>
              <span style={linkInnerStyle}>
                <Icon name="star" size={18} />
                <span>Yorumlarım</span>
              </span>
            </Link>
            <Link href="/esnaf/profil" style={linkStyle}>
              <span style={linkInnerStyle}>
                <Icon name="user" size={18} />
                <span>Profilim</span>
              </span>
            </Link>
          </nav>
        </div>
      )}

      <nav style={{ ...navColStyle, marginTop: 12 }}>
        <button
          onClick={handleLogout}
          style={{
            ...linkStyle,
            color: "var(--red)",
            background: "transparent",
            border: "1px solid transparent",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span style={linkInnerStyle}>
            <Icon name="logout" size={18} color="var(--red)" />
            <span>Çıkış Yap</span>
          </span>
        </button>
      </nav>
    </aside>
  );
}

const linkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#6b7280",
  fontWeight: 600,
  padding: "10px 12px",
  borderRadius: 8,
  transition: "background .15s, color .15s, transform .15s",
  border: "1px solid transparent",
  background: "transparent",
};

const linkInnerStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
};

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 14,
  color: "#111",
  marginBottom: 10,
};

const mutedTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 12,
  color: "#9ca3af",
  letterSpacing: 0.5,
  marginBottom: 8,
  textTransform: "uppercase",
};

const navColStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const dividerStyle: React.CSSProperties = {
  height: 1,
  background: "#f0f0f0",
  margin: "14px 0",
};

export default Sidebar;


