'use client';

import React, { useEffect, useState } from 'react';
import { getAuthToken } from '@/app/utils/api';
import ConversationList from '@/app/components/ConversationList';

export default function MessagesListPage() {
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

  if (!userRole) return <div>Yükleniyor...</div>;

  return (
    <div className="musteri-page-container">
      <h1>Tüm Mesajlarım</h1>
      
      <div className="musteri-card">
        <ConversationList 
          userRole={userRole} 
          baseUrl="/musteri/mesajlar"
          className="musteri-conversation-list"
        />
      </div>
    </div>
  );
}




