'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, getAuthToken } from '@/app/utils/api';
import { ChatWSClient } from '@/app/musteri/components/ChatWSClient';
import Image from 'next/image';
import { useGlobalWS } from '@/app/hooks/useGlobalWS';

// Conversation interface'i
interface Conversation {
  id: number;
  user1: any;
  user2: any;
  other_user: any; // Karşı taraf
  last_message_text: string;
  last_message_at: string;
  unread_count: number;
  unread_count_for_current_user: number; // Mevcut kullanıcı için unread count
  created_at: string;
  updated_at: string;
}

type Role = 'client' | 'vendor';

// Avatar utility fonksiyonu
const getAvatar = (user: any, isVendor: boolean) => {
  if (user?.avatar) {
    return (
      <Image
        src={user.avatar}
        alt={user.first_name || user.email || 'Avatar'}
        width={32}
        height={32}
        className="rounded-full"
        style={{ objectFit: 'cover' }}
      />
    );
  }
  
  // Default avatar - eğer avatar yoksa
  const initials = isVendor ? 'E' : 'M';
  const bgColor = isVendor ? '#ffd600' : '#667eea';
  const textColor = isVendor ? '#111' : 'white';
  
  return (
    <div style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: bgColor,
      color: textColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
      flexShrink: 0
    }}>
      {initials}
    </div>
  );
};

interface ChatWidgetProps {
  role: Role;
  isOpen?: boolean;
  onClose?: () => void;
  user?: any;
  onUnreadCountUpdate?: (conversations: any[]) => void;
}

