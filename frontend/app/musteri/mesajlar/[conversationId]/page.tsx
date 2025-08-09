'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, getAuthToken, getGuestToken } from '@/app/utils/api';
import { ChatWSClient } from '@/app/musteri/components/ChatWSClient';

export default function ChatPage() {
  const params = useParams();
  const conversationId = Number(params.conversationId);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const wsRef = useRef<ChatWSClient | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await api.chatEnsureGuest();
        const res = await api.chatGetMessages(conversationId, { limit: 50 });
        const list = res.data?.results ?? [];
        setMessages(list.reverse());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId]);

  useEffect(() => {
    const authToken = getAuthToken('customer');
    const guestToken = getGuestToken();
    const ws = new ChatWSClient({ conversationId, authToken, guestToken, onMessage: (evt) => {
      if (evt.event === 'message.new') {
        setMessages((prev) => [...prev, evt.data]);
      } else if (evt.event === 'typing') {
        // Müşteri tarafında, karşı taraf esnaf olmalı (sender_is_vendor true)
        if (evt.data?.conversation === conversationId && evt.data?.sender_is_vendor) {
          setTyping(!!evt.data?.is_typing);
        }
      }
    }});
    ws.connect();
    wsRef.current = ws;
    return () => ws.close();
  }, [conversationId]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    // Optimistic append
    const optimistic = {
      id: `temp-${Date.now()}`,
      content: text,
      sender_is_vendor: false,
      created_at: new Date().toISOString(),
    } as any;
    setMessages((prev) => [...prev, optimistic]);
    if (wsRef.current?.isOpen()) {
      wsRef.current.sendMessage(text);
    } else {
      try {
        const res = await api.chatSendMessageREST(conversationId, text);
        const saved = res.data ?? res;
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
      } catch (e) {
        console.error('REST send fail', e);
      }
    }
    setInput('');
    wsRef.current?.typing(false);
  };

  if (loading) return <div className="musteri-container">Yükleniyor...</div>;

  return (
    <main className="musteri-container">
      <div className="musteri-card" style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8, border: '1px solid var(--border-strong)', borderRadius: 8 }}>
          {messages.map((m) => (
            <div key={m.id} style={{ display: 'flex', justifyContent: m.sender_is_vendor ? 'flex-start' : 'flex-end', marginBottom: 8 }}>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', maxWidth: '75%' }}>
                {m.content}
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Yazıyor...</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input value={input} onChange={(e) => { setInput(e.target.value); wsRef.current?.typing(true); }} onBlur={() => wsRef.current?.typing(false)} className="musteri-input" placeholder="Mesaj yaz..." />
          <button onClick={send} className="musteri-btn">Gönder</button>
        </div>
      </div>
    </main>
  );
}


