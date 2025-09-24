'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, getAuthToken } from '@/app/utils/api';
import { useGlobalWS } from '@/app/hooks/useGlobalWS';

const getLastMessagePreview = (text?: string) => {
  if (!text) return '';
  try {
    if (text.startsWith('OFFER_CARD::')) {
      const data = JSON.parse(text.replace('OFFER_CARD::', ''));
      const title = data?.title || 'Teklif';
      const price = data?.price != null ? `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(data.price))} ₺` : null;
      const days = data?.days != null ? `${data.days} gün` : null;
      const parts = [price, days].filter(Boolean).join(' • ');
      return parts ? `Teklif: ${title} (${parts})` : `Teklif: ${title}`;
    }
  } catch (_) {}
  return text;
};

interface ConversationItem {
  id: number;
  other_user?: {
    first_name?: string;
    display_name?: string;
    username?: string;
    email?: string;
  };
  last_message_text?: string;
  last_message_at?: string;
  vendor_unread_count?: number;
  client_unread_count?: number;
  unread_count_for_current_user?: number;
  // local-only
  read_at?: string;
}

interface ConversationListProps {
  userRole: 'client' | 'vendor';
  baseUrl: string;
  className?: string;
}

export default function ConversationList({ userRole, baseUrl, className = '' }: ConversationListProps) {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const globalWS = useGlobalWS();

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        console.log(`DEBUG ${userRole.toUpperCase()}: Conversation list yükleniyor...`);
        
        const res = await api.chatListConversations();
        console.log(`DEBUG ${userRole.toUpperCase()}: API response:`, res);
        
        const items = res.data ?? res;
        console.log(`DEBUG ${userRole.toUpperCase()}: Conversation items:`, items);
        
        // Her item'ın detayını logla
        items.forEach((item: ConversationItem, index: number) => {
          console.log(`DEBUG ${userRole.toUpperCase()}: Item ${index}:`, {
            id: item.id,
            other_user: item.other_user,
            last_message_text: item.last_message_text
          });
        });
        
        setItems(items);
      } catch (error) {
        console.error(`DEBUG ${userRole.toUpperCase()}: Conversation loading error:`, error);
        console.error('Konuşmalar yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [userRole]);

  // Simple time-ago formatter
  const timeAgo = (iso?: string) => {
    if (!iso) return '';
    const ts = new Date(iso).getTime();
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'az önce';
    if (m < 60) return `${m} dk`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} sa`;
    const d = Math.floor(h / 24);
    return `${d} g`;
  };

  // Global WS: realtime update unread and preview via shared connection
  useEffect(() => {
    const onMessage = (e: CustomEvent<any>) => {
      const data = e.detail;
      const p = data.data || {};
      const convId = p.conversation;
      const content = p.content || '';
      const createdAt = p.created_at;
      setItems(prev => prev.map(it => it.id === convId ? {
        ...it,
        last_message_text: content,
        last_message_at: createdAt || it.last_message_at,
        vendor_unread_count: userRole === 'vendor' ? ((it.vendor_unread_count || 0) + 1) : (it.vendor_unread_count || 0),
        client_unread_count: userRole === 'client' ? ((it.client_unread_count || 0) + 1) : (it.client_unread_count || 0),
        unread_count_for_current_user: (it.unread_count_for_current_user || 0) + 1,
      } : it));
    };
    const onConvUpdate = (e: CustomEvent<any>) => {
      const p = e.detail?.data || {};
      const convId = p.conversation_id;
      setItems(prev => prev.map(it => it.id === convId ? {
        ...it,
        last_message_text: p.last_message_text ?? it.last_message_text,
        unread_count_for_current_user: p.unread_count ?? it.unread_count_for_current_user,
        vendor_unread_count: userRole === 'vendor' ? (p.unread_count ?? it.vendor_unread_count) : it.vendor_unread_count,
        client_unread_count: userRole === 'client' ? (p.unread_count ?? it.client_unread_count) : it.client_unread_count,
      } : it));
    };
    globalWS.on('message.new', onMessage);
    globalWS.on('conversation.update', onConvUpdate);
    return () => {
      globalWS.off('message.new', onMessage);
      globalWS.off('conversation.update', onConvUpdate);
    };
  }, [globalWS, userRole]);

  if (loading) return <div className={className}>Yükleniyor...</div>;

  return (
    <div className={className}>
      {items.length === 0 ? (
        <div>Henüz mesaj yok.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((c) => {
            const unread = (userRole === 'vendor' ? c.vendor_unread_count : c.client_unread_count) || 0;
            const handleOpen = async () => {
              try {
                // Optimistik olarak listede okunmadı sayısını sıfırla
                setItems(prev => prev.map(it => it.id === c.id ? { ...it, vendor_unread_count: 0, client_unread_count: 0 } : it));
                // Backend'e bildir
                await api.chatMarkRead(c.id);
                // local read time
                setItems(prev => prev.map(it => it.id === c.id ? { ...it, read_at: new Date().toISOString(), unread_count_for_current_user: 0 } : it));
              } catch (_) {}
            };
            return (
            <li key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <Link href={`${baseUrl}/${c.id}`} onClick={handleOpen} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0f172a' }}>
                      {(c.other_user?.first_name || c.other_user?.display_name || c.other_user?.username || c.other_user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 2 }}>
                      {c.other_user?.first_name || 
                       c.other_user?.display_name || 
                       c.other_user?.username || 
                       c.other_user?.email || 
                       (userRole === 'vendor' ? 'Müşteri' : 'Esnaf')}
                    </div>
                    <div style={{ color: unread ? '#0f172a' : '#64748b', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unread ? 700 as any : 400 as any }}>{getLastMessagePreview(c.last_message_text)}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>
                      {c.last_message_at ? `son: ${timeAgo(c.last_message_at)}` : ''}
                      {c.read_at ? ` • okundu: ${timeAgo(c.read_at)}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {unread ? (
                      <span style={{ background: '#ef4444', color: 'white', borderRadius: 999, padding: '2px 6px', fontSize: 11, fontWeight: 700 }}>
                        {unread}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          )})}
        </ul>
      )}
    </div>
  );
}
