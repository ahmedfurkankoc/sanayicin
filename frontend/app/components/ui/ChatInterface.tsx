'use client';

import React, { useEffect, useRef, useState } from 'react';
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
      
      // Vendor token yoksa customer token'ı kontrol et
      const customerToken = getAuthToken('customer');
      if (customerToken) {
        const tokenParts = customerToken.split('.');
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
    const loadMessages = async () => {
      try {
        setLoading(true);
        const res = await api.chatGetMessages(conversationId, { limit: 20, offset: 0 });
        const list = res.data?.results ?? [];
        setMessages(list.reverse());
        setHasMore(res.data?.has_more ?? false);
        setNextOffset(res.data?.next_offset ?? null);
      } catch (error) {
        console.error('Mesajlar yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

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
    // Hem customer hem vendor token'ını kontrol et
    const customerToken = getAuthToken('customer');
    const vendorToken = getAuthToken('vendor');
    const authToken = customerToken || vendorToken;
    
    if (!authToken) return;
    
    const ws = new ChatWSClient({ 
      conversationId, 
      authToken, 
      onMessage: (evt) => {
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
              return [...updated, newMessage];
            }
            
            return updated;
          });
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
          <div className={`${variant}-chat-header-content`}>
            <div>
              <h2 className={`${variant}-chat-title`}>
                {conversation.other_user?.first_name || 
                 conversation.other_user?.email || 'Sohbet'}
              </h2>
            </div>
          </div>
        </div>
      )}

      <div className={`${variant}-chat-messages-container`}>
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
          {messages.map((m) => {
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
                  {m.content}
                </div>
              </div>
            );
          })}
          
          {/* Typing göstergesi - sadece karşı taraf typing yapıyorsa */}
          {typing && (
            <div className={`${variant}-typing-indicator`}>
              <div className={`${variant}-typing-text`}>
                Yazıyor...
              </div>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}
