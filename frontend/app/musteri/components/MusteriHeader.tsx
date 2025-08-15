'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { iconMapping } from '@/app/utils/iconMapping';
import Image from 'next/image';
import { useMusteri } from '../context/MusteriContext';
import ChatWidget from '@/app/components/ChatWidget';
import { api } from '@/app/utils/api';

export default function MusteriHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { isAuthenticated, user, role, logout, loading } = useMusteri();

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
    
    // Her 10 saniyede bir güncelle (widget açık olsun veya olmasın)
    const interval = setInterval(loadUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, loadUnreadCount]);

  // WebSocket üzerinden real-time unread count güncellemesi
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // WebSocket event listener ekle
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'message.new') {
          // Yeni mesaj geldiğinde unread count'u güncelle
          // Widget açık değilse de güncelle
          loadUnreadCount();
        }
      } catch (error) {
        // WebSocket mesajı parse edilemedi
      }
    };

    // WebSocket bağlantısı varsa listener ekle
    if (typeof window !== 'undefined' && window.WebSocket) {
      // Global WebSocket listener ekle
      window.addEventListener('message', handleWebSocketMessage);
      return () => window.removeEventListener('message', handleWebSocketMessage);
    }
  }, [isAuthenticated, loadUnreadCount]);

  // Okunmamış mesaj sayısını güncelle
  const updateUnreadCount = (newCount: number) => {
    setUnreadCount(newCount);
  };

  // ChatWidget'tan unread count güncellemesi
  const handleChatWidgetUpdate = (conversations: any[]) => {
    const totalUnread = conversations.reduce((sum: number, c: any) => {
      if (role === 'vendor') {
        return sum + (c.vendor_unread_count || 0);
      } else {
        return sum + (c.client_unread_count || 0);
      }
    }, 0);
    setUnreadCount(totalUnread);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/musteri/arama-sonuclari?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    router.push('/');
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
      
      // ChatWidget dışına tıklanırsa kapat
      if (!target.closest('.musteri-chat-widget-container')) {
        setShowChatWidget(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Kullanıcı adını al
  const getUserDisplayName = () => {
    console.log('getUserDisplayName called with user:', user);
    
    if (!user) {
      console.log('User is null');
      return '';
    }
    
    console.log('User first_name:', user.first_name);
    console.log('User last_name:', user.last_name);
    console.log('User email:', user.email);
    
    // Artık CustomUser'dan first_name ve last_name kullanıyoruz
    if (user.first_name || user.last_name) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      console.log('Full name:', fullName);
      return fullName || user.email;
    }
    
    // Fallback olarak email kullan
    console.log('Using email as fallback:', user.email);
    return user.email;
  };

  return (
    <header className="musteri-header">
      <div className="musteri-header-content">
        {/* Sol: Logo */}
        <div className="musteri-header-left">
          <Link href="/" className="musteri-logo">
            <Image
              src="/sanayicin-esnaf-logo.png"
              alt="sanayicin.com"
              width={500}
              height={150}
              priority
              style={{ width: '100%', height: 'auto' }}
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
          <button className="musteri-notification-btn">
            {React.createElement(iconMapping.bell, { size: 20 })}
          </button>
          <button 
            className={`musteri-message-btn ${showChatWidget ? 'active' : ''}`} 
            onClick={toggleChatWidget}
          >
            {React.createElement(iconMapping.message, { size: 20 })}
            {/* Okunmamış mesaj badge'i */}
            {unreadCount > 0 && (
              <span className="musteri-message-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <div className="musteri-user-menu">
            <button className="musteri-user-btn" onClick={toggleDropdown}>
              {React.createElement(iconMapping.user, { size: 20 })}
              {isAuthenticated && !loading && user && (
                <span className="musteri-user-name">
                  {getUserDisplayName()}
                </span>
              )}
            </button>
            <span className="musteri-user-name">
                  {console.log('About to call getUserDisplayName')}
                  {getUserDisplayName()}
                </span>
            
            {showDropdown && (
              <div className="musteri-user-dropdown">
                {!isAuthenticated ? (
                  // Giriş yapılmamış
                  <>
                    <Link href="/musteri/giris" className="musteri-dropdown-item">
                      Giriş Yap
                    </Link>
                    <div className="musteri-dropdown-divider"></div>
                    <Link href="/musteri/kayit" className="musteri-dropdown-item">
                      Kayıt Ol
                    </Link>
                  </>
                ) : (
                  // Giriş yapılmış
                  <>
                    <div className="musteri-dropdown-header">
                      <strong>{getUserDisplayName()}</strong>
                      <span className="musteri-dropdown-role">
                        {role === 'vendor' ? 'Esnaf' : 'Müşteri'}
                      </span>
                    </div>
                    <div className="musteri-dropdown-divider"></div>
                    
                    <Link href="/musteri/profil" className="musteri-dropdown-item">
                      Profilim
                    </Link>
                    
                    <Link href="/musteri/mesajlar" className="musteri-dropdown-item">
                      Mesajlarım
                    </Link>
                    
                    <Link href="/musteri/taleplerim" className="musteri-dropdown-item">
                      Taleplerim
                    </Link>
                    
                    {role === 'client' && (
                      <>
                        <div className="musteri-dropdown-divider"></div>
                        <Link href="/musteri/esnaf-ol" className="musteri-dropdown-item">
                          Hizmet Vermek İstiyorum
                        </Link>
                      </>
                    )}
                    
                    {role === 'vendor' && (
                      <>
                        <div className="musteri-dropdown-divider"></div>
                        <Link href="/esnaf/panel" className="musteri-dropdown-item">
                          Esnaf Paneli
                        </Link>
                      </>
                    )}
                    
                    <div className="musteri-dropdown-divider"></div>
                    <button onClick={handleLogout} className="musteri-dropdown-item musteri-dropdown-logout">
                      Çıkış Yap
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* ChatWidget - sadece authenticated kullanıcılar için */}
      {isAuthenticated && role && (
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
