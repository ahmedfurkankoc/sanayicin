'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, getAuthToken } from '@/app/utils/api';
import { ChatWSClient } from '@/app/musteri/components/ChatWSClient';

type Role = 'customer' | 'vendor';

type Conversation = {
  id: number;
  vendor?: any;
  vendor_display_name?: string;
  client_user?: any;
  last_message_text?: string;
  last_message_at?: string;
  client_unread_count?: number;
  vendor_unread_count?: number;
};

export default function ChatWidget({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [typing, setTyping] = useState(false);
  const [msg, setMsg] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const wsRef = useRef<ChatWSClient | null>(null);

  // Authentication kontrolü
  useEffect(() => {
    const checkAuth = () => {
      const vendorToken = localStorage.getItem('esnaf_access_token');
      const customerToken = localStorage.getItem('customer_access_token');
      const hasToken = vendorToken || customerToken;
      setIsAuthenticated(!!hasToken);
    };

    checkAuth();
    // Storage değişikliklerini dinle
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (role === 'vendor' ? (c.vendor_unread_count || 0) : (c.client_unread_count || 0)), 0);
  }, [conversations, role]);

  const buttonLabel = useMemo(() => open ? 'Kapat' : 'Mesajlar', [open]);
  
  const palette = useMemo(() => (
    role === 'vendor'
      ? { primary: '#ffd600', primaryText: '#111', highlight: 'rgba(255,214,0,0.15)' }
      : { primary: '#2d3748', primaryText: '#fff', highlight: 'rgba(45,55,72,0.15)' }
  ), [role]);

  // load conversation list on open
  useEffect(() => {
    if (!open || !isAuthenticated) return;
    (async () => {
      try {
        setLoadingList(true);
        const res = await api.chatListConversations();
        const items = res.data ?? res;
        setConversations(items);
        if (items?.length && !activeId) setActiveId(items[0].id);
      } finally {
        setLoadingList(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAuthenticated]);

  // background polling for unread counts (works when widget closed or open)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let timer: any;
    const tick = async () => {
      try {
        const res = await api.chatListConversations();
        const items = res.data ?? res;
        setConversations((prev) => {
          // preserve activeId but refresh list contents
          return items;
        });
        // aktif pencere açıksa okundu tut
        if (open && activeId) {
          await api.chatMarkRead(activeId).catch(() => {});
        }
      } catch {}
    };
    // poll every 10s
    timer = setInterval(tick, 10000);
    // run once immediately when closed as well
    tick();
    return () => clearInterval(timer);
  }, [role, open, activeId, isAuthenticated]);

  // load messages when activeId changes
  useEffect(() => {
    if (!open || !activeId || !isAuthenticated) return;
    (async () => {
      const res = await api.chatGetMessages(activeId, { limit: 50 });
      const list = res.data?.results ?? [];
      setMessages(list.reverse());
      // unread temizle
      try {
        await api.chatMarkRead(activeId);
        setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, client_unread_count: 0, vendor_unread_count: 0 } : c)));
      } catch {}
    })();
  }, [open, activeId, isAuthenticated]);

  // connect WS for active conversation
  useEffect(() => {
    if (!open || !activeId || !isAuthenticated) return;
    const authToken = getAuthToken(role === 'vendor' ? 'vendor' : 'customer');
    const ws = new ChatWSClient({
      conversationId: activeId,
      authToken,
      onMessage: (evt) => {
        if (evt.event === 'message.new') {
          setMessages((prev) => [...prev, evt.data]);
          // aktif değilse ve karşı taraftan geldiyse unread ++
          const isFromVendor = !!evt.data?.sender_is_vendor;
          const fromOther = role === 'vendor' ? !isFromVendor : isFromVendor;
          const cid = evt.data?.conversation;
          if (!open || cid !== activeId) {
            if (fromOther && cid) {
              setConversations((prev) => prev.map((c) => (
                c.id === cid
                  ? (role === 'vendor'
                      ? { ...c, vendor_unread_count: (c.vendor_unread_count || 0) + 1, last_message_text: evt.data.content }
                      : { ...c, client_unread_count: (c.client_unread_count || 0) + 1, last_message_text: evt.data.content })
                  : c
              )));
            }
          } else {
            // aktif pencere ise okundu bildir
            api.chatMarkRead(activeId).catch(() => {});
            setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, client_unread_count: 0, vendor_unread_count: 0, last_message_text: evt.data.content } : c)));
          }
        } else if (evt.event === 'typing') {
          const fromVendor = !!evt.data?.sender_is_vendor;
          const show = role === 'customer' ? fromVendor : !fromVendor;
          if (evt.data?.conversation === activeId) setTyping(show && !!evt.data?.is_typing);
        }
      },
    });
    ws.connect();
    wsRef.current = ws;
    return () => ws.close();
  }, [open, activeId, role, isAuthenticated]);

  const send = async () => {
    const text = msg.trim();
    if (!text || !activeId || !isAuthenticated) return;
    const optimistic: any = { id: `tmp-${Date.now()}`, content: text, sender_is_vendor: role === 'vendor', created_at: new Date().toISOString() };
    setMessages((p) => [...p, optimistic]);
    setMsg('');
    wsRef.current?.typing(false);
    if (wsRef.current?.isOpen()) {
      wsRef.current.sendMessage(text);
    } else {
      try {
        const res = await api.chatSendMessageREST(activeId, text);
        const saved = res.data ?? res;
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
      } catch (e) {
        // keep optimistic; optionally show error
      }
    }
  };

  // Eğer authenticated değilse ChatWidget'ı gösterme
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      {/* Floating button */}
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
        {totalUnread > 0 && (
          <span style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: '#ef4444',
            color: '#fff',
            borderRadius: 999,
            padding: '2px 6px',
            fontSize: 12,
            fontWeight: 800,
            minWidth: 22,
            textAlign: 'center',
            boxShadow: '0 0 0 2px rgba(0,0,0,0.1)'
          }}>
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 76,
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
            <div style={{ padding: 12, fontWeight: 700 }}>{role === 'vendor' ? 'Gelen Kutusu' : 'Mesajlarım'}</div>
            <div style={{ overflowY: 'auto' }}>
              {loadingList ? (
                <div style={{ padding: 12, color: '#666' }}>Yükleniyor...</div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: 12, color: '#666' }}>Konuşma yok</div>
              ) : (
                conversations.map((c) => {
                  const unread = role === 'vendor' ? (c.vendor_unread_count || 0) : (c.client_unread_count || 0);
                  return (
                  <div
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      background: activeId === c.id ? palette.highlight : 'transparent',
                      borderLeft: activeId === c.id ? `3px solid ${palette.primary}` : '3px solid transparent',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {role === 'vendor' 
                        ? (c.client_user?.email || c.client_user?.username || 'Bilinmeyen Kullanıcı') 
                        : (c.vendor_display_name || c.vendor?.display_name || 'Esnaf')}
                      {unread > 0 && (
                        <span style={{ marginLeft: 8, background: '#ef4444', color: '#fff', borderRadius: 999, padding: '0 6px', fontSize: 11, fontWeight: 800 }}>
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>{c.last_message_text}</div>
                  </div>
                )})
              )}
            </div>
          </div>

          {/* Chat window */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, borderBottom: `2px solid ${palette.primary}`, fontWeight: 700 }}>
              {role === 'vendor'
                ? (conversations.find((c) => c.id === activeId)?.client_user?.email || 
                   conversations.find((c) => c.id === activeId)?.client_user?.username || 'Sohbet')
                : (conversations.find((c) => c.id === activeId)?.vendor_display_name || 'Sohbet')}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#fafafa' }}>
              {messages.map((m) => {
                const isOwn = role === 'vendor' ? m.sender_is_vendor : !m.sender_is_vendor;
                const justify = m.sender_is_vendor ? (role === 'vendor' ? 'flex-end' : 'flex-start') : (role === 'vendor' ? 'flex-start' : 'flex-end');
                const bubbleStyle: React.CSSProperties = isOwn
                  ? (role === 'vendor'
                      ? { background: '#ffd600', color: '#111', border: '1px solid transparent' }
                      : { background: '#2d3748', color: '#fff', border: '1px solid transparent' })
                  : { background: '#fff', color: '#111', border: '1px solid #e9ecef' };
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: justify, marginBottom: 8 }}>
                    <div style={{ ...bubbleStyle, borderRadius: 8, padding: '8px 12px', maxWidth: '75%' }}>{m.id === 'tmp-${Date.now()}' ? 'Gönderiliyor...' : m.content}</div>
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
                  wsRef.current?.typing(true);
                }}
                onBlur={() => wsRef.current?.typing(false)}
                placeholder="Mesaj yaz..."
                style={{ flex: 1, border: `1px solid ${palette.primary}`, borderRadius: 8, padding: '10px 12px' }}
              />
              <button onClick={send} style={{ background: palette.primary, color: palette.primaryText, border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 700 }}>Gönder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


