'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/app/utils/api';

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
  vendor_unread_count?: number;
  client_unread_count?: number;
}

interface ConversationListProps {
  userRole: 'client' | 'vendor';
  baseUrl: string;
  className?: string;
}

export default function ConversationList({ userRole, baseUrl, className = '' }: ConversationListProps) {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className={className}>Yükleniyor...</div>;

  return (
    <div className={className}>
      {items.length === 0 ? (
        <div>Henüz mesaj yok.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((c) => (
            <li key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <Link href={`${baseUrl}/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
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
                    <div style={{ color: '#64748b', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getLastMessagePreview(c.last_message_text)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(userRole === 'vendor' ? c.vendor_unread_count : c.client_unread_count) ? (
                      <span style={{ background: '#ef4444', color: 'white', borderRadius: 999, padding: '2px 6px', fontSize: 11, fontWeight: 700 }}>
                        {(userRole === 'vendor' ? c.vendor_unread_count : c.client_unread_count)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
