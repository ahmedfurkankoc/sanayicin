'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import EsnafPanelLayout from '@/app/esnaf/components/EsnafPanelLayout';
import ChatInterface from '@/app/components/ui/ChatInterface';

export default function ChatPage() {
  const params = useParams();
  const conversationId = Number(params.conversationId);

  return (
    <EsnafPanelLayout activePage="mesajlar">
      <div className="esnaf-panel-content">
        <h2>Sohbet</h2>
        
        {/* Chat Interface */}
        <ChatInterface 
          conversationId={conversationId}
          variant="esnaf"
        />
      </div>
    </EsnafPanelLayout>
  );
}


