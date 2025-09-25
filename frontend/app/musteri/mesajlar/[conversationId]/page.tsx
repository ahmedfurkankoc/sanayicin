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
      
    <ChatInterface 
        conversationId={conversationId}
        variant="musteri"
      />
    </main>
  );
}



