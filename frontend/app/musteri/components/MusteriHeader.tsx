'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGlobalWS } from '@/app/hooks/useGlobalWS';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { iconMapping } from '@/app/utils/iconMapping';
import Image from 'next/image';
import { useMusteri } from '../context/MusteriContext';
import ChatWidget from '@/app/components/ChatWidget';
import NotificationBell from '@/app/components/NotificationBell';
import { api, getAuthToken } from '@/app/utils/api';

export default function MusteriHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{ title: string; message: string; link?: string }>>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const router = useRouter();
  const { isAuthenticated, user, logout, loading } = useMusteri();
  const currentRole = (user?.role as 'vendor' | 'client' | undefined) || undefined;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const globalWS = useGlobalWS();

  // Global WebSocket bağlantısı kur
  const connectGlobalWebSocket = useCallback(() => {
    if (!isAuthenticated || !user) return;

    // Mevcut bağlantıyı kapat
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Auth token'ları kontrol et - hem client hem vendor
    const clientToken = getAuthToken('client');
    const vendorToken = getAuthToken('vendor');
    const currentToken = vendorToken || clientToken;

    if (!currentToken) {
      console.warn('Auth token bulunamadı - WebSocket bağlantısı kurulamıyor');
      return;
    }

    try {
      // WebSocket URL'ini oluştur
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
        (process.env.NEXT_PUBLIC_API_URL ? 
          process.env.NEXT_PUBLIC_API_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api', '') : 
          'ws://localhost:8000'
        );
      
      const ws = new WebSocket(`${wsUrl}/ws/chat/global/?token=${encodeURIComponent(currentToken)}`);
      
      ws.onopen = () => {
        console.log('Global WebSocket bağlantısı kuruldu');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Yeni mesaj: badge'i güncelle ve mesaj içeriği ile bildirim oluştur (tek kaynak)
          if (data.event === 'message.new') {
            loadUnreadCount();
            try {
              const msg = data.data || {};
              const previewSrc = (msg.content || '').toString();
              const preview = previewSrc.slice(0, 80) + (previewSrc.length > 80 ? '…' : '');
              const senderName = msg.sender_name || msg.sender || msg.sender_user_name || '';
              const title = senderName ? `Yeni mesaj - ${senderName}` : 'Yeni mesaj';
              const notifItem = { title, message: preview || 'Yeni bir mesajınız var.', link: '/musteri/mesajlar' };
              setNotifications(prev => [notifItem, ...prev].slice(0, 20));
            } catch (_e) {}
          }
          if (data.event === 'conversation.update') {
            // Sadece unread badge güncellemesi için kullan
            loadUnreadCount();
          }
          if (data.event === 'notification.new') {
            const payload = data.data || {};
            const mapped = mapNotificationPayload(payload);
            setNotifications(prev => [mapped, ...prev].slice(0, 20));
          }
          
          // Typing event'leri
          if (data.event === 'typing.start' || data.event === 'typing.stop') {
            // Typing event'leri için gerekirse işlem yap
          }
        } catch (error) {
          console.error('WebSocket mesaj parse hatası:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('Global WebSocket bağlantısı kapandı:', event.code, event.reason);
        
        // Otomatik yeniden bağlanma (exponential backoff)
        if (event.code !== 1000 && event.code !== 1001) {
          const delay = Math.min(1000 * Math.pow(2, Math.min(5, 5)), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isAuthenticated) {
              connectGlobalWebSocket();
            }
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket hatası:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket bağlantı hatası:', error);
    }
  }, [isAuthenticated, user]);

  // Global WS: shared connection - subscribe only
  useEffect(() => {
    if (!(isAuthenticated && user)) return;
    const onMsg = (e: CustomEvent<any>) => {
      const data = e.detail;
      if (data?.event === 'message.new' || data?.event === 'conversation.update') {
        // Defer to next tick to ensure callbacks are defined
        setTimeout(() => loadUnreadCount(), 0);
      }
      if (data?.event === 'notification.new') {
        const payload = data.data || {};
        const mapped = mapNotificationPayload(payload);
        setNotifications(prev => [mapped, ...prev].slice(0, 20));
      }
    };
    globalWS.on('message.new', onMsg);
    globalWS.on('conversation.update', onMsg);
    globalWS.on('notification.new', onMsg);
    return () => {
      globalWS.off('message.new', onMsg);
      globalWS.off('conversation.update', onMsg);
      globalWS.off('notification.new', onMsg);
    };
  }, [isAuthenticated, user, globalWS]);

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
      console.error('Unread count yüklenemedi:', error);
    }
  }, []);

  // Okunmamış mesaj sayısını yükle
  useEffect(() => {
    if (!isAuthenticated) return;
    
    loadUnreadCount();
    
    // Periyodik güncelleme (yüksek trafik için optimize edildi)
    const interval = setInterval(loadUnreadCount, 30000); // 30 saniyede bir
    
    return () => clearInterval(interval);
  }, [isAuthenticated, loadUnreadCount]);

  // Okunmamış mesaj sayısını güncelle
  const updateUnreadCount = (newCount: number) => {
    setUnreadCount(newCount);
  };

  // ChatWidget'tan unread count güncellemesi
  const handleChatWidgetUpdate = (conversations: any[]) => {
    const totalUnread = conversations.reduce((sum: number, c: any) => {
      // Yeni sistemde unread_count_for_current_user kullan
      return sum + (c.unread_count_for_current_user || 0);
    }, 0);
    setUnreadCount(totalUnread);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Gelişmiş arama için query parametresi ekle
      router.push(`/musteri/esnaflar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout(); // Context'ten gelen logout fonksiyonu zaten refresh yapıyor
    setShowDropdown(false);
    
    // WebSocket bağlantısını kapat
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleChatWidget = () => {
    setShowChatWidget(!showChatWidget);
    // Diğer dropdown'ı kapat
    setShowDropdown(false);
  };

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Mesaj ikonuna tıklanırsa kapatma
      if (target.closest('.musteri-message-btn')) {
        return;
      }
      
      // ChatWidget içindeki alanlara tıklanırsa kapatma
      if (target.closest('.musteri-chat-widget-container') || target.closest('.chat-widget-drawer')) {
        return;
      }
      
      // User dropdown dışına tıklanırsa kapat
      if (!target.closest('.musteri-user-menu')) {
        setShowDropdown(false);
      }
      // Notification dropdown dışına tıklanırsa kapat
      if (!target.closest('.musteri-notification-btn') && !target.closest('.musteri-notification-dropdown')) {
        setShowNotifDropdown(false);
      }
      
      // Mobil search dışına tıklanırsa kapat
      if (!target.closest('.musteri-mobile-search') && !target.closest('.musteri-mobile-search-btn')) {
        setShowMobileSearch(false);
      }

      // ChatWidget dışına tıklanırsa kapat
      if (!target.closest('.musteri-chat-widget-container')) {
        setShowChatWidget(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Backend'den gelen notification payload'unu UI item'ına dönüştür
  const mapNotificationPayload = (payload: any): { title: string; message: string; link?: string } => {
    const kind = payload?.kind as string | undefined;
    switch (kind) {
      case 'appointment_confirmed':
        return {
          title: 'Randevun onaylandı',
          message: payload?.vendor_name ? `${payload.vendor_name} randevunu onayladı.` : 'Randevunuz onaylandı.',
          link: '/musteri/taleplerim',
        };
      case 'appointment_rejected':
        return {
          title: 'Randevu reddedildi',
          message: payload?.vendor_name ? `${payload.vendor_name} randevunu reddetti.` : 'Randevunuz reddedildi.',
          link: '/musteri/taleplerim',
        };
      case 'appointment_cancelled':
        return {
          title: 'Randevu iptal edildi',
          message: payload?.vendor_name ? `${payload.vendor_name} randevuyu iptal etti.` : 'Randevunuz iptal edildi.',
          link: '/musteri/taleplerim',
        };
      case 'vendor_offer_sent':
        return {
          title: 'Yeni teklif',
          message: payload?.vendor_name ? `${payload.vendor_name} bir teklif gönderdi.` : 'Size yeni bir teklif geldi.',
          link: '/musteri/mesajlar',
        };
      case 'service_request_created':
        return {
          title: 'Yeni talep oluşturuldu',
          message: payload?.title || 'Yeni bir hizmet talebi oluşturuldu.',
          link: '/musteri/taleplerim',
        };
      default:
        return {
          title: payload?.title || 'Bildirim',
          message: payload?.message || '',
          link: payload?.link,
        };
    }
  };

  // Kullanıcı adını al
  const getUserDisplayName = () => {
    if (!user) return '';
    
    // Artık CustomUser'dan first_name ve last_name kullanıyoruz
    if (user.first_name || user.last_name) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      return fullName || user.email;
    }
    
    // Fallback olarak email kullan
    return user.email;
  };

  return (
    <header className="musteri-header">
      <div className="musteri-header-content">
        {/* Sol: Logo */}
        <div className="musteri-header-left">
          <Link href="/musteri" className="musteri-logo">
            <Image
              src="/sanayicin-esnaf-logo.png"
              alt="sanayicin.com"
              width={400}
              height={120}
              priority
              className="musteri-logo-img"
            />
          </Link>
        </div>
        
        {/* Orta: Arama Motoru */}
        <div className="musteri-header-center">
          <form onSubmit={handleSearch} className="musteri-search-form">
            <div className="musteri-search-container">
              <input
                type="text"
                placeholder="Aradığınız hizmeti yazın..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="musteri-search-input"
              />
              <button type="submit" className="musteri-search-btn">
                {React.createElement(iconMapping.search, { size: 20 })}
              </button>
            </div>
          </form>
        </div>
        
        {/* Sağ: Bildirim ve Kullanıcı */}
        <div className="musteri-header-right">
          {/* Mobil: arama butonu */}
          <button
            className="musteri-header-btn musteri-mobile-search-btn"
            onClick={() => setShowMobileSearch((v) => !v)}
            aria-label="Ara"
          >
            {React.createElement(iconMapping.search, { size: 20 })}
          </button>
          {/* Mobil Arama Dropdown */}
          <div className={`musteri-mobile-search ${showMobileSearch ? 'show' : ''}`}>
            <div className="musteri-mobile-search-inner">
              <form onSubmit={(e) => { handleSearch(e); setShowMobileSearch(false); }} className="musteri-mobile-search-form">
                <input
                  type="text"
                  placeholder="Hizmet ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="musteri-mobile-search-input"
                  autoFocus
                />
                <button type="submit" className="musteri-mobile-search-submit">
                  {React.createElement(iconMapping.search, { size: 18 })}
                  <span style={{ marginLeft: 6 }}>Ara</span>
                </button>
              </form>
              <button className="musteri-mobile-search-close" onClick={() => setShowMobileSearch(false)} aria-label="Kapat">
                {React.createElement(iconMapping['x'], { size: 18 })}
              </button>
            </div>
          </div>

          {!isAuthenticated ? (
            // Giriş yapılmamış: AuthHeader butonları
            <div className="auth-buttons" style={{ gap: 8 }}>
              <button
                className="auth-btn auth-btn-login"
                onClick={() => router.push('/musteri/giris')}
              >
                Giriş Yap
              </button>
              <button
                className="auth-btn auth-btn-register"
                onClick={() => router.push('/musteri/kayit')}
              >
                Kayıt Ol
              </button>
            </div>
          ) : (
            <>
              <NotificationBell iconColor="var(--white)" />
              <button 
                className={`musteri-header-btn musteri-message-btn ${showChatWidget ? 'active' : ''}`} 
                onClick={toggleChatWidget}
              >
                {React.createElement(iconMapping.message, { size: 20 })}
                {unreadCount > 0 && (
                  <span className="musteri-message-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <div className="musteri-user-menu">
                <button className="musteri-header-btn musteri-user-btn" onClick={toggleDropdown}>
                  {React.createElement(iconMapping.user, { size: 20 })}
                  {isAuthenticated && !loading && user && (
                    <span className="musteri-user-name">
                      {getUserDisplayName()}
                    </span>
                  )}
                  {isAuthenticated && !loading && user && (
                    <span className="musteri-chevron">
                      {showDropdown 
                        ? React.createElement(iconMapping['chevron-up'], { size: 16 })
                        : React.createElement(iconMapping['chevron-down'], { size: 16 })
                      }
                    </span>
                  )}
                </button>
                {showDropdown && (
                  <div className={`musteri-user-dropdown ${showDropdown ? 'show' : ''}`}>
                    <div className="musteri-dropdown-header">
                      <strong>{getUserDisplayName()}</strong>
                    </div>
                    <Link href="/musteri/hesabim" className="musteri-dropdown-item">
                      {React.createElement(iconMapping.user, { size: 16 })}
                      Hesabım
                    </Link>
                    <Link href="/musteri/aracim" className="musteri-dropdown-item">
                      {React.createElement(iconMapping['car'] || iconMapping['clipboard'], { size: 16 })}
                      Aracım
                    </Link>
                    <Link href="/musteri/mesajlar" className="musteri-dropdown-item">
                      {React.createElement(iconMapping.message, { size: 16 })}
                      Mesajlarım
                    </Link>
                    <Link href="/musteri/favorilerim" className="musteri-dropdown-item">
                      {React.createElement(iconMapping.heart, { size: 16 })}
                      Favorilerim
                    </Link>
                    <Link href="/musteri/taleplerim" className="musteri-dropdown-item">
                      {React.createElement(iconMapping.clipboard, { size: 16 })}
                      Taleplerim
                    </Link>
                    {currentRole === 'client' && (
                      <>
                        <div className="musteri-dropdown-divider"></div>
                        <Link href="/musteri/esnaf-ol" className="musteri-dropdown-item">
                          <Image
                            src="/sanayicin-icon.png"
                            alt="Hizmet Vermek İstiyorum"
                            width={16}
                            height={16}
                            style={{ width: '16px', height: '16px' }}
                          />
                          Hizmet Vermek İstiyorum
                        </Link>
                      </>
                    )}
                    {currentRole === 'vendor' && (
                      <>
                        <div className="musteri-dropdown-divider"></div>
                        <div 
                          className="musteri-dropdown-item musteri-dropdown-esnaf"
                          onClick={() => window.location.href = "/esnaf/panel"}
                          style={{ cursor: 'pointer' }}
                        >
                          <Image
                            src="/sanayicin-icon.png"
                            alt="Esnaf Paneli"
                            width={16}
                            height={16}
                          />
                          Esnaf Paneli
                        </div>
                      </>
                    )}
                    <div className="musteri-dropdown-divider"></div>
                    <button onClick={handleLogout} className="musteri-dropdown-item musteri-dropdown-logout">
                      {React.createElement(iconMapping.logout, { size: 16 })}
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* ChatWidget - sadece authenticated kullanıcılar için */}
      {isAuthenticated && (
        <ChatWidget
          role="client"
          isOpen={showChatWidget}
          onClose={() => setShowChatWidget(false)}
          user={user}
          onUnreadCountUpdate={handleChatWidgetUpdate}
        />
      )}
    </header>
  );
}
