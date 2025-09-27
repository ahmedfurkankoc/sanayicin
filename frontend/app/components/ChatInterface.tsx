'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAuthToken } from '@/app/utils/api';
import { ChatWSClient } from '@/app/musteri/components/ChatWSClient';
import Image from 'next/image';

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

interface ChatInterfaceProps {
  conversationId: number;
  variant: 'musteri' | 'esnaf'; // CSS variant'ı belirlemek için
  onUnreadCountUpdate?: (conversations: any[]) => void;
}

export default function ChatInterface({ conversationId, variant, onUnreadCountUpdate }: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const wsRef = useRef<ChatWSClient | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [offerModal, setOfferModal] = useState<any | null>(null);
  const [requestModal, setRequestModal] = useState<any | null>(null);
  const [loadingRequestDetails, setLoadingRequestDetails] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const scrollToBottom = () => {
    try {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setIsAtBottom(true);
      setNewMessageCount(0);
    } catch (e) {}
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
    <div className={`${variant}-message-item skeleton-message`}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: '8px',
        marginBottom: '8px'
      }}>
        {/* Avatar skeleton */}
        <div className="skeleton-avatar" />
        
        {/* Message bubble skeleton */}
        <div className="skeleton-bubble">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      </div>
    </div>
  );

  // Mevcut kullanıcının ID'sini al
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

  // Conversation bilgilerini yükle
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const res = await api.chatListConversations();
        const conversations = res.data ?? res;
        const currentConv = conversations.find((c: any) => c.id === conversationId);
        setConversation(currentConv);
      } catch (error) {
        console.error('Konuşma bilgileri yüklenemedi:', error);
      }
    };

    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  // İlk mesajları yükle (son 20 mesaj)
  useEffect(() => {
    // Yeni conversation'a geçildiğinde scroll pozisyonunu sıfırla
    setIsAtBottom(true);
    setNewMessageCount(0);
    
    const loadMessages = async () => {
      try {
        setLoading(true);
        setMessages([]); // Mesajları temizle
        setShowSkeleton(true);
        const res = await api.chatGetMessages(conversationId, { limit: 20, offset: 0 });
        const list = res.data?.results ?? [];
        setMessages(list.reverse());
        setHasMore(res.data?.has_more ?? false);
        setNextOffset(res.data?.next_offset ?? null);
        
        // Mesajlar yüklendiğinde okundu olarak işaretle
        if (list.length > 0) {
          await api.chatMarkRead(conversationId);
          // Parent component'e unread count güncellemesi bildir
          if (onUnreadCountUpdate) {
            // Conversation list'i yeniden yükle ve güncelle
            const convRes = await api.chatListConversations();
            const conversations = convRes.data ?? convRes;
            onUnreadCountUpdate(conversations);
          }
        }
      } catch (error) {
        console.error('Mesajlar yüklenemedi:', error);
      } finally {
        setLoading(false);
        // Skeleton'ı kaldır ve en son mesaja scroll yap
        setTimeout(() => {
          setShowSkeleton(false);
          // Skeleton kaldırıldıktan sonra en son mesaja scroll yap
          setTimeout(() => scrollToBottom(), 100);
        }, 300);
      }
    };

    loadMessages();
  }, [conversationId, onUnreadCountUpdate]);

  // İlk açılışta ve messages güncellendiğinde akıllı scroll
  useEffect(() => {
    if (!loading && !showSkeleton && messages.length > 0) {
      // İlk yüklemede her zaman en alta scroll
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [loading, showSkeleton, messages.length]);

  useEffect(() => {
    // Yeni mesaj eklendiğinde akıllı scroll (sadece skeleton olmadığında)
    if (!showSkeleton && messages.length > 0) {
      if (isAtBottom) {
        setTimeout(() => scrollToBottom(), 100);
      } else {
        // Kullanıcı yukarıda scroll yapmışsa yeni mesaj sayısını artır
        setNewMessageCount(prev => prev + 1);
      }
    }
  }, [messages.length, isAtBottom, showSkeleton]);

  // Daha fazla mesaj yükle
  const loadMoreMessages = async () => {
    if (!nextOffset || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const res = await api.chatGetMessages(conversationId, { limit: 20, offset: nextOffset });
      const list = res.data?.results ?? [];
      
      // Yeni mesajları mevcut mesajların başına ekle (eski mesajlar)
      setMessages((prev) => [...list.reverse(), ...prev]);
      setHasMore(res.data?.has_more ?? false);
      setNextOffset(res.data?.next_offset ?? null);
    } catch (error) {
      console.error('Daha fazla mesaj yüklenemedi:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // WebSocket bağlantısı
  useEffect(() => {
    // Hem client hem vendor token'ını kontrol et
    const clientToken = getAuthToken('client');
    const vendorToken = getAuthToken('vendor');
    const authToken = clientToken || vendorToken;
    
    if (!authToken) return;
    
    const ws = new ChatWSClient({ 
      conversationId, 
      authToken, 
      onMessage: async (evt) => {
        if (evt.event === 'typing') {
          // Sadece karşı taraf typing yapıyorsa göster
          if (evt.data?.conversation === conversationId) {
            const currentUserId = getCurrentUserId();
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
        } else if (evt.event === 'message.new') {
          // Yeni mesaj geldiğinde optimistic message'ı güncelle
          const newMessage = evt.data;
          setMessages((prev) => {
            // Optimistic message'ı gerçek message ile değiştir
            const updated = prev.map((m) => 
              m.id.toString().startsWith('temp-') && m.content === newMessage.content 
                ? newMessage 
                : m
            );
            
            // Eğer bu mesaj zaten yoksa ekle
            if (!updated.find(m => m.id === newMessage.id)) {
              // Yeni mesaj geldiğinde akıllı scroll
              if (isAtBottom) {
                setTimeout(() => scrollToBottom(), 100);
              } else {
                // Kullanıcı yukarıda scroll yapmışsa yeni mesaj sayısını artır
                setNewMessageCount(prev => prev + 1);
              }
              return [...updated, newMessage];
            }
            
            return updated;
          });
          
          // Yeni mesaj geldiğinde okundu olarak işaretle
          await api.chatMarkRead(conversationId);
          // Parent component'e unread count güncellemesi bildir
          if (onUnreadCountUpdate) {
            const convRes = await api.chatListConversations();
            const conversations = convRes.data ?? convRes;
            onUnreadCountUpdate(conversations);
          }
        }
      }
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
  }, [conversationId]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    
    // Optimistic append - kendi mesajım olarak ekle
    const optimistic = {
      id: `temp-${Date.now()}`,
      content: text,
      sender_user: getCurrentUserId(),
      created_at: new Date().toISOString(),
    } as any;
    
    setMessages((prev) => [...prev, optimistic]);
    setInput(''); // Input'u temizle
    
    // Kendi mesajını gönderdiğinde her zaman en alta scroll yap
    setTimeout(() => scrollToBottom(), 100);
    
    // Typing'i durdur
    sendTypingEvent(false);
    
    if (wsRef.current?.isOpen()) {
      wsRef.current.sendMessage(text);
    } else {
      try {
        const res = await api.chatSendMessageREST(conversationId, text);
        const saved = res.data ?? res;
        // Optimistic message'ı gerçek message ile değiştir
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
      } catch (e) {
        console.error('REST send fail', e);
        // Hata durumunda optimistic message'ı kaldır
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        // Hata durumunda input'u geri yükle
        setInput(text);
      }
    }
  };

  if (loading) return <div className={`${variant}-loading`}>Yükleniyor...</div>;

  return (
    <div className={`chat-interface ${variant}-chat-interface`}>
      {/* Header - Konuşma bilgileri */}
      {conversation && (
        <div className={`${variant}-chat-header`}>
          <div className={`${variant}-chat-header-content`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <h2 className={`${variant}-chat-title`}>
              {conversation.other_user?.first_name || 
               conversation.other_user?.email || 'Sohbet'}
            </h2>
            <button
              onClick={() => {
                const href = variant === 'esnaf' ? '/esnaf/panel/mesajlar' : '/musteri/mesajlar';
                try { router.push(href); } catch (e) { try { window.location.href = href; } catch (_) {} }
              }}
              className={`${variant}-chat-back-button`}
              aria-label="Geri Dön"
              style={{
                background: 'var(--black)',
                color: 'var(--yellow)',
                border: 'none',
                padding: '8px 12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ← Geri
            </button>
          </div>
        </div>
      )}

      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={`${variant}-chat-messages-container`}
        style={{ position: 'relative' }}
      >
        {/* Daha fazla mesaj yükle butonu */}
        {hasMore && (
          <div className={`${variant}-load-more-container`}>
            <button
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className={`${variant}-load-more-button`}
            >
              {loadingMore ? 'Yükleniyor...' : 'Daha Fazla Mesaj Yükle'}
            </button>
          </div>
        )}
        
        {/* Mesajlar */}
        <div className={`${variant}-messages-list`}>
          {/* Skeleton loading - sadece ilk yüklemede göster */}
          {showSkeleton && (
            <>
              <MessageSkeleton />
              <MessageSkeleton />
              <MessageSkeleton />
            </>
          )}
          
          {!showSkeleton && messages.map((m) => {
            // Kendi mesajım mı kontrol et
            const currentUserId = getCurrentUserId();
            const isOwn = m.sender_user?.toString() === currentUserId?.toString();
            
            return (
              <div key={m.id} className={`${variant}-message-item ${isOwn ? 'own' : 'other'}`}>
                {/* Sadece karşı tarafın mesajlarında avatar göster */}
                {!isOwn && (
                  <div className={`${variant}-message-avatar`}>
                    {getAvatar(conversation?.other_user, false)}
                  </div>
                )}
                <div className={`${variant}-message-bubble ${isOwn ? 'own' : 'other'}`}>
                  {(() => {
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
                            <button onClick={() => setOfferModal(data)} style={{
                              display: 'inline-block',
                              padding: '6px 10px',
                              background: '#111',
                              color: '#ffd600',
                              borderRadius: 8,
                              fontWeight: 700,
                              textDecoration: 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}>Detayı Gör</button>
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
          })}
          <div ref={bottomRef} />
          
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
                  background: 'var(--black)',
                  color: 'var(--yellow)',
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
      </div>

      {/* Typing göstergesi - mesajların dışında, sabit pozisyonda */}
      {typing && (
        <div className={`${variant}-typing-indicator`}>
          <div className={`${variant}-typing-text`}>
            Yazıyor...
          </div>
        </div>
      )}

      {/* Input alanı */}
      <div className={`${variant}-chat-input-container`}>
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Karşı tarafa typing event'i gönder
            sendTypingEvent(true);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              send();
            }
          }}
          onBlur={() => {
            // Input'tan çıkınca typing'i durdur
            sendTypingEvent(false);
          }}
          className={`${variant}-chat-input`}
          placeholder="Mesaj yaz..." 
        />
        <button 
          onClick={send} 
          className={`${variant}-chat-send-button`}
        >
          Gönder
        </button>
      </div>

      {/* Teklif Detay Modal */}
      {offerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 560, padding: 24, position: 'relative' }}>
            <button onClick={() => setOfferModal(null)} style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', fontSize: 22, color: '#666', cursor: 'pointer' }}>×</button>
            <h3 style={{ margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700, color: '#111' }}>Teklif Detayı</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ fontSize: 14, color: '#334155' }}><span style={{ fontWeight: 600 }}>Talep:</span> {offerModal?.title || '-'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                <div><span style={{ fontWeight: 600 }}>Fiyat:</span> {offerModal?.price != null ? `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(offerModal.price)} ₺` : '—'}</div>
                <div><span style={{ fontWeight: 600 }}>Gün:</span> {offerModal?.days != null ? String(offerModal.days) : '—'}</div>
              </div>
              <div style={{ fontSize: 14, color: '#334155' }}><span style={{ fontWeight: 600 }}>Telefon:</span> {offerModal?.phone || '—'}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
              {offerModal?.url && (
                <button onClick={() => { try { window.open(offerModal.url, '_blank'); } catch (e) {} }} style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Sayfayı Aç</button>
              )}
              <button onClick={() => setOfferModal(null)} style={{ padding: '10px 16px', border: 'none', borderRadius: 8, background: '#111', color: '#ffd600', fontWeight: 700, cursor: 'pointer' }}>Kapat</button>
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
