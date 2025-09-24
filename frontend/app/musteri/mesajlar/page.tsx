'use client';

import React, { useEffect, useState } from 'react';
import { getAuthToken } from '@/app/utils/api';
import ConversationList from '@/app/components/ConversationList';

export default function MessagesListPage() {
  const [userRole, setUserRole] = useState<'client' | 'vendor' | null>(null);

  useEffect(() => {
    const checkUserRole = () => {
          const clientToken = getAuthToken('client');
    const vendorToken = getAuthToken('vendor');
    
    if (vendorToken) {
      setUserRole('vendor');
    } else if (clientToken) {
      setUserRole('client');
    }
    };

    checkUserRole();
  }, []);

  if (!userRole) return <div>Yükleniyor...</div>;

  return (
    <div className="container">
      <h1>Tüm Mesajlarım</h1>
      <ConversationList 
        userRole={userRole} 
        baseUrl="/musteri/mesajlar"
        className="musteri-conversation-list"
      />
    </div>
  );
}




