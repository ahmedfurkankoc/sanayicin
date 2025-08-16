'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/app/utils/api';

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
  userRole: 'customer' | 'vendor';
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
            <li key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-strong, #eee)' }}>
              <Link href={`${baseUrl}/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {c.other_user?.first_name || 
                       c.other_user?.display_name || 
                       c.other_user?.username || 
                       c.other_user?.email || 
                       (userRole === 'vendor' ? 'Müşteri' : 'Esnaf')}
                    </div>
                    <div style={{ color: 'var(--text-muted, #666)' }}>{c.last_message_text}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted, #666)' }}>
                    {userRole === 'vendor' 
                      ? (c.vendor_unread_count ? `${c.vendor_unread_count}` : '') 
                      : (c.client_unread_count ? `${c.client_unread_count}` : '')}
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