export default function ChatWidget({ role, isOpen, onClose, user, onUnreadCountUpdate }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesCache, setMessagesCache] = useState<{[key: number]: any[]}>({});
  const [typing, setTyping] = useState(false);
  const [msg, setMsg] = useState('');
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requestModal, setRequestModal] = useState<any | null>(null);
  const [loadingRequestDetails, setLoadingRequestDetails] = useState(false);
  const wsRef = useRef<ChatWSClient | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const globalWS = useGlobalWS();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Scroll to bottom fonksiyonu
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
    setNewMessageCount(0);
  };

  // Scroll pozisyonunu kontrol et
  const checkScrollPosition = () => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const isAtBottomNow = container.scrollTop + container.clientHeight >= container.scrollHeight - 10; // 10px tolerance
    
    setIsAtBottom(isAtBottomNow);
  };

  // Scroll event handler
  const handleScroll = () => {
    checkScrollPosition();
  };

  // Skeleton loading component
  const MessageSkeleton = () => (
    <div className="skeleton-message" style={{ 
      display: 'flex', 
      justifyContent: 'flex-start', 
      marginBottom: 8, 
      alignItems: 'flex-end', 
      gap: 8
    }}>
      {/* Avatar skeleton */}
      <div className="skeleton-avatar" />
      
      {/* Message bubble skeleton */}
      <div className="skeleton-bubble">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
      </div>
    </div>
  );

  // Typing event'ini debounce ile gönder
  const sendTypingEvent = (isTyping: boolean) => {
    if (wsRef.current?.isOpen()) {
      // Önceki timeout'u temizle
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Hemen typing event'i gönder
      wsRef.current.typing(isTyping);
      
      // Typing false ise hemen gönder, true ise 1 saniye sonra false yap
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          if (wsRef.current?.isOpen()) {
            wsRef.current.typing(false);
          }
        }, 1000);
      }
    }
  };

  // Role mapping: role prop'u gönderilmezse varsayılan olarak 'client'
  const mappedRole = role || 'client';

  // Mevcut kullanıcının ID'sini al - ChatInterface'deki gibi güvenilir
  const getCurrentUserId = () => {
    try {
      // Önce vendor token'ı kontrol et
      const vendorToken = getAuthToken('vendor');
      if (vendorToken) {
        const tokenParts = vendorToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          return payload.user_id;
        }
      }
      
      // Vendor token yoksa client token'ı kontrol et
      const clientToken = getAuthToken('client');
      if (clientToken) {
        const tokenParts = clientToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          return payload.user_id;
        }
      }
    } catch (e) {
      console.error('Token decode error:', e);
    }
    return null;
  };

  // Conversation'daki pozisyona göre role belirle
  const getConversationRole = (conversation: any) => {
    if (!conversation) return mappedRole; // Default to the component's mappedRole if conversation not loaded yet
    
    // If the component's role is 'vendor', check if the current user is the vendor in this specific conversation
    if (mappedRole === 'vendor') {
      // This assumes `user` prop is passed and contains `id`
      return user?.id === conversation.vendor_user?.id ? 'vendor' : 'client';
    }
    
    return mappedRole; // For 'client' role, it's always 'client'
  };

  // isOpen prop'u varsa onu kullan, yoksa local state
  const isWidgetOpen = isOpen !== undefined ? isOpen : open;
  const setIsWidgetOpen = isOpen !== undefined ? (onClose || (() => {})) : setOpen;

  // Authentication kontrolü
  useEffect(() => {
    const checkAuth = () => {
      const vendorToken = getAuthToken('vendor');
      const clientToken = getAuthToken('client');
      const hasToken = vendorToken || clientToken;
      setIsAuthenticated(!!hasToken);
    };

    checkAuth();
    // Storage değişikliklerini dinle
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Gerçek unread count hesapla - sadece karşıdan gelen mesajlar
  const totalUnread = useMemo(() => {
    const total = conversations.reduce((sum, c) => {
      // Her conversation'da sadece karşıdan gelen mesajları say
      // Kendi gönderdiğimiz mesajları sayma
      
      // Yeni sistemde unread_count_for_current_user kullan
      return sum + (c.unread_count_for_current_user || 0);
    }, 0);
    
    return total;
  }, [conversations]);

  const buttonLabel = useMemo(() => isWidgetOpen ? 'Kapat' : 'Mesajlar', [isWidgetOpen]);
  
  const palette = useMemo(() => (
    mappedRole === 'vendor'
      ? { 
          primary: 'var(--chat-vendor-primary)',
          primaryText: 'var(--chat-vendor-text)',
          highlight: 'var(--chat-vendor-highlight)'
        }
      : { 
          primary: 'var(--chat-client-primary)',
          primaryText: 'var(--chat-client-text)',
          highlight: 'var(--chat-client-highlight)'
        }
  ), [mappedRole]);

  // load conversation list on open
  useEffect(() => {
    if (!isWidgetOpen || !isAuthenticated) return;
    (async () => {
      try {
        setLoadingList(true);
        const res = await api.chatListConversations();
        const items = res.data ?? res;
        setConversations(items);
        if (items?.length && !activeId) setActiveId(items[0].id);
        // Parent component'e unread count güncellemesi bildir
        if (onUnreadCountUpdate) {
          // Sadece karşıdan gelen mesajları say, kendi gönderdiğimizi değil
          const updatedConversations = items.map((c: any) => {
            const currentUserId = getCurrentUserId();
            
            // Eğer bu conversation'da vendor olarak varsak
            if (c.vendor_user?.id === currentUserId) {
              // Vendor olarak varsak, sadece client'tan gelen mesajları say
              return { ...c, vendor_unread_count: 0, client_unread_count: c.client_unread_count || 0 };
            } 
            // Eğer bu conversation'da client olarak varsak
            else if (c.client_user?.id === currentUserId) {
              // Client olarak varsak, sadece vendor'dan gelen mesajları say
              return { ...c, client_unread_count: 0, vendor_unread_count: c.vendor_unread_count || 0 };
            }
            
            return c;
          });
          onUnreadCountUpdate(updatedConversations);
        }
      } finally {
        setLoadingList(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWidgetOpen, isAuthenticated, onUnreadCountUpdate]);

  // background polling for unread counts (works when widget closed or open)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Polling kaldırıldı - sadece WebSocket ile real-time güncelleme
    // Widget açıldığında bir kez yükle
    if (isWidgetOpen) {
      (async () => {
        try {
          const res = await api.chatListConversations();
          const items = res.data ?? res;
          setConversations((prev) => {
            // preserve activeId but refresh list contents
            return items;
          });
          // aktif pencere açıksa okundu tut
          if (activeId) {
            await api.chatMarkRead(activeId).catch(() => {});
          }
          // Parent component'e unread count güncellemesi bildir
          if (onUnreadCountUpdate) {
            onUnreadCountUpdate(items);
          }
        } catch {}
      })();
    }
  }, [isWidgetOpen, activeId, isAuthenticated, onUnreadCountUpdate]);

  // Subscribe to global WS to update list/badges in real-time
  useEffect(() => {
    if (!isAuthenticated) return;
    const onMessage = async (e: CustomEvent<any>) => {
      const payload = e.detail?.data || {};
      const convId = payload.conversation;
      if (!convId) return;
      setConversations((prev) => {
        const updated = prev.map((c) => c.id === convId ? {
          ...c,
          last_message_text: payload.content ?? c.last_message_text,
          unread_count_for_current_user: (isWidgetOpen && activeId === convId) ? 0 : ((c.unread_count_for_current_user || 0) + 1),
        } : c);
        // Badge update to parent
        if (onUnreadCountUpdate) onUnreadCountUpdate(updated);
        return updated;
      });
      // Eğer bu konuşma aktif ve widget açıksa okundu bildir
      if (isWidgetOpen && activeId === convId) {
        try { await api.chatMarkRead(convId); } catch {}
      }
    };
    const onUpdate = (e: CustomEvent<any>) => {
      const p = e.detail?.data || {};
      const convId = p.conversation_id;
      setConversations((prev) => prev.map((c) => c.id === convId ? {
        ...c,
        last_message_text: p.last_message_text ?? c.last_message_text,
        unread_count_for_current_user: typeof p.unread_count === 'number' ? p.unread_count : c.unread_count_for_current_user,
      } : c));
    };
    globalWS.on('message.new', onMessage as any);
    globalWS.on('conversation.update', onUpdate as any);
    return () => {
      globalWS.off('message.new', onMessage as any);
      globalWS.off('conversation.update', onUpdate as any);
    };
  }, [globalWS, isAuthenticated, isWidgetOpen, activeId, onUnreadCountUpdate]);

  // load messages when activeId changes - cache kullanarak blink'i önle
  useEffect(() => {
    if (!isWidgetOpen || !activeId || !isAuthenticated) return;
    
    // Yeni conversation'a geçildiğinde scroll pozisyonunu sıfırla
    setIsAtBottom(true);
    setNewMessageCount(0);
    
    // Önce cache'den kontrol et
    if (messagesCache[activeId]) {
      setMessages(messagesCache[activeId]);
      // Cache'den yüklendiğinde akıllı scroll yap
      setTimeout(() => {
        if (isAtBottom) {
          scrollToBottom();
        }
      }, 100);
      return;
    }
    
    // Cache'de yoksa mesajları temizle ve skeleton göster
    setMessages([]);
    setShowSkeleton(true);
    
    (async () => {
      try {
        setShowSkeleton(true);
        const res = await api.chatGetMessages(activeId, { limit: 20, offset: 0 });
        const list = res.data?.results ?? [];
        const reversedList = list.reverse();
        
        // Cache'e kaydet ve state'i güncelle
        setMessagesCache(prev => ({ ...prev, [activeId]: reversedList }));
        setMessages(reversedList);
        setHasMoreMessages(res.data?.has_more ?? false);
        setNextOffset(res.data?.next_offset ?? null);
        setLoadingMoreMessages(false);
        
        // Skeleton'ı kaldır ve en son mesaja scroll yap
        setTimeout(() => {
          setShowSkeleton(false);
          // Skeleton kaldırıldıktan sonra en son mesaja scroll yap
          setTimeout(() => scrollToBottom(), 200);
        }, 300);
        
        // Mesajlar yüklendiğinde hemen okundu olarak işaretle
        try {
          await api.chatMarkRead(activeId);
          
          // Conversation list'te unread count'u güncelle
          setConversations((prev) => prev.map((c) => {
            if (c.id === activeId) {
              return { 
                ...c, 
                unread_count_for_current_user: 0,
                client_unread_count: 0, 
                vendor_unread_count: 0 
              };
            }
            return c;
          }));
          
          // Parent component'e güncelleme bildir
          if (onUnreadCountUpdate) {
            const updatedConversations = conversations.map((c) => {
              if (c.id === activeId) {
                return { 
                  ...c, 
                  unread_count_for_current_user: 0,
                  client_unread_count: 0, 
                  vendor_unread_count: 0 
                };
              }
              return c;
            });
            onUnreadCountUpdate(updatedConversations);
          }
        } catch (error) {
          console.error('Mesaj okundu işaretlenemedi:', error);
        }
      } catch (error) {
        console.error('Mesajlar yüklenemedi:', error);
        // Hata durumunda eski mesajları koru
      }
    })();
  }, [isWidgetOpen, activeId, isAuthenticated, conversations, onUnreadCountUpdate, messagesCache]);

  // Daha fazla mesaj yükle fonksiyonu
  const loadMoreMessages = async () => {
    if (!nextOffset || loadingMoreMessages || !activeId) return;
    
    try {
      setLoadingMoreMessages(true);
      const res = await api.chatGetMessages(activeId, { limit: 20, offset: nextOffset });
      const list = res.data?.results ?? [];
      
      // Yeni mesajları mevcut mesajların başına ekle (eski mesajlar)
      setMessages((prev) => [...list.reverse(), ...prev]);
      setHasMoreMessages(res.data?.has_more ?? false);
      setNextOffset(res.data?.next_offset ?? null);
    } catch (error) {
      console.error('Daha fazla mesaj yüklenemedi:', error);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  // connect WS for active conversation
  useEffect(() => {
    if (!isWidgetOpen || !activeId || !isAuthenticated) return;
    
    // Hem client hem vendor token'ını kontrol et - ChatInterface'deki gibi
    const clientToken = getAuthToken('client');
    const vendorToken = getAuthToken('vendor');
    const authToken = clientToken || vendorToken;
    
    if (!authToken) {
      console.error('Auth token bulunamadı - WebSocket bağlantısı kurulamıyor');
      console.log('Token kontrol detayları:', {
        mappedRole,
        clientToken: !!clientToken,
        vendorToken: !!vendorToken,
        roleFromProps: role
      });
      return;
    }
    
    const ws = new ChatWSClient({
      conversationId: activeId,
      authToken,
      onMessage: async (evt) => {
        console.log('WebSocket mesajı alındı:', evt);
        
        if (evt.event === 'message.new') {
          const newMessage = evt.data;
          
          // Yeni mesaj geldiğinde optimistic message'ı güncelle
          setMessages((prev) => {
            // Optimistic message'ı gerçek message ile değiştir
            const updated = prev.map((m) => 
              m.id.toString().startsWith('tmp-') && m.content === newMessage.content 
                ? newMessage 
                : m
            );
            
            // Eğer bu mesaj zaten yoksa ekle
            if (!updated.find(m => m.id === newMessage.id)) {
              const newList = [...updated, newMessage];
              // Cache'i de güncelle
              setMessagesCache(cache => ({ ...cache, [activeId]: newList }));
              
              // Yeni mesaj geldiğinde akıllı scroll yap
              if (isAtBottom) {
                setTimeout(() => scrollToBottom(), 100);
              } else {
                // Kullanıcı yukarıda scroll yapmışsa yeni mesaj sayısını artır
                setNewMessageCount(prev => prev + 1);
              }
              return newList;
            }
            
            // Cache'i güncelle
            setMessagesCache(cache => ({ ...cache, [activeId]: updated }));
            return updated;
          });
          
          // Aktif değilse ve karşı taraftan geldiyse unread ++
          const cid = evt.data?.conversation;
          if (!isWidgetOpen || cid !== activeId) {
            if (cid) {
              setConversations((prev) => {
                const updated = prev.map((c) => (
                  c.id === cid
                    ? { 
                        ...c, 
                        unread_count: (c.unread_count || 0) + 1, 
                        unread_count_for_current_user: (c.unread_count_for_current_user || 0) + 1,
                        last_message_text: evt.data.content 
                      }
                    : c
                ));
                // Parent component'e unread count güncellemesi bildir
                if (onUnreadCountUpdate) {
                  onUnreadCountUpdate(updated);
                }
                return updated;
              });
            }
          } else {
            // Aktif pencere ise okundu bildir
            await api.chatMarkRead(activeId);
            setConversations((prev) => {
              const updated = prev.map((c) => (c.id === activeId ? { 
                ...c, 
                unread_count: 0, 
                unread_count_for_current_user: 0,
                last_message_text: evt.data.content 
              } : c));
              // Parent component'e unread count güncellemesi bildir
              if (onUnreadCountUpdate) {
                onUnreadCountUpdate(updated);
              }
              return updated;
            });
          }
        } else if (evt.event === 'typing') {
          // Sadece karşı taraf typing yapıyorsa göster
          if (evt.data?.conversation === activeId) {
            const currentUserId = getCurrentUserId(); // getCurrentUserId() kullan
            const typingUserId = evt.data?.typing_user_id;
            
            // String vs number karşılaştırmasını düzelt
            const currentUserIdStr = currentUserId?.toString();
            const typingUserIdStr = typingUserId?.toString();
            
            // Sadece karşı taraf typing yapıyorsa göster
            if (currentUserIdStr && typingUserIdStr && currentUserIdStr !== typingUserIdStr) {
              setTyping(!!evt.data?.is_typing);
            } else if (currentUserIdStr && typingUserIdStr && currentUserIdStr === typingUserIdStr) {
              setTyping(false);
            }
          }
        }
      },
      onOpen: () => {
        console.log('WebSocket bağlantısı açıldı - Conversation:', activeId);
      },
      onClose: (e) => {
        console.log('WebSocket bağlantısı kapandı - Conversation:', activeId, 'Code:', e?.code, 'Reason:', e?.reason);
      },
    });
    
    ws.connect();
    wsRef.current = ws;
    
    return () => {
      ws.close();
      // Typing timeout'u temizle
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isWidgetOpen, activeId, mappedRole, isAuthenticated, onUnreadCountUpdate]);

  // Mesajlar yüklendiğinde akıllı scroll
  useEffect(() => {
    if (!showSkeleton && messages.length > 0) {
      if (isAtBottom) {
        setTimeout(() => scrollToBottom(), 100);
      } else {
        // Kullanıcı yukarıda scroll yapmışsa yeni mesaj sayısını artır
        setNewMessageCount(prev => prev + 1);
      }
    }
  }, [messages.length, isAtBottom, showSkeleton]);

  const send = async () => {
    const text = msg.trim();
    if (!text || !activeId || !isAuthenticated) return;
    
    // Optimistic message'ı doğru formatta oluştur - ChatInterface'deki gibi
    const currentUserId = getCurrentUserId();
    const optimistic: any = { 
      id: `tmp-${Date.now()}`, 
      content: text, 
      sender_user: currentUserId, // sender_user olarak currentUserId kullan
      created_at: new Date().toISOString() 
    };
    
    setMessages((p) => {
      const newList = [...p, optimistic];
      // Cache'i de güncelle
      if (activeId) {
        setMessagesCache(cache => ({ ...cache, [activeId]: newList }));
      }
      return newList;
    });
    setMsg('');
    
    // Yeni mesaj gönderildiğinde her zaman en alta scroll yap
    setTimeout(() => scrollToBottom(), 100);
    
    // Typing'i durdur
    sendTypingEvent(false);
    
    if (wsRef.current?.isOpen()) {
      wsRef.current.sendMessage(text);
    } else {
      try {
        const res = await api.chatSendMessageREST(activeId, text);
        const saved = res.data ?? res;
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
      } catch (e) {
        console.error('Mesaj gönderilemedi:', e);
        // Hata durumunda optimistic message'ı kaldır
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        // Hata durumunda input'u geri yükle
        setMsg(text);
      }
    }
  };

  // Eğer authenticated değilse ChatWidget'ı gösterme
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="musteri-chat-widget-container">
      {/* Floating button - sadece esnaf panelinde göster */}
      {isOpen === undefined && (
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            zIndex: 1000,
            background: palette.primary,
            color: palette.primaryText,
            border: 'none',
            borderRadius: 28,
            padding: '10px 16px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          {buttonLabel}
          {/* Badge - her zaman göster */}
          {totalUnread > 0 && (
            <span style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: 11,
              fontWeight: 800,
              minWidth: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.1)'
            }}>
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Drawer */}
      {isWidgetOpen && (
        <div
          className="chat-widget-drawer"
          style={{
            position: 'fixed',
            right: 20,
            bottom: isOpen !== undefined ? 'auto' : 76, // Müşteri panelinde aşağıya, esnaf panelinde yukarıya
            top: isOpen !== undefined ? 76 : 'auto', // Müşteri panelinde yukarıdan, esnaf panelinde otomatik
            width: 780,
            maxWidth: '95vw',
            height: 520,
            maxHeight: '70vh',
            background: mappedRole === 'vendor' ? 'var(--chat-vendor-bg)' : 'var(--chat-client-bg)',
            borderRadius: 12,
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            border: `1px solid ${mappedRole === 'vendor' ? 'var(--chat-vendor-border)' : 'var(--chat-client-border)'}`,
            display: 'flex',
            overflow: 'hidden',
            zIndex: 999,
            wordWrap: 'break-word'
          }}
        >
          {/* Sidebar conversations */}
          <div style={{ 
            width: 260, 
            borderRight: `1px solid ${mappedRole === 'vendor' ? 'var(--chat-vendor-border)' : 'var(--chat-client-border)'}`, 
            display: 'flex', 
            flexDirection: 'column',
            background: mappedRole === 'vendor' ? 'var(--chat-vendor-bg)' : 'var(--chat-client-bg)',
            color: mappedRole === 'vendor' ? 'var(--chat-vendor-text)' : 'var(--chat-client-text)'
          }}>
            <div style={{ padding: 12, fontWeight: 700 }}>
              Mesajlarım
            </div>
            <div style={{ overflowY: 'auto' }}>
              {loadingList ? (
                <div style={{ padding: 12, color: mappedRole === 'vendor' ? 'var(--chat-vendor-text)' : 'var(--chat-client-text)', opacity: 0.7 }}>Yükleniyor...</div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: 12, color: mappedRole === 'vendor' ? 'var(--chat-vendor-text)' : 'var(--chat-client-text)', opacity: 0.7 }}>Konuşma yok</div>
              ) : (
                conversations.map((c) => {
                  const unread = c.unread_count_for_current_user || 0;
                  
                  // Avatar için other_user bilgisini al
                  const otherUser = c.other_user;
                  
                  return (
                  <div
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      background: activeId === c.id ? palette.highlight : 'transparent',
                      borderLeft: activeId === c.id ? `3px solid ${palette.primary}` : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Avatar */}
                      {getAvatar(otherUser, false)}
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {otherUser?.first_name || otherUser?.email || 'Bilinmeyen Kullanıcı'}
                          {/* Badge - her conversation'da göster */}
                          {unread > 0 && (
                            <span style={{ 
                              marginLeft: 8, 
                              background: '#ef4444', 
                              color: '#fff', 
                              borderRadius: '50%', 
                              padding: '0 6px', 
                              fontSize: 11, 
                              fontWeight: 800,
                              minWidth: 18,
                              height: 18,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: mappedRole === 'vendor' ? 'var(--chat-vendor-text)' : 'var(--chat-client-text)', opacity: 0.7 }}>
                          {(() => {
                            try {
                              if (typeof c.last_message_text === 'string' && c.last_message_text.startsWith('OFFER_CARD::')) {
                                const data = JSON.parse(c.last_message_text.replace('OFFER_CARD::', ''));
                                const title = data?.title || 'Teklif';
                                const price = data?.price != null ? `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.price)} ₺` : null;
                                const days = data?.days != null ? `${data.days} gün` : null;
                                const parts = [price, days].filter(Boolean).join(' • ');
                                return parts ? `Teklif: ${title} (${parts})` : `Teklif: ${title}`;
                              }
                            } catch (e) {}
                            return c.last_message_text;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )})
              )}
            </div>
          </div>

          {/* Chat window */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, borderBottom: `2px solid ${palette.primary}`, fontWeight: 700 }}>
              {(() => {
                const currentConversation = conversations.find((c) => c.id === activeId);
                
                if (currentConversation?.other_user) {
                  return currentConversation.other_user.first_name || 
                         currentConversation.other_user.email || 'Sohbet';
                } else {
                  return 'Sohbet';
                }
              })()}
            </div>
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              style={{ 
                flex: 1, 
                overflowY: 'auto', 
                overflowX: 'hidden',
                padding: 12, 
                background: mappedRole === 'vendor' ? 'var(--chat-vendor-bg-secondary)' : 'var(--chat-client-bg-secondary)',
                wordWrap: 'break-word',
                position: 'relative'
              }}
            >
              {/* Daha fazla mesaj yükle butonu - en üstte */}
              {hasMoreMessages && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '10px 0', 
                  marginBottom: '10px',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <button
                    onClick={loadMoreMessages}
                    disabled={loadingMoreMessages}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${palette.primary}`,
                      color: palette.primary,
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: loadingMoreMessages ? 'not-allowed' : 'pointer',
                      opacity: loadingMoreMessages ? 0.6 : 1
                    }}
                  >
                    {loadingMoreMessages ? 'Yükleniyor...' : 'Daha Fazla Mesaj Yükle'}
                  </button>
                </div>
              )}

              {/* Skeleton loading - sadece ilk yüklemede göster */}
              {showSkeleton && (
                <>
                  <MessageSkeleton />
                  <MessageSkeleton />
                  <MessageSkeleton />
                </>
              )}
              
              {!showSkeleton && messages.length === 0 ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  color: mappedRole === 'vendor' ? 'var(--chat-vendor-text)' : 'var(--chat-client-text)',
                  opacity: 0.7,
                  fontSize: 14,
                  textAlign: 'center'
                }}>
                  Henüz mesaj yok.<br />İlk mesajı gönderin!
                </div>
              ) : !showSkeleton ? (
                messages.map((m) => {
                  const currentConversation = conversations.find(c => c.id === activeId);
                  
                  // Mesaj yönünü doğru hesapla - ChatInterface'deki gibi
                  const currentUserId = getCurrentUserId();
                  const isOwn = m.sender_user?.toString() === currentUserId?.toString();
                  const justify = isOwn ? 'flex-end' : 'flex-start';
                  const bubbleStyle: React.CSSProperties = isOwn
                    ? (mappedRole === 'vendor'
                        ? { 
                            background: 'var(--chat-vendor-primary)',
                            color: 'var(--chat-vendor-text)',
                            border: '1px solid transparent'
                          }
                        : { 
                            background: 'var(--chat-client-primary)',
                            color: 'var(--chat-client-text)',
                            border: '1px solid transparent'
                          })
                    : { 
                        background: 'var(--white)',
                        color: 'var(--text)',
                        border: '1px solid var(--border)'
                      };
                  
                  // Avatar için other_user bilgisini al
                  const otherUser = currentConversation?.other_user;
                  
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: justify, marginBottom: 8, alignItems: 'flex-end', gap: 8 }}>
                      {/* Sadece karşı tarafın mesajlarında avatar göster */}
                      {!isOwn && (
                        getAvatar(otherUser, false)
                      )}
                      <div style={{ 
                        ...bubbleStyle, 
                        borderRadius: 8, 
                        padding: '8px 12px', 
                        maxWidth: '75%',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {(() => {
                          if (m.id === `tmp-${Date.now()}`) return 'Gönderiliyor...';
                          
                          try {
                            if (typeof m.content === 'string' && m.content.startsWith('OFFER_CARD::')) {
                              const data = JSON.parse(m.content.replace('OFFER_CARD::', ''));
                              return (
                                <div style={{
                                  border: '1px dashed #94a3b8',
                                  borderRadius: 10,
                                  padding: 12,
                                  background: '#f8fafc',
                                  color: '#0f172a',
                                  maxWidth: 360
                                }}>
                                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Teklif Gönderildi</div>
                                  <div style={{ fontSize: 13, marginBottom: 8 }}>Talep: {data?.title || '-'}</div>
                                  {(data?.price != null || data?.days != null || data?.phone) && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, marginBottom: 8 }}>
                                      <div><span style={{ fontWeight: 600 }}>Fiyat:</span> {data?.price != null ? `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.price)} ₺` : '—'}</div>
                                      <div><span style={{ fontWeight: 600 }}>Gün:</span> {data?.days != null ? String(data.days) : '—'}</div>
                                      <div style={{ gridColumn: '1 / span 2' }}><span style={{ fontWeight: 600 }}>Telefon:</span> {data?.phone || '—'}</div>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            
                            // Talep mention formatını kontrol et
                            if (typeof m.content === 'string' && m.content.includes('📋 Talep #')) {
                              const lines = m.content.split('\n');
                              const mentionLine = lines[0];
                              const messageLines = lines.slice(1).filter((line: string) => line.trim());
                              
                              // Talep ID'sini ve başlığını çıkar
                              const match = mentionLine.match(/📋 Talep #(\d+): "([^"]+)"/);
                              if (match) {
                                const [, requestId, requestTitle] = match;
                                const message = messageLines.join('\n');
                                
                                return (
                                  <div>
                                    {/* Talep mention kısmı - özel format */}
                                    <div 
                                      style={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 6,
                                        padding: '8px 12px',
                                        background: '#f1f5f9',
                                        color: '#0f172a',
                                        marginBottom: message ? '8px' : '0',
                                        display: 'inline-block',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onClick={async () => {
                                        setLoadingRequestDetails(true);
                                        try {
                                          // Role'ü belirle - müşteri panelinde isek client, değilse vendor
                                          const isMusteriContext = window.location?.pathname?.startsWith('/musteri');
                                          const role = isMusteriContext ? 'client' : 'vendor';
                                          
                                          // API'den tam talep detaylarını çek
                                          const response = await api.getServiceRequestDetails(requestId, role);
                                          setRequestModal(response.data || { id: requestId, title: requestTitle });
                                        } catch (error) {
                                          console.error('Talep detayları yüklenemedi:', error);
                                          // Hata durumunda sadece mevcut bilgileri göster
                                          setRequestModal({ id: requestId, title: requestTitle });
                                        } finally {
                                          setLoadingRequestDetails(false);
                                        }
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#e2e8f0';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#f1f5f9';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                      }}
                                    >
                                      <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '6px'
                                      }}>
                                        <span style={{ fontSize: '14px' }}>📋</span>
                                        <span style={{ fontWeight: 600, color: '#1e40af', fontSize: '13px' }}>
                                          Talep #{requestId}: "{requestTitle}"
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Kullanıcı mesajı - normal format */}
                                    {message && (
                                      <div style={{ 
                                        fontSize: '14px', 
                                        lineHeight: '1.4',
                                        color: '#374151',
                                        whiteSpace: 'pre-wrap'
                                      }}>
                                        {message}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            }
                          } catch (e) {}
                          return m.content;
                        })()}
                      </div>
                    </div>
                  );
                })
              ) : null}
              
              {/* Scroll marker - en son mesajın altında */}
              <div ref={messagesEndRef} />
              
              {/* Yeni Mesaj Butonu - sadece kullanıcı yukarıda scroll yapmışsa göster */}
              {newMessageCount > 0 && !isAtBottom && (
                <div style={{
                  position: 'absolute',
                  bottom: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10
                }}>
                  <button
                    onClick={scrollToBottom}
                    style={{
                      background: palette.primary,
                      color: palette.primaryText,
                      border: 'none',
                      borderRadius: 20,
                      padding: '8px 16px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>↓</span>
                    {newMessageCount} yeni mesaj
                  </button>
                </div>
              )}
            </div>
            
            {/* Typing göstergesi - mesajların dışında, sabit pozisyonda */}
            {typing && (
              <div style={{ 
                padding: '8px 12px', 
                background: mappedRole === 'vendor' ? 'var(--chat-vendor-bg)' : 'var(--chat-client-bg)', 
                borderTop: `1px solid ${mappedRole === 'vendor' ? 'var(--chat-vendor-border)' : 'var(--chat-client-border)'}`,
                borderBottom: `1px solid ${mappedRole === 'vendor' ? 'var(--chat-vendor-border)' : 'var(--chat-client-border)'}`,
                fontSize: 12, 
                color: mappedRole === 'vendor' ? 'var(--chat-vendor-text)' : 'var(--chat-client-text)',
                opacity: 0.7,
                fontStyle: 'italic'
              }}>
                Yazıyor...
              </div>
            )}
            
            
            <div style={{ padding: 10, display: 'flex', gap: 8, borderTop: `2px solid ${palette.primary}` }}>
              <input
                value={msg}
                onChange={(e) => {
                  setMsg(e.target.value);
                  // Karşı tarafa typing event'i gönder
                  sendTypingEvent(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                onBlur={() => {
                  // Input'tan çıkınca typing'i durdur
                  sendTypingEvent(false);
                }}
                placeholder="Mesaj yaz..."
                style={{ flex: 1, border: `1px solid ${palette.primary}`, borderRadius: 8, padding: '10px 14px' }}
              />
              <button onClick={send} style={{ background: palette.primary, color: palette.primaryText, border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 700 }}>Gönder</button>
            </div>
          </div>
        </div>
      )}

      {/* Talep Detay Modal */}
      {requestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 600, padding: 24, position: 'relative' }}>
            <button onClick={() => setRequestModal(null)} style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', fontSize: 22, color: '#666', cursor: 'pointer' }}>×</button>
            <h3 style={{ margin: 0, marginBottom: 16, fontSize: 20, fontWeight: 700, color: '#111' }}>Talep Detayı</h3>
            
            {loadingRequestDetails ? (
              <div style={{ 
                background: '#f8f9fa', 
                padding: '16px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                border: '1px solid #e9ecef',
                textAlign: 'center'
              }}>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>Talep detayları yükleniyor...</div>
              </div>
            ) : (
              /* Talep Bilgileri */
              <div style={{ 
                background: '#f8f9fa', 
                padding: '16px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                border: '1px solid #e9ecef'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px' }}>📋</span>
                <span style={{ fontWeight: 700, fontSize: '16px', color: '#1e40af' }}>
                  Talep #{requestModal.id}
                </span>
                {requestModal.status && (
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: requestModal.status === 'pending' ? '#fef3c7' : 
                               requestModal.status === 'responded' ? '#d1fae5' :
                               requestModal.status === 'completed' ? '#dbeafe' :
                               requestModal.status === 'cancelled' ? '#fee2e2' : '#f3f4f6',
                    color: requestModal.status === 'pending' ? '#92400e' :
                           requestModal.status === 'responded' ? '#065f46' :
                           requestModal.status === 'completed' ? '#1e40af' :
                           requestModal.status === 'cancelled' ? '#991b1b' : '#6b7280'
                  }}>
                    {requestModal.status === 'pending' ? 'Beklemede' :
                     requestModal.status === 'responded' ? 'Yanıtlandı' :
                     requestModal.status === 'completed' ? 'Tamamlandı' :
                     requestModal.status === 'cancelled' ? 'İptal' : 'Bilinmiyor'}
                  </span>
                )}
              </div>
              
              {/* Talep Türü */}
              {requestModal.request_type && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Talep Türü:</div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>
                    {requestModal.request_type === 'quote' ? 'Fiyat Teklifi' :
                     requestModal.request_type === 'appointment' ? 'Randevu' :
                     requestModal.request_type === 'emergency' ? 'Acil Yardım' :
                     requestModal.request_type === 'part' ? 'Parça Talebi' : requestModal.request_type}
                  </div>
                </div>
              )}
              
              {/* Hizmet */}
              {requestModal.service_name && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Hizmet:</div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>{requestModal.service_name}</div>
                </div>
              )}
              
              {/* Araç Bilgisi */}
              {requestModal.vehicle_info && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Araç Bilgisi:</div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>{requestModal.vehicle_info}</div>
                </div>
              )}
              
              {/* Başlık */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Başlık:</div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>"{requestModal.title}"</div>
              </div>
              
              {/* Açıklama */}
              {requestModal.description && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Açıklama:</div>
                  <div style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {requestModal.description}
                  </div>
                </div>
              )}
              
              {/* Telefon */}
              {requestModal.client_phone && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Telefon:</div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>{requestModal.client_phone}</div>
                </div>
              )}
              
              {/* Oluşturulma Tarihi */}
              {requestModal.created_at && (
                <div>
                  <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Oluşturulma Tarihi:</div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>
                    {new Date(requestModal.created_at).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button 
                onClick={() => setRequestModal(null)} 
                style={{ 
                  padding: '10px 20px', 
                  border: 'none', 
                  borderRadius: 8, 
                  background: '#111', 
                  color: '#ffd600', 
                  fontWeight: 700, 
                  cursor: 'pointer' 
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


