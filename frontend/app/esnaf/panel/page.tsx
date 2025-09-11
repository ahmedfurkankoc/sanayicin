'use client';

import React, { useState, useEffect } from "react";
import "../../styles/esnaf.css";
import EsnafPanelLayout from "../components/EsnafPanelLayout";
import { useEsnaf } from "../context/EsnafContext";

export default function EsnafPanelPage() {
  const { isAdmin } = useEsnaf();
  const [dashboardStats, setDashboardStats] = useState({
    profileViews: 0,
    messages: 0,
    appointments: 0,
    favorites: 0,
    reviews: 0,
    totalEarnings: 0
  });

  // Mock dashboard data - gerçek API'den gelecek
  useEffect(() => {
    setDashboardStats({
      profileViews: 1247,
      messages: 23,
      appointments: 8,
      favorites: 156,
      reviews: 42,
      totalEarnings: 15420
    });
  }, []);

  return (
    <EsnafPanelLayout activePage="panel">
      {/* Dashboard Stats */}
      <div className="esnaf-dashboard-list">
        <div className="esnaf-dashboard-card esnaf-yellow-card">
          <div className="esnaf-dashboard-header">
            <div className="esnaf-stat-info">
              <span className="esnaf-stat-dot esnaf-yellow-dot"></span>
              <span className="esnaf-stat-name">Mağaza Ziyaretleri</span>
            </div>
            <span className="esnaf-stat-period esnaf-yellow-period">Bu ay</span>
          </div>
          
          <h3 className="esnaf-dashboard-title">{dashboardStats.profileViews.toLocaleString()} görüntüleme</h3>
          <p className="esnaf-dashboard-description">
            Profilinizi görüntüleyen kullanıcı sayısı. Bu ay %12 artış gösterdi.
          </p>
          
          <div className="esnaf-dashboard-tags">
            <span className="esnaf-stat-tag esnaf-yellow-tag">📈 +12%</span>
            <span className="esnaf-stat-tag esnaf-yellow-tag">👥 Yeni ziyaretçiler</span>
          </div>
        </div>

        <div className="esnaf-dashboard-card">
          <div className="esnaf-dashboard-header">
            <div className="esnaf-stat-info">
              <span className="esnaf-stat-dot"></span>
              <span className="esnaf-stat-name">Gelen Mesajlar</span>
            </div>
            <span className="esnaf-stat-period">Bu hafta</span>
          </div>
          
          <h3 className="esnaf-dashboard-title">{dashboardStats.messages} yeni mesaj</h3>
          <p className="esnaf-dashboard-description">
            Müşterilerden gelen yeni mesaj sayısı. 5 tanesi henüz okunmamış.
          </p>
          
          <div className="esnaf-dashboard-tags">
            <span className="esnaf-stat-tag">💬 5 okunmamış</span>
            <span className="esnaf-stat-tag">⚡ Hızlı yanıt</span>
          </div>
        </div>

        <div className="esnaf-dashboard-card">
          <div className="esnaf-dashboard-header">
            <div className="esnaf-stat-info">
              <span className="esnaf-stat-dot"></span>
              <span className="esnaf-stat-name">Randevular</span>
            </div>
            <span className="esnaf-stat-period">Bu ay</span>
          </div>
          
          <h3 className="esnaf-dashboard-title">{dashboardStats.appointments} randevu</h3>
          <p className="esnaf-dashboard-description">
            Bu ay için planlanan randevu sayısı. 3 tanesi bugün.
          </p>
          
          <div className="esnaf-dashboard-tags">
            <span className="esnaf-stat-tag">📅 3 bugün</span>
            <span className="esnaf-stat-tag">✅ Onaylanmış</span>
          </div>
        </div>

        <div className="esnaf-dashboard-card">
          <div className="esnaf-dashboard-header">
            <div className="esnaf-stat-info">
              <span className="esnaf-stat-dot"></span>
              <span className="esnaf-stat-name">Favoriler</span>
            </div>
            <span className="esnaf-stat-period">Toplam</span>
          </div>
          
          <h3 className="esnaf-dashboard-title">{dashboardStats.favorites} favori</h3>
          <p className="esnaf-dashboard-description">
            Profilinizi favorilere ekleyen müşteri sayısı. Bu hafta 12 yeni favori.
          </p>
          
          <div className="esnaf-dashboard-tags">
            <span className="esnaf-stat-tag">❤️ 12 yeni</span>
            <span className="esnaf-stat-tag">🔥 Popüler</span>
          </div>
        </div>

        <div className="esnaf-dashboard-card">
          <div className="esnaf-dashboard-header">
            <div className="esnaf-stat-info">
              <span className="esnaf-stat-dot"></span>
              <span className="esnaf-stat-name">Yorumlar</span>
            </div>
            <span className="esnaf-stat-period">Bu ay</span>
          </div>
          
          <h3 className="esnaf-dashboard-title">{dashboardStats.reviews} yorum</h3>
          <p className="esnaf-dashboard-description">
            Müşterilerden gelen yorum sayısı. Ortalama puanınız 4.8/5.
          </p>
          
          <div className="esnaf-dashboard-tags">
            <span className="esnaf-stat-tag">⭐ 4.8/5</span>
            <span className="esnaf-stat-tag">👍 Pozitif</span>
          </div>
        </div>

        <div className="esnaf-dashboard-card">
          <div className="esnaf-dashboard-header">
            <div className="esnaf-stat-info">
              <span className="esnaf-stat-dot"></span>
              <span className="esnaf-stat-name">Gelen Arama Raporu</span>
            </div>
            <span className="esnaf-stat-period">Bu ay</span>
          </div>
          
          <h3 className="esnaf-dashboard-title">342 arama</h3>
          <p className="esnaf-dashboard-description">
            Müşterilerin sizi aradığı toplam arama sayısı. Bu ay %15 artış gösterdi.
          </p>
          
          <div className="esnaf-dashboard-tags">
            <span className="esnaf-stat-tag">📞 +15%</span>
            <span className="esnaf-stat-tag">🎯 Yüksek ilgi</span>
          </div>
        </div>
      </div>
    </EsnafPanelLayout>
  );
} 