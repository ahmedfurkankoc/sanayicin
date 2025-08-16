'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ChatInterface from '@/app/components/ChatInterface';

export default function ChatPage() {
  const params = useParams();
  const conversationId = Number(params.conversationId);

  return (
    <main className="musteri-container">
      {/* Header - Geri dön butonu */}
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '16px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Mesaj Detayı
            </h2>
          </div>
          <Link 
            href="/musteri/mesajlar" 
            style={{ 
              color: '#0066cc', 
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ← Geri Dön
          </Link>
        </div>
      </div>

      {/* Chat Interface */}
      <ChatInterface 
        conversationId={conversationId}
        variant="musteri"
      />
    </main>
  );
}


