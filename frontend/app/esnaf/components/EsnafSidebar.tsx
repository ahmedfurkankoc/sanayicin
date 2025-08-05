'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { useEsnaf } from "../context/EsnafContext";
import Icon from "@/app/components/ui/Icon";

interface EsnafSidebarProps {
  user?: any;
  email?: string;
  onLogout?: () => void;
  activePage?: string;
}

export default function EsnafSidebar({ user, email, onLogout, activePage = "panel" }: EsnafSidebarProps) {
  const router = useRouter();
  const { user: contextUser, email: contextEmail, loading } = useEsnaf();

  // Context'ten gelen verileri öncelikle kullan, props'ları fallback olarak kullan
  const currentUser = contextUser || user;
  const currentEmail = contextEmail || email;

  // Active class'ını yöneten fonksiyon
  const getActiveClass = (page: string) => {
    return activePage === page ? "active" : "";
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("esnaf_access_token");
      localStorage.removeItem("esnaf_refresh_token");
      localStorage.removeItem("esnaf_email");
      router.replace("/esnaf/giris");
    }
  };

  // Kullanıcı adının ilk harfini al
  const getUserInitial = () => {
    if (currentUser?.display_name) {
      return currentUser.display_name.charAt(0).toUpperCase();
    }
    if (currentEmail) {
      return currentEmail.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Kullanıcı adını al
  const getUserName = () => {
    if (currentUser?.display_name) {
      return currentUser.display_name;
    }
    if (currentUser?.manager_name) {
      return currentUser.manager_name;
    }
    if (currentUser?.company_title) {
      return currentUser.company_title;
    }
    return "Kullanıcı";
  };

  // Email'i al
  const getUserEmail = () => {
    if (currentEmail) {
      return currentEmail;
    }
    if (currentUser?.user?.email) {
      return currentUser.user.email;
    }
    return "kullanici@email.com";
  };

  return (
    <>
      <div className="esnaf-sidebar">
        {/* Logo */}
        <div className="esnaf-sidebar-logo">
          <img src="/sanayicin-icon.png" alt="Sanayicin" className="esnaf-logo-icon" />
          <div className="esnaf-logo-text-container">
            <a className="esnaf-logo-text" href="/esnaf/panel">SANAYİCİN</a>
            <span className="esnaf-logo-subtitle">Esnaf Paneli</span>
          </div>
        </div>

        
                 {/* Navigation Menu */}
         <nav className="esnaf-nav">
                       <a href="/esnaf/panel" className={`esnaf-nav-item ${getActiveClass("panel")}`}>
              <Icon name="home" className="esnaf-nav-icon" color="white" />
              <span className="esnaf-nav-text">Özet</span>
              {activePage === "panel" && <span className="esnaf-nav-dot"></span>}
            </a>
           <a href="/esnaf/takvim" className={`esnaf-nav-item ${getActiveClass("takvim")}`}>
             <Icon name="calendar" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Takvim</span>
             {activePage === "takvim" && <span className="esnaf-nav-dot"></span>}
           </a>
           <a href="/esnaf/randevularim" className={`esnaf-nav-item ${getActiveClass("randevularim")}`}>
             <Icon name="clock" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Randevularım</span>
             {activePage === "randevularim" && <span className="esnaf-nav-dot"></span>}
           </a>
           <a href="/esnaf/taleplerim" className={`esnaf-nav-item ${getActiveClass("taleplerim")}`}>
             <Icon name="file" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Taleplerim</span>
             {activePage === "taleplerim" && <span className="esnaf-nav-dot"></span>}
           </a>
           <a href="#" className="esnaf-nav-item">
             <Icon name="message" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Mesajlarım</span>
           </a>
           <a href="#" className="esnaf-nav-item">
             <Icon name="star" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Yorumlarım</span>
           </a>
           <a href="/esnaf/profil" className={`esnaf-nav-item ${getActiveClass("profil")}`}>
             <Icon name="user" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Profilim</span>
             {activePage === "profil" && <span className="esnaf-nav-dot"></span>}
           </a>
         </nav>
        
        {/* User Profile */}
        <div 
          className="esnaf-user-profile"
          onClick={() => router.push("/esnaf/ayarlar")}
        >
          <div className="esnaf-user-profile-clickable">
            <div className="esnaf-user-avatar">
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt="Profil" 
                  className="esnaf-user-avatar-img"
                />
              ) : (
                <span className="esnaf-user-avatar-initial">{getUserInitial()}</span>
              )}
            </div>
            <div className="esnaf-user-info">
              <div className="esnaf-user-name">{getUserName()}</div>
              <div className="esnaf-user-email">{getUserEmail()}</div>
            </div>
          </div>
        </div>
      </div>

             {/* Mobil Menü */}
       <nav className="esnaf-mobile-nav">
                   <a href="/esnaf/panel" className={`esnaf-mobile-nav-item ${getActiveClass("panel")}`}>
            <span className="esnaf-mobile-nav-icon">
              <Icon name="home" size="sm" />
              <span className="esnaf-mobile-nav-badge">2</span>
            </span>
            <span className="esnaf-mobile-nav-text">Özet</span>
          </a>
         <a href="#" className={`esnaf-mobile-nav-item ${getActiveClass("mesajlar")}`}>
           <span className="esnaf-mobile-nav-icon">
             <Icon name="file" size="sm" />
           </span>
           <span className="esnaf-mobile-nav-text">Mesajlarım</span>
         </a>
         <a href="/esnaf/randevularim" className={`esnaf-mobile-nav-item ${getActiveClass("randevularim")}`}>
           <span className="esnaf-mobile-nav-icon">
             <Icon name="calendar" size="sm" />
           </span>
           <span className="esnaf-mobile-nav-text">Randevularım</span>
         </a>
         <a href="/esnaf/takvim" className={`esnaf-mobile-nav-item ${getActiveClass("takvim")}`}>
           <span className="esnaf-mobile-nav-icon">
             <Icon name="calendar" size="sm" />
           </span>
           <span className="esnaf-mobile-nav-text">Takvim</span>
         </a>
         <a href="/esnaf/ayarlar" className={`esnaf-mobile-nav-item ${getActiveClass("ayarlar")}`}>
           <span className="esnaf-mobile-nav-icon">
             <Icon name="user" size="sm" />
           </span>
           <span className="esnaf-mobile-nav-text">Ayarlar</span>
         </a>
       </nav>
    </>
  );
} 