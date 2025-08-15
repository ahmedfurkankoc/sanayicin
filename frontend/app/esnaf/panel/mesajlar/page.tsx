'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/app/utils/api';
import EsnafPanelLayout from '@/app/esnaf/components/EsnafPanelLayout';

export default function EsnafMessagesListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        console.log('DEBUG ESNAF: Conversation list yükleniyor...');
        
        const res = await api.chatListConversations();
        console.log('DEBUG ESNAF: API response:', res);
        
        const items = res.data ?? res;
        console.log('DEBUG ESNAF: Conversation items:', items);
        
        // Artık tüm konuşmaları göster - hem esnaf olarak hem müşteri olarak
        setItems(items);
      } catch (error) {
        console.error('DEBUG ESNAF: Conversation loading error:', error);
        console.error('Konuşmalar yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Mevcut kullanıcının ID'sini al
  const getCurrentUserId = () => {
    try {
      const vendorToken = localStorage.getItem('esnaf_access_token');
      
      if (vendorToken) {
        const tokenParts = vendorToken.split('.');
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

  if (loading) return (
    <EsnafPanelLayout activePage="mesajlar" title="Mesajlar">
      <div className="esnaf-panel-content">Yükleniyor...</div>
    </EsnafPanelLayout>
  );

  return (
    <EsnafPanelLayout activePage="mesajlar" title="Mesajlar">
      <div className="esnaf-panel-content">
        <h2>Tüm Mesajlarım</h2>
        <div className="esnaf-card">
          {items.length === 0 ? (
            <div>Henüz mesaj yok.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map((c) => (
                <li key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                  <Link href={`/esnaf/panel/mesajlar/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {c.client_user?.email || c.client_user?.username || 'Müşteri'}
                        </div>
                        <div style={{ color: '#666' }}>{c.last_message_text}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {c.vendor_unread_count ? `${c.vendor_unread_count}` : ''}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </EsnafPanelLayout>
  );
}




