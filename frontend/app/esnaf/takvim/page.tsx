'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import "../../styles/esnaf.css";
import EsnafPanelLayout from "../components/EsnafPanelLayout";
import { useEsnaf } from "../context/EsnafContext";
import { api } from "@/app/utils/api";
import Icon from "@/app/components/ui/Icon";

interface CalendarEvent {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_description: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export default function EsnafTakvimPage() {
  const { user, email } = useEsnaf();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Randevuları API'den çek
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.getVendorAppointments();
        setEvents(response.data || []);
      } catch (err: any) {
        console.error("Randevular yüklenirken hata:", err);
        setError("Randevular yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'confirmed': return 'Onaylandı';
      case 'pending': return 'Beklemede';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return 'Bilinmiyor';
    }
  }, []);

  // Takvim fonksiyonları
  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  }, []);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  // Memoized hesaplamalar - yüksek performans için
  const calendarData = useMemo(() => {
    return getDaysInMonth(currentDate);
  }, [currentDate, getDaysInMonth]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateString = selectedDate.toISOString().split('T')[0];
    return events.filter(event => event.appointment_date === dateString);
  }, [selectedDate, events]);

  // Yaklaşan randevuları memoize et
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.appointment_date);
        return eventDate >= today && eventDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
      .slice(0, 10); // Maksimum 10 randevu göster
  }, [events]);

  // Event handler'ları memoize et
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleMonthChange = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  }, []);

  const handleTodayClick = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const { daysInMonth, startingDay } = calendarData;
  const monthName = currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  // Takvim render'ını memoize et
  const renderCalendar = useCallback(() => {
    const days = [];
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    // Gün isimleri
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={`header-${i}`} style={{
          padding: '12px',
          textAlign: 'center',
          fontWeight: '600',
          color: '#666',
          fontSize: '14px',
          borderBottom: '1px solid #e0e0e0'
        }}>
          {dayNames[i]}
        </div>
      );
    }

    // Boş günler (ayın başından önce)
    for (let i = 0; i < startingDay; i++) {
      days.push(
        <div key={`empty-${i}`} style={{
          padding: '8px',
          minHeight: '80px',
          border: '1px solid #f0f0f0',
          background: '#fafafa'
        }} />
      );
    }

    // Ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateString = date.toISOString().split('T')[0];
      const dayEvents = events.filter(event => event.appointment_date === dateString);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();

      days.push(
        <div key={day} style={{
          padding: '8px',
          minHeight: '80px',
          border: '1px solid #e0e0e0',
          background: isSelected ? '#fff7e6' : isToday ? '#f0f9ff' : 'white',
          cursor: 'pointer',
          position: 'relative'
        }} onClick={() => handleDateSelect(date)}>
          <div style={{
            fontWeight: isToday ? '700' : '500',
            color: isToday ? '#ffd600' : '#333',
            fontSize: '14px',
            marginBottom: '4px'
          }}>
            {day}
          </div>
          
          {dayEvents.map((event, index) => (
            <div key={event.id} style={{
              background: getStatusColor(event.status),
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              marginBottom: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }} title={`${event.customer_name} - ${event.service_description}`}>
              {event.appointment_time} {event.customer_name}
            </div>
          ))}
        </div>
      );
    }

    return days;
  }, [currentDate, events, selectedDate, handleDateSelect, getStatusColor]);

  return (
    <EsnafPanelLayout activePage="takvim" title="Takvim">
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#111111', margin: '0 0 8px 0' }}>
              Takvim
            </h1>
            <p style={{ color: '#666', margin: '0' }}>
              {monthName} • {events.length} randevu
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={() => handleMonthChange('prev')}
              style={{
                background: 'transparent',
                color: '#666',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Icon name="chevron-left" size={16} />
              Önceki
            </button>
            
            <button 
              onClick={handleTodayClick}
              style={{
                background: '#ffd600',
                color: '#111111',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Bugün
            </button>
            
            <button 
              onClick={() => handleMonthChange('next')}
              style={{
                background: 'transparent',
                color: '#666',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Sonraki
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar and Events */}
      <div style={{ padding: '24px 32px', display: 'flex', gap: '24px', minHeight: '600px' }}>
        {loading ? (
          <div style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>Yükleniyor...</div>
              <div>Randevular yükleniyor</div>
            </div>
          </div>
        ) : error ? (
          <div style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', color: '#ef4444' }}>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>Hata!</div>
              <div>{error}</div>
            </div>
          </div>
        ) : (
          <>
            {/* Calendar */}
            <div style={{ flex: '1', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)',
                borderBottom: '1px solid #e0e0e0'
              }}>
                {renderCalendar()}
              </div>
            </div>

            {/* Right Panel - Selected Date Events and Upcoming Events */}
            <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Selected Date Events */}
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#111111' }}>
                  {selectedDate ? formatDate(selectedDate) : 'Tarih Seçin'}
                </h3>
                
                {selectedDateEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                    <Icon name="calendar" size={32} />
                    <p style={{ margin: '8px 0 0 0' }}>
                      {selectedDate ? 'Bu tarihte randevu bulunmuyor' : 'Takvimden bir tarih seçin'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedDateEvents.map((event) => (
                      <div key={event.id} style={{
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        background: '#f9f9f9'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#111111' }}>
                            {event.customer_name}
                          </h4>
                          <span style={{
                            background: getStatusColor(event.status),
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            {getStatusText(event.status)}
                          </span>
                        </div>
                        
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                          {event.service_description}
                        </p>
                        
                        <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
                          {event.appointment_time} • {event.notes || 'Not yok'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Events */}
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#111111' }}>
                  Yaklaşan Randevular
                </h3>
                
                {upcomingEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    <Icon name="clock" size={24} />
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                      Önümüzdeki 7 günde randevu bulunmuyor
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {upcomingEvents.slice(0, 5).map((event) => {
                      const eventDate = new Date(event.appointment_date);
                      const today = new Date();
                      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={event.id} style={{
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          background: '#f8f9fa',
                          cursor: 'pointer'
                        }} onClick={() => handleDateSelect(eventDate)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <h4 style={{ margin: '0', fontSize: '13px', fontWeight: '600', color: '#111111' }}>
                              {event.customer_name}
                            </h4>
                            <span style={{
                              background: getStatusColor(event.status),
                              color: 'white',
                              padding: '1px 4px',
                              borderRadius: '4px',
                              fontSize: '9px',
                              fontWeight: '600'
                            }}>
                              {getStatusText(event.status)}
                            </span>
                          </div>
                          
                          <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#666' }}>
                            {event.service_description}
                          </p>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: '0', fontSize: '11px', color: '#999' }}>
                              {event.appointment_time} • {eventDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </p>
                            <span style={{
                              background: daysUntil === 0 ? '#ef4444' : daysUntil <= 2 ? '#f59e0b' : '#10b981',
                              color: 'white',
                              padding: '1px 4px',
                              borderRadius: '4px',
                              fontSize: '9px',
                              fontWeight: '600'
                            }}>
                              {daysUntil === 0 ? 'Bugün' : daysUntil === 1 ? 'Yarın' : `${daysUntil} gün`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {upcomingEvents.length > 5 && (
                      <div style={{ textAlign: 'center', padding: '8px', color: '#666', fontSize: '12px' }}>
                        +{upcomingEvents.length - 5} randevu daha
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </EsnafPanelLayout>
  );
} 