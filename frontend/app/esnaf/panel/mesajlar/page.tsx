'use client';

import React from 'react';
import EsnafPanelLayout from '@/app/esnaf/components/EsnafPanelLayout';
import ConversationList from '@/app/components/ConversationList';

export default function EsnafMessagesListPage() {
  return (
    <EsnafPanelLayout activePage="mesajlar">
      <div className="esnaf-panel-content">
        <div className="esnaf-page-header">
          <h1 className="esnaf-page-title">Tüm Mesajlarım</h1>
        </div>
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




