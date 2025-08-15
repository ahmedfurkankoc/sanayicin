'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getAuthToken } from '@/app/utils/api';

export default function MessagesListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'customer' | 'vendor' | null>(null);

  useEffect(() => {
    const checkUserRole = () => {
      const customerToken = getAuthToken('customer');
      const vendorToken = getAuthToken('vendor');
      
      if (vendorToken) {
        setUserRole('vendor');
      } else if (customerToken) {
        setUserRole('customer');
      }
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        console.log('DEBUG: Conversation list yükleniyor...');
        
        const res = await api.chatListConversations();
        console.log('DEBUG: API response:', res);
        
        const items = res.data ?? res;
        console.log('DEBUG: Conversation items:', items);

        // Artık tüm konuşmaları göster - hem gönderilen hem alınan
        setItems(items);
      } catch (error) {
        console.error('DEBUG: Conversation loading error:', error);
        console.error('Konuşmalar yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };
    if (userRole) {
      loadConversations();
    }
  }, [userRole]);

  // Mevcut kullanıcının ID'sini al
  const getCurrentUserId = () => {
    try {
      const customerToken = getAuthToken('customer');
      const vendorToken = getAuthToken('vendor');
      const token = customerToken || vendorToken;
      
      if (token) {
        const tokenParts = token.split('.');
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

  if (loading) return <div className="musteri-container">Yükleniyor...</div>;

  return (
    <main className="musteri-container">
      <h1>Tüm Mesajlarım</h1>
      
      <div className="musteri-card">
        {items.length === 0 ? (
          <div>Henüz mesaj yok.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((c) => (
              <li key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-strong)' }}>
                <Link href={`/musteri/mesajlar/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {c.vendor_display_name ?? c.vendor?.display_name ?? 'Esnaf'}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>{c.last_message_text}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {userRole === 'vendor' 
                        ? (c.client_unread_count ? `${c.client_unread_count}` : '') 
                        : (c.vendor_unread_count ? `${c.vendor_unread_count}` : '')}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}




