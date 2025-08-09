'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EsnafSidebar from "./EsnafSidebar";
import { useEsnaf } from "../context/EsnafContext";
import { LoadingSpinner } from "./LoadingSpinner";

interface EsnafPanelLayoutProps {
  children: React.ReactNode;
  activePage: string;
  title?: string;
}

export default function EsnafPanelLayout({ 
  children, 
  activePage, 
  title 
}: EsnafPanelLayoutProps) {
  const router = useRouter();
  const { user, email, loading, isAdmin, emailVerified: contextEmailVerified, handleLogout } = useEsnaf();
  const isVerified = user?.is_verified === true || contextEmailVerified === true;

  // Email doğrulama kontrolü
  useEffect(() => {
    // Loading bittikten ve user varsa kontrol et
    if (!loading && user) {
      // Email doğrulanmamışsa yönlendir (yeni alan is_verified öncelikli)
      if (!isVerified) {
        router.replace(`/esnaf/email-dogrula?email=${user.email || ''}`);
        return;
      }
    }
  }, [loading, isVerified, user, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Email doğrulanmamışsa loading göster (yönlendirme sırasında)
  if (!isVerified && user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="esnaf-dashboard">
      {/* Sol Sidebar */}
      <EsnafSidebar 
        user={user} 
        email={email} 
        onLogout={handleLogout}
        activePage={activePage}
      />

      {/* Ana İçerik */}
      <div className="esnaf-main-content">
        {/* Header */}
        <div className="esnaf-content-header">
          <h1 className="esnaf-page-title">
            {title}
            {isAdmin && <span style={{ fontSize: '14px', color: '#666', marginLeft: '10px' }}>
              (Admin Test Modu)
            </span>}
          </h1>
        </div>

        {/* Sayfa İçeriği */}
        {children}
      </div>
    </div>
  );
} 