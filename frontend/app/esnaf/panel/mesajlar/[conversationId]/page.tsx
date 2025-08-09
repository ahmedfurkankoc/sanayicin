'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import EsnafPanelLayout from '@/app/esnaf/components/EsnafPanelLayout';
import { api, getAuthToken } from '@/app/utils/api';
import { ChatWSClient } from '@/app/musteri/components/ChatWSClient';

export default function EsnafChatPage() {
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
    const authToken = getAuthToken('vendor');
    const ws = new ChatWSClient({ conversationId, authToken, onMessage: (evt) => {
      if (evt.event === 'message.new') {
        setMessages((prev) => [...prev, evt.data]);
      } else if (evt.event === 'typing') {
        // Esnaf tarafında, karşı taraf müşteri olmalı (sender_is_vendor false)
        if (evt.data?.conversation === conversationId && !evt.data?.sender_is_vendor) {
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
    const optimistic = { id: `temp-${Date.now()}`, content: text, sender_is_vendor: true, created_at: new Date().toISOString() } as any;
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

  return (
    <EsnafPanelLayout activePage="mesajlar">
      <div className="esnaf-panel-content">
        <h2>Sohbet</h2>
        {loading ? (
          <div>Yükleniyor...</div>
        ) : (
          <div className="esnaf-card" style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 8, border: '1px solid #eee', borderRadius: 8 }}>
              {messages.map((m) => {
                const isOwn = m.sender_is_vendor; // esnaf kendi mesajı
                const bubbleStyle: React.CSSProperties = isOwn
                  ? { background: '#ffd600', color: '#111', border: '1px solid transparent' }
                  : { background: '#f8f9fa', color: '#111', border: '1px solid #e9ecef' };
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.sender_is_vendor ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                    <div style={{ ...bubbleStyle, borderRadius: 8, padding: '8px 12px', maxWidth: '75%' }}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>Yazıyor...</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                value={input}
                onChange={(e) => { setInput(e.target.value); wsRef.current?.typing(true); }}
                onFocus={(e) => { (e.currentTarget.style.borderColor = '#ffd600'); (e.currentTarget.style.outline = 'none'); }}
                onBlur={(e) => { wsRef.current?.typing(false); (e.currentTarget.style.borderColor = '#e9ecef'); }}
                placeholder="Mesaj yaz..."
                style={{ flex: 1, border: '1px solid #e9ecef', borderRadius: 8, padding: '10px 12px' }}
              />
              <button onClick={send} style={{ background: '#ffd600', color: '#111', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 700 }}>Gönder</button>
            </div>
          </div>
        )}
      </div>
    </EsnafPanelLayout>
  );
}


