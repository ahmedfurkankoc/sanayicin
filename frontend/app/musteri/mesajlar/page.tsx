'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/app/utils/api';

export default function MessagesListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await api.chatEnsureGuest();
        const res = await api.chatListConversations();
        setItems(res.data ?? res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="musteri-container">Yükleniyor...</div>;

  return (
    <main className="musteri-container">
      <h1>Mesajlarım</h1>
      <div className="musteri-card">
        {items.length === 0 ? (
          <div>Henüz bir konuşma yok.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((c) => (
              <li key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-strong)' }}>
                <Link href={`/musteri/mesajlar/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.vendor_display_name ?? c.vendor?.display_name ?? 'Esnaf'}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{c.last_message_text}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.vendor_unread_count ? `${c.vendor_unread_count}` : ''}</div>
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




