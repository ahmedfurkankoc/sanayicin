'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import EsnafSidebar from "./EsnafSidebar";
import { useEsnaf } from "../context/EsnafContext";
import { LoadingSpinner } from "./LoadingSpinner";
import ChatWidget from "@/app/components/ChatWidget";
import { api, getAuthToken } from "@/app/utils/api";

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
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mobil/Desktop kontrolü
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global WebSocket bağlantısı kur
  const connectGlobalWebSocket = useCallback(() => {
    if (!isVerified || !user) return;

    // Mevcut bağlantıyı kapat
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Auth token'ı kontrol et
    const vendorToken = getAuthToken('vendor');
    if (!vendorToken) {
      console.warn('Vendor auth token bulunamadı - WebSocket bağlantısı kurulamıyor');
      return;
    }

    try {
      // WebSocket URL'ini oluştur
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
        (process.env.NEXT_PUBLIC_API_URL ? 
          process.env.NEXT_PUBLIC_API_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api', '') : 
          'wss://test.sanayicin.com'
        );
      
      const ws = new WebSocket(`${wsUrl}/ws/chat/global/?token=${encodeURIComponent(vendorToken)}`);
      
      ws.onopen = () => {
        console.log('Esnaf Global WebSocket bağlantısı kuruldu');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Yeni mesaj geldiğinde unread count'u güncelle
          if (data.event === 'message.new' || data.event === 'conversation.update') {
            loadUnreadCount();
          }
        } catch (error) {
          console.error('WebSocket mesaj parse hatası:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('Esnaf Global WebSocket bağlantısı kapandı:', event.code, event.reason);
        
        // Otomatik yeniden bağlanma (exponential backoff)
        if (event.code !== 1000 && event.code !== 1001) {
          const delay = Math.min(1000 * Math.pow(2, Math.min(5, 5)), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isVerified) {
              connectGlobalWebSocket();
            }
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('Esnaf WebSocket hatası:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Esnaf WebSocket bağlantı hatası:', error);
    }
  }, [isVerified, user]);

  // WebSocket bağlantısını kur
  useEffect(() => {
    if (isVerified && user) {
      connectGlobalWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isVerified, user, connectGlobalWebSocket]);

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