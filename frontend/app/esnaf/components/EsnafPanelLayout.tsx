'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import EsnafSidebar from "./EsnafSidebar";
import { useEsnaf } from "../context/EsnafContext";
import { LoadingSpinner } from "./LoadingSpinner";
import ChatWidget from "@/app/components/ChatWidget";
import { api } from "@/app/utils/api";
import { useGlobalWS } from "@/app/hooks/useGlobalWS";

interface EsnafPanelLayoutProps {
  children: React.ReactNode;
  activePage: string;
}

export default function EsnafPanelLayout({ 
  children, 
  activePage
}: EsnafPanelLayoutProps) {
  const router = useRouter();
  const { user, email, loading, isAdmin, emailVerified: contextEmailVerified, handleLogout } = useEsnaf();
  const isVerified = user?.is_verified === true || contextEmailVerified === true;
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const globalWS = useGlobalWS();

  // Mobil/Desktop kontrolü
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global WS - unread güncelle (loadUnreadCount tanımlandıktan sonra abone ol)
  useEffect(() => {
    if (!(isVerified && user)) return;
    const onAny = () => { setTimeout(() => loadUnreadCount(), 0); };
    globalWS.on('message.new', onAny as any);
    globalWS.on('conversation.update', onAny as any);
    return () => {
      globalWS.off('message.new', onAny as any);
      globalWS.off('conversation.update', onAny as any);
    };
  }, [isVerified, user, globalWS]);

  // loadUnreadCount fonksiyonunu useCallback ile sarmala
  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await api.chatListConversations();
      const conversations = res.data ?? res;
      
      // Yeni sistemde unread_count_for_current_user kullan
      const totalUnread = conversations.reduce((sum: number, c: any) => {
        return sum + (c.unread_count_for_current_user || 0);
      }, 0);
      
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Esnaf unread count yüklenemedi:', error);
    }
  }, []);

  // Okunmamış mesaj sayısını yükle
  useEffect(() => {
    if (!isVerified) return;
    
    loadUnreadCount();
    
    // Periyodik güncelleme (yüksek trafik için optimize edildi)
    const interval = setInterval(loadUnreadCount, 30000); // 30 saniyede bir
    
    return () => clearInterval(interval);
  }, [isVerified, loadUnreadCount]);

  // Email doğrulama kontrolü
  useEffect(() => {
    // Loading bittikten ve user varsa kontrol et
    if (!loading && user) {
      // Email doğrulanmamışsa yönlendir (yeni alan is_verified öncelikli)
      if (!isVerified) {
        router.replace(`/esnaf/email-dogrula?email=${user.email || ''}`);
        return;
      }
    }
  }, [loading, isVerified, user, router]);

  // ChatWidget'tan unread count güncellemesi
  const handleChatWidgetUpdate = (conversations: any[]) => {
    const totalUnread = conversations.reduce((sum: number, c: any) => {
      // Yeni sistemde unread_count_for_current_user kullan
      return sum + (c.unread_count_for_current_user || 0);
    }, 0);
    setUnreadCount(totalUnread);
  };

  // Polling: Pending service request count for sidebar badge
  useEffect(() => {
    let intervalId: any;
    const fetchUnreadRequests = async () => {
      try {
        const res = await api.getVendorServiceRequestsUnreadCount();
        setPendingRequestCount(res.data?.unread_count ?? 0);
      } catch (e) {
        // ignore
      }
    };
    fetchUnreadRequests();
    intervalId = setInterval(fetchUnreadRequests, 15000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Email doğrulanmamışsa loading göster (yönlendirme sırasında)
  if (!isVerified && user) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div>
        {/* Sol Sidebar */}
        <EsnafSidebar 
          user={user} 
          email={email} 
          onLogout={handleLogout}
          activePage={activePage}
          notifications={{
            messages: unreadCount,
            reviews: 0,
            appointments: 0,
            quotes: activePage === 'taleplerim' ? 0 : pendingRequestCount
          }}
        />

        {/* Ana İçerik */}
        <div className="esnaf-main-content">
          <div className="esnaf-page-container">
            {/* Sayfa İçeriği */}
            {children}
          </div>
        </div>
      </div>
      
      {/* ChatWidget sadece desktop'ta göster */}
      {!isMobile && (
        <ChatWidget 
          role="vendor" 
          user={user}
          onUnreadCountUpdate={handleChatWidgetUpdate}
        />
      )}
    </>
  );
} 