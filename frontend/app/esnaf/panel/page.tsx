'use client';

import React, { useState, useEffect, useMemo } from "react";
import "../../styles/esnaf.css";
import EsnafPanelLayout from "../components/EsnafPanelLayout";
import { useEsnaf } from "../context/EsnafContext";
import { api } from "@/app/utils/api";
import { BarChart } from "@mui/x-charts/BarChart";


export default function EsnafPanelPage() {
  const { isAdmin, user } = useEsnaf();
  const [dashboardStats, setDashboardStats] = useState({
    profileViews: 0,
    messages: 0,
    messagesTotal: 0,
    appointments: 0,
    appointmentsToday: 0,
    favorites: 0,
    favoritesTotal: 0,
    favoritesNew: 0,
    reviews: 0,
    averageRating: 0,
    calls: 0,
    callsChangePercent: 0,
    totalEarnings: 0
  });

  // Son 12 ay veri dizileri (opsiyonel: backend sağlıyorsa doldurulacak)
  const [monthlyStats, setMonthlyStats] = useState<{
    profileViews: number[];
    messages: number[];
    appointments: number[];
    favorites: number[];
    calls: number[];
  }>({ profileViews: [], messages: [], appointments: [], favorites: [], calls: [] });
  const [metric] = useState<'profileViews' | 'messages' | 'calls' | 'favorites' | 'appointments'>('profileViews');

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
          messages: (s.messages_month ?? s.messages_total) ?? prev.messages,
          messagesTotal: s.messages_total ?? prev.messagesTotal,
          appointments: s.appointments_total ?? prev.appointments,
          appointmentsToday: s.appointments_today ?? prev.appointmentsToday,
          favorites: (s.favorites_month ?? s.favorites_total) ?? prev.favorites,
          favoritesTotal: s.favorites_total ?? prev.favoritesTotal,
          reviews: s.reviews_total ?? prev.reviews,
          averageRating: s.average_rating ?? prev.averageRating,
          calls: s.calls_month ?? prev.calls,
        }));

        // Aylık veriler: backend döndürürse kullan, yoksa mevcut ayı sona koyup geri kalanı 0 ile doldur
        const ensure12 = (arr: any, fallbackLast: number): number[] => {
          const safe = Array.isArray(arr) ? arr.map((v) => (typeof v === 'number' ? v : 0)) : [];
          if (safe.length >= 12) return safe.slice(-12);
          const needed = 11 - safe.length; // son slotu current ile dolduracağız
          const zeros = Array(Math.max(0, needed)).fill(0);
          return [...zeros, ...safe, fallbackLast];
        };

        setMonthlyStats({
          profileViews: ensure12(s.monthly?.profile_views, s.profile_views_month ?? 0),
          messages: ensure12(s.monthly?.messages, (s.messages_month ?? s.messages_total ?? 0)),
          appointments: ensure12(s.monthly?.appointments, s.appointments_total ?? 0),
          favorites: ensure12(s.monthly?.favorites, (s.favorites_month ?? s.favorites_total ?? 0)),
          calls: ensure12(s.monthly?.calls, s.calls_month ?? 0),
        });
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
            <span className="esnaf-stat-tag">💬 Toplam {dashboardStats.messagesTotal > 99 ? '99+' : dashboardStats.messagesTotal.toLocaleString()}</span>
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
            <span className="esnaf-stat-tag">❤️ Toplam {dashboardStats.favoritesTotal.toLocaleString()}</span>
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

      {/* 12 Aylık İstatistikler (MUI X Charts) */}
      <div style={{ margin: '24px 32px 0 32px' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#111', fontSize: 18, fontWeight: 800 }}>Mağaza Ziyaretleri – Son 12 Ay</h3>
        <BarChart
          height={320}
          xAxis={[{ scaleType: 'band', data: getCalendarMonthsTR() }]}
          series={[{ data: getCalendarValues(monthlyStats.profileViews), label: 'Ziyaret', color: 'var(--yellow)' }]}
          grid={{ horizontal: true }}
        />
      </div>
    </EsnafPanelLayout>
  );
} 
// Helpers for MUI chart
function getCalendarMonthsTR(): string[] {
  return ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
}

function getCalendarValues(data?: number[]): number[] {
  const last12 = Array.isArray(data) && data.length > 0 ? data.slice(-12) : Array(12).fill(0);
  const vals = Array(12).fill(0);
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    vals[d.getMonth()] = last12[i] || 0;
  }
  return vals;
}