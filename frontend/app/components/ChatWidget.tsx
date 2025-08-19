'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, getAuthToken } from '@/app/utils/api';
import { ChatWSClient } from '@/app/musteri/components/ChatWSClient';
import Image from 'next/image';

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
  const [typing, setTyping] = useState(false);
  const [msg, setMsg] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const wsRef = useRef<ChatWSClient | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Role mapping: 'client' -> 'client' (artık aynı)
  const mappedRole = role;

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
      ? { primary: '#ffd600', primaryText: '#111', highlight: 'rgba(255,214,0,0.15)' }
      : { primary: '#2d3748', primaryText: '#fff', highlight: 'rgba(45,55,72,0.15)' }
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

  // load messages when activeId changes
  useEffect(() => {
    if (!isWidgetOpen || !activeId || !isAuthenticated) return;
    (async () => {
      const res = await api.chatGetMessages(activeId, { limit: 50 });
      const list = res.data?.results ?? [];
      setMessages(list.reverse());
      
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
    })();
  }, [isWidgetOpen, activeId, isAuthenticated, conversations, onUnreadCountUpdate]);

  // connect WS for active conversation
  useEffect(() => {
    if (!isWidgetOpen || !activeId || !isAuthenticated) return;
    
    // Role'e göre doğru token'ı al
    const authToken = getAuthToken(mappedRole === 'vendor' ? 'vendor' : 'client');
    
    if (!authToken) {
      console.error('Auth token bulunamadı - WebSocket bağlantısı kurulamıyor');
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
              return [...updated, newMessage];
            }
            
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
    
    setMessages((p) => [...p, optimistic]);
    setMsg('');
    
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
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            display: 'flex',
            overflow: 'hidden',
            zIndex: 999,
          }}
        >
          {/* Sidebar conversations */}
          <div style={{ width: 260, borderRight: '1px solid #e9ecef', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, fontWeight: 700 }}>
              Mesajlarım
            </div>
            <div style={{ overflowY: 'auto' }}>
              {loadingList ? (
                <div style={{ padding: 12, color: '#666' }}>Yükleniyor...</div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: 12, color: '#666' }}>Konuşma yok</div>
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
                        <div style={{ fontSize: 12, color: '#666' }}>{c.last_message_text}</div>
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
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#fafafa' }}>
              {messages.map((m) => {
                const currentConversation = conversations.find(c => c.id === activeId);
                
                // Mesaj yönünü doğru hesapla - ChatInterface'deki gibi
                const currentUserId = getCurrentUserId();
                const isOwn = m.sender_user?.toString() === currentUserId?.toString();
                const justify = isOwn ? 'flex-end' : 'flex-start';
                const bubbleStyle: React.CSSProperties = isOwn
                  ? (mappedRole === 'vendor'
                      ? { background: '#ffd600', color: '#111', border: '1px solid transparent' }
                      : { background: '#2d3748', color: '#fff', border: '1px solid transparent' })
                  : { background: '#fff', color: '#111', border: '1px solid #e9ecef' };
                
                // Avatar için other_user bilgisini al
                const otherUser = currentConversation?.other_user;
                
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: justify, marginBottom: 8, alignItems: 'flex-end', gap: 8 }}>
                    {/* Sadece karşı tarafın mesajlarında avatar göster */}
                    {!isOwn && (
                      getAvatar(otherUser, false)
                    )}
                    <div style={{ ...bubbleStyle, borderRadius: 8, padding: '8px 12px', maxWidth: '75%' }}>{m.id === `tmp-${Date.now()}` ? 'Gönderiliyor...' : m.content}</div>
                  </div>
                );
              })}
              {typing && <div style={{ fontSize: 12, color: '#666' }}>Yazıyor...</div>}
            </div>
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
    </div>
  );
}


