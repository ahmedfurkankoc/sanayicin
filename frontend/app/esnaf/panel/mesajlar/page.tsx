'use client';

import React from 'react';
import EsnafPanelLayout from '@/app/esnaf/components/EsnafPanelLayout';
import ConversationList from '@/app/components/ConversationList';

export default function EsnafMessagesListPage() {
  return (
    <EsnafPanelLayout activePage="mesajlar">
      <div className="esnaf-panel-content">
        <h2>Tüm Mesajlarım</h2>
        <div className="esnaf-card">
          <ConversationList 
            userRole="vendor" 
            baseUrl="/esnaf/panel/mesajlar"
            className="esnaf-conversation-list"
          />
        </div>
      </div>
    </EsnafPanelLayout>
  );
}




