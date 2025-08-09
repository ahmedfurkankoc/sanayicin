'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, getAuthToken, getGuestToken } from '@/app/utils/api';
import { ChatWSClient } from '@/app/musteri/components/ChatWSClient';

type Role = 'customer' | 'vendor';

type Conversation = {
  id: number;
  vendor?: any;
  vendor_display_name?: string;
  client_user?: any;
  last_message_text?: string;
  last_message_at?: string;
};

export default function ChatWidget({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [typing, setTyping] = useState(false);
  const [msg, setMsg] = useState('');
  const wsRef = useRef<ChatWSClient | null>(null);

  // load conversation list on open
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoadingList(true);
        if (role === 'customer') await api.chatEnsureGuest();
        const res = await api.chatListConversations();
        const items = res.data ?? res;
        setConversations(items);
        if (items?.length && !activeId) setActiveId(items[0].id);
      } finally {
        setLoadingList(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // load messages when activeId changes
  useEffect(() => {
    if (!open || !activeId) return;
    (async () => {
      const res = await api.chatGetMessages(activeId, { limit: 50 });
      const list = res.data?.results ?? [];
      setMessages(list.reverse());
    })();
  }, [open, activeId]);

  // connect WS for active conversation
  useEffect(() => {
    if (!open || !activeId) return;
    const authToken = getAuthToken(role === 'vendor' ? 'vendor' : 'customer');
    const guestToken = role === 'customer' ? getGuestToken() : null;
    const ws = new ChatWSClient({
      conversationId: activeId,
      authToken,
      guestToken,
      onMessage: (evt) => {
        if (evt.event === 'message.new') {
          setMessages((prev) => [...prev, evt.data]);
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
  }, [open, activeId, role]);

  const send = async () => {
    const text = msg.trim();
    if (!text || !activeId) return;
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

  const buttonLabel = open ? 'Kapat' : 'Mesajlar';

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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 28,
          padding: '10px 16px',
          boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          fontWeight: 700,
        }}
      >
        {buttonLabel}
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
                conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      background: activeId === c.id ? 'rgba(102,126,234,0.08)' : 'transparent',
                      borderLeft: activeId === c.id ? '3px solid #667eea' : '3px solid transparent',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {role === 'vendor' ? (c.client_user?.email ?? `Misafir`) : (c.vendor_display_name ?? c.vendor?.display_name ?? 'Esnaf')}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>{c.last_message_text}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat window */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, borderBottom: '1px solid #e9ecef', fontWeight: 700 }}>
              {role === 'vendor'
                ? conversations.find((c) => c.id === activeId)?.client_user?.email ?? 'Sohbet'
                : conversations.find((c) => c.id === activeId)?.vendor_display_name ?? 'Sohbet'}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#fafafa' }}>
              {messages.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.sender_is_vendor ? (role === 'vendor' ? 'flex-end' : 'flex-start') : (role === 'vendor' ? 'flex-start' : 'flex-end'), marginBottom: 8 }}>
                  <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 8, padding: '8px 12px', maxWidth: '75%' }}>{m.content}</div>
                </div>
              ))}
              {typing && <div style={{ fontSize: 12, color: '#666' }}>Yazıyor...</div>}
            </div>
            <div style={{ padding: 10, display: 'flex', gap: 8, borderTop: '1px solid #e9ecef' }}>
              <input
                value={msg}
                onChange={(e) => {
                  setMsg(e.target.value);
                  wsRef.current?.typing(true);
                }}
                onBlur={() => wsRef.current?.typing(false)}
                placeholder="Mesaj yaz..."
                style={{ flex: 1, border: '1px solid #e9ecef', borderRadius: 8, padding: '10px 12px' }}
              />
              <button onClick={send} style={{ background: '#667eea', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 700 }}>Gönder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


