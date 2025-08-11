'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/app/utils/api';
import EsnafPanelLayout from '@/app/esnaf/components/EsnafPanelLayout';

export default function EsnafMessagesListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Esnaf tarafında auth token zaten var varsayımıyla hareket ediyoruz
        const res = await api.chatListConversations();
        setItems(res.data ?? res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <EsnafPanelLayout activePage="mesajlar">
      <div className="esnaf-panel-content">
        <h2>Mesajlar</h2>
        <div className="esnaf-card">
          {loading ? (
            <div>Yükleniyor...</div>
          ) : items.length === 0 ? (
            <div>Henüz konuşma yok.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map((c) => (
                <li key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                  <Link href={`/esnaf/panel/mesajlar/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.client_user?.email || c.client_user?.username || 'Bilinmeyen Kullanıcı'}</div>
                        <div style={{ color: '#666' }}>{c.last_message_text}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>{c.vendor_unread_count}</div>
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




