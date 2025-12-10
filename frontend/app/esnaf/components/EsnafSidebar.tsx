'use client';

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEsnaf } from "../context/EsnafContext";
import { clearAuthTokens } from '@/app/utils/api';
import Icon from "@/app/components/ui/Icon";

interface NotificationCounts {
  messages: number;
  reviews: number;
  appointments: number;
  quotes: number;
  // İleride eklenebilecek diğer bildirim tipleri
}

interface EsnafSidebarProps {
  user?: any;
  email?: string;
  onLogout?: () => void;
  activePage?: string;
  notifications?: NotificationCounts;
}

export default function EsnafSidebar({ 
  user, 
  email, 
  onLogout, 
  activePage = "panel", 
  notifications = {
    messages: 0,
    reviews: 0,
    appointments: 0,
    quotes: 0
  }
}: EsnafSidebarProps) {
  const router = useRouter();
  const { user: contextUser, email: contextEmail, loading, handleLogout: contextHandleLogout } = useEsnaf();

  // Context'ten gelen verileri öncelikle kullan, props'ları fallback olarak kullan
  const currentUser = contextUser || user;
  const currentEmail = contextEmail || email;

  // Active class'ını yöneten fonksiyon
  const getActiveClass = (page: string) => {
    return activePage === page ? "active" : "";
  };

  // Logout fonksiyonu: context'ten gelen handleLogout'u kullan, yoksa props'tan, yoksa fallback
  const handleLogout = onLogout || contextHandleLogout || (() => {
    // Fallback: sadece frontend state'i temizle ve sayfayı yenile
    clearAuthTokens("vendor");
    setTimeout(() => {
      window.location.href = '/esnaf/giris';
    }, 200);
  });

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
        <div className="esnaf-sidebar-logo" onClick={() => router.push("/esnaf/panel")}>
          <img src="/sanayicin-esnaf-logo.png" alt="Sanayicin Logo" className="esnaf-logo" />
        </div>

        
                 {/* Navigation Menu */}
         <nav className="esnaf-nav">
                       <Link href="/esnaf/panel" className={`esnaf-nav-item ${getActiveClass("panel")}`}>
              <Icon name="home" className="esnaf-nav-icon" color="white" />
              <span className="esnaf-nav-text">Özet</span>
              {activePage === "panel" && <span className="esnaf-nav-dot"></span>}
             </Link>
            <Link href="/esnaf/takvim" className={`esnaf-nav-item ${getActiveClass("takvim")}`}>
             <Icon name="calendar" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Takvim</span>
             {activePage === "takvim" && <span className="esnaf-nav-dot"></span>}
            </Link>
            <Link href="/esnaf/randevularim" className={`esnaf-nav-item ${getActiveClass("randevularim")}`}>
             <Icon name="clock" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Randevularım</span>
             {notifications.appointments > 0 && (
               <span className="esnaf-nav-badge">
                 {notifications.appointments > 99 ? '99+' : notifications.appointments}
               </span>
             )}
             {activePage === "randevularim" && <span className="esnaf-nav-dot"></span>}
            </Link>
            <Link href="/esnaf/taleplerim" className={`esnaf-nav-item ${getActiveClass("taleplerim")}`}>
             <Icon name="file" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Taleplerim</span>
             {notifications.quotes > 0 && (
               <span className="esnaf-nav-badge">
                 {notifications.quotes > 99 ? '99+' : notifications.quotes}
               </span>
             )}
             {activePage === "taleplerim" && <span className="esnaf-nav-dot"></span>}
            </Link>
                       <Link href="/esnaf/panel/mesajlar" className={`esnaf-nav-item ${getActiveClass("mesajlar")}`}>
             <Icon name="message" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Mesajlarım</span>
             {notifications.messages > 0 && (
               <span className="esnaf-nav-badge">
                 {notifications.messages > 99 ? '99+' : notifications.messages}
               </span>
             )}
            </Link>
            <Link href="/esnaf/yorumlar" className={`esnaf-nav-item ${getActiveClass("yorumlar")}`}>
             <Icon name="star" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Yorumlarım</span>
             {notifications.reviews > 0 && (
               <span className="esnaf-nav-badge">
                 {notifications.reviews > 99 ? '99+' : notifications.reviews}
               </span>
             )}
             {activePage === "yorumlar" && <span className="esnaf-nav-dot"></span>}
            </Link>
            <Link href="/esnaf/profil" className={`esnaf-nav-item ${getActiveClass("profil")}`}>
             <Icon name="user" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Profilim</span>
             {activePage === "profil" && <span className="esnaf-nav-dot"></span>}
            </Link>
            <div className="esnaf-nav-item esnaf-logout-item" onClick={handleLogout}>
             <Icon name="logout" className="esnaf-nav-icon" color="white" />
             <span className="esnaf-nav-text">Çıkış Yap</span>
            </div>
         </nav>
        
        {/* Ana Sayfaya Dön Butonu */}
        <div 
          className="esnaf-home-button"
          onClick={() => window.location.href = "/"}
          title="Ana Sayfaya Dön"
        >
          <Icon name="home" size="sm" color="black" />
          <span className="esnaf-home-button-text">Ana Sayfaya Dön</span>
        </div>

        {/* User Profile */}
        <div className="esnaf-user-profile">
          <div 
            className="esnaf-user-profile-clickable"
            onClick={() => router.push("/esnaf/ayarlar")}
          >
            <div className="esnaf-user-avatar">
              {currentUser?.user?.avatar ? (
                <img 
                  src={currentUser.user.avatar} 
                  alt="Profil" 
                  className="esnaf-user-avatar-img"
                />
              ) : (
                <span className="esnaf-user-avatar-initial">
                  {currentUser?.display_name ? currentUser.display_name.charAt(0).toUpperCase() :
                   currentUser?.company_title ? currentUser.company_title.charAt(0).toUpperCase() :
                   currentEmail ? currentEmail.charAt(0).toUpperCase() : 'E'}
                </span>
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
                   <Link href="/esnaf/panel" className={`esnaf-mobile-nav-item ${getActiveClass("panel")}`}>
            <span className="esnaf-mobile-nav-icon">
              <Icon name="home" size="sm" />
              {/* Toplam bildirim sayısı */}
              {(notifications.messages + notifications.reviews + notifications.appointments + notifications.quotes) > 0 && (
                <span className="esnaf-mobile-nav-badge">
                  {(notifications.messages + notifications.reviews + notifications.appointments + notifications.quotes) > 99 
                    ? '99+' 
                    : (notifications.messages + notifications.reviews + notifications.appointments + notifications.quotes)}
                </span>
              )}
            </span>
            <span className="esnaf-mobile-nav-text">Özet</span>
           </Link>
         <Link href="/esnaf/panel/mesajlar" className={`esnaf-mobile-nav-item ${getActiveClass("mesajlar")}`}>
           <span className="esnaf-mobile-nav-icon">
             <Icon name="message" size="sm" />
             {notifications.messages > 0 && (
               <span className="esnaf-mobile-nav-badge">
                 {notifications.messages > 99 ? '99+' : notifications.messages}
               </span>
             )}
           </span>
           <span className="esnaf-mobile-nav-text">Mesajlarım</span>
         </Link>
         <Link href="/esnaf/randevularim" className={`esnaf-mobile-nav-item ${getActiveClass("randevularim")}`}>
           <span className="esnaf-mobile-nav-icon">
             <Icon name="calendar" size="sm" />
             {notifications.appointments > 0 && (
               <span className="esnaf-mobile-nav-badge">
                 {notifications.appointments > 99 ? '99+' : notifications.appointments}
               </span>
             )}
           </span>
           <span className="esnaf-mobile-nav-text">Randevularım</span>
         </Link>
         <Link href="/esnaf/takvim" className={`esnaf-mobile-nav-item ${getActiveClass("takvim")}`}>
           <span className="esnaf-mobile-nav-icon">
             <Icon name="calendar" size="sm" />
           </span>
           <span className="esnaf-mobile-nav-text">Takvim</span>
         </Link>
         <Link href="/esnaf/yorumlar" className={`esnaf-mobile-nav-item ${getActiveClass("yorumlar")}`}>
           <span className="esnaf-mobile-nav-icon">
             <Icon name="star" size="sm" />
             {notifications.reviews > 0 && (
               <span className="esnaf-mobile-nav-badge">
                 {notifications.reviews > 99 ? '99+' : notifications.reviews}
               </span>
             )}
           </span>
           <span className="esnaf-mobile-nav-text">Yorumlarım</span>
         </Link>
         <Link href="/esnaf/ayarlar" className={`esnaf-mobile-nav-item ${getActiveClass("ayarlar")}`}>
           <span className="esnaf-mobile-nav-icon">
             <Icon name="user" size="sm" />
           </span>
           <span className="esnaf-mobile-nav-text">Ayarlar</span>
         </Link>
       </nav>
    </>
  );
} 