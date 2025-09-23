'use client';

import React, { useState, useEffect } from "react";
import "../../styles/esnaf.css";
import EsnafPanelLayout from "../components/EsnafPanelLayout";
import { useEsnaf } from "../context/EsnafContext";
import { api } from "@/app/utils/api";

export default function EsnafPanelPage() {
  const { isAdmin, user } = useEsnaf();
  const [dashboardStats, setDashboardStats] = useState({
    profileViews: 0,
    messages: 0,
    appointments: 0,
    appointmentsToday: 0,
    favorites: 0,
    favoritesNew: 0,
    reviews: 0,
    averageRating: 0,
    calls: 0,
    callsChangePercent: 0,
    totalEarnings: 0
  });

  // Canlı veriler: paralel çağrılar
  useEffect(() => {
    const load = async () => {
      try {
        // Tek çağrı: summary
        const res = await api.getVendorDashboardSummary();
        const s = res.data ?? res;
        setDashboardStats((prev) => ({
          ...prev,
          profileViews: s.profile_views_month ?? prev.profileViews,
          messages: s.messages_total ?? prev.messages,
          appointments: s.appointments_total ?? prev.appointments,
          appointmentsToday: s.appointments_today ?? prev.appointmentsToday,
          favorites: s.favorites_total ?? prev.favorites,
          reviews: s.reviews_total ?? prev.reviews,
          averageRating: s.average_rating ?? prev.averageRating,
          calls: s.calls_month ?? prev.calls,
        }));
      } catch (e) {
        // ignore
      }
    };

    load();
  }, [user]);

  return (
    <EsnafPanelLayout activePage="panel">
      {/* Dashboard Stats */}
      <div style={{ padding: '24px 0px 0px 0px', marginBottom: 8, color: '#666', fontSize: 13 }}>
        Bu ayın özeti – {new Date().toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
      </div>
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
            Profilinizi görüntüleyen kullanıcı sayısı (bu ay).
          </p>
          
          <div className="esnaf-dashboard-tags">
            <span className="esnaf-stat-tag esnaf-yellow-tag">📆 Aylık</span>
          </div>
        </div>

        <div className="esnaf-dashboard-card">
          <div className="esnaf-dashboard-header">
            <div className="esnaf-stat-info">
              <span className="esnaf-stat-dot"></span>
              <span className="esnaf-stat-name">Gelen Mesajlar</span>
            </div>
            <span className="esnaf-stat-period">Bu ay</span>
          </div>
          
          <h3 className="esnaf-dashboard-title">{dashboardStats.messages.toLocaleString()} gelen mesaj</h3>
          <p className="esnaf-dashboard-description">Bu ay alınan toplam mesaj sayısı.</p>
          
          <div className="esnaf-dashboard-tags">
            <span className="esnaf-stat-tag">💬 Toplam {dashboardStats.messages.toLocaleString()}</span>
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
          
          <h3 className="esnaf-dashboard-title">{dashboardStats.appointments.toLocaleString()} randevu</h3>
          <p className="esnaf-dashboard-description">Bu ay için planlanan randevu sayısı. {dashboardStats.appointmentsToday} tanesi bugün.</p>
          
          <div className="esnaf-dashboard-tags">
            {dashboardStats.appointmentsToday > 0 && (
              <span className="esnaf-stat-tag">📅 {dashboardStats.appointmentsToday} bugün</span>
            )}
          </div>
        </div>

        <div className="esnaf-dashboard-card">
          <div className="esnaf-dashboard-header">
            <div className="esnaf-stat-info">
              <span className="esnaf-stat-dot"></span>
              <span className="esnaf-stat-name">Favoriler</span>
            </div>
            <span className="esnaf-stat-period">Bu ay</span>
          </div>
          
          <h3 className="esnaf-dashboard-title">{dashboardStats.favorites.toLocaleString()} favori</h3>
          <p className="esnaf-dashboard-description">Profilinizi favorilere ekleyen müşteri sayısı (bu ay).</p>
          
          <div className="esnaf-dashboard-tags">
            <span className="esnaf-stat-tag">❤️ Toplam {dashboardStats.favorites.toLocaleString()}</span>
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
          
          <h3 className="esnaf-dashboard-title">{dashboardStats.reviews.toLocaleString()} yorum</h3>
          <p className="esnaf-dashboard-description">Müşterilerden gelen yorum sayısı. Ortalama puanınız {dashboardStats.averageRating}/5.</p>
          
          <div className="esnaf-dashboard-tags">
            <span className="esnaf-stat-tag">⭐ {dashboardStats.averageRating}/5</span>
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
          
          <h3 className="esnaf-dashboard-title">{dashboardStats.calls.toLocaleString()} arama</h3>
          <p className="esnaf-dashboard-description">Bu ay müşterilerin sizi aradığı toplam arama sayısı.</p>
          
          <div className="esnaf-dashboard-tags">
            <span className="esnaf-stat-tag">📞 Aylık</span>
            </div>
          </div>
        </div>
    </EsnafPanelLayout>
  );
} 