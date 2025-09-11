'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import "../../styles/esnaf.css";
import EsnafPanelLayout from "../components/EsnafPanelLayout";
import { useEsnaf } from "../context/EsnafContext";
import { api } from "@/app/utils/api";
import Icon from "@/app/components/ui/Icon";

interface CalendarEvent {
  id: number;
  client_name: string;
  client_phone: string;
  client_email: string;
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
        <div key={`header-${i}`} className="esnaf-calendar-day-header">
          {dayNames[i]}
        </div>
      );
    }

    // Boş günler (ayın başından önce)
    for (let i = 0; i < startingDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="esnaf-calendar-day-empty" />
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
        <div 
          key={day} 
          className={`esnaf-calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => handleDateSelect(date)}
        >
          <div className={`esnaf-calendar-day-number ${isToday ? 'today' : ''}`}>
            {day}
          </div>
          
          {dayEvents.map((event) => (
            <div 
              key={event.id} 
              className={`esnaf-calendar-event ${event.status}`}
              title={`${event.client_name} - ${event.service_description}`}
            >
                              {event.appointment_time} {event.client_name}
            </div>
          ))}
        </div>
      );
    }

    return days;
  }, [currentDate, events, selectedDate, handleDateSelect]);

  return (
    <EsnafPanelLayout activePage="takvim">
      {/* Header */}
      <div className="esnaf-calendar-header">
        <div className="esnaf-calendar-header-inner">
          <div>
            <h1 className="esnaf-calendar-title">
              Takvim
            </h1>
            <p className="esnaf-calendar-subtitle">
              {monthName} • {events.length} randevu
            </p>
          </div>
          
          <div className="esnaf-calendar-controls">
            <button 
              onClick={() => handleMonthChange('prev')}
              className="esnaf-calendar-btn"
            >
              <Icon name="chevron-left" size={16} />
              Önceki Ay
            </button>
            
            <button 
              onClick={handleTodayClick}
              className="esnaf-calendar-btn-today"
            >
              Bugün
            </button>
            
            <button 
              onClick={() => handleMonthChange('next')}
              className="esnaf-calendar-btn"
            >
              Sonraki Ay
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar and Events */}
      <div className="esnaf-calendar-container">
        {loading ? (
          <div className="esnaf-calendar-loading">
            <div className="esnaf-calendar-loading-content">
              <div className="esnaf-calendar-loading-text">Yükleniyor...</div>
              <div>Randevular yükleniyor</div>
            </div>
          </div>
        ) : error ? (
          <div className="esnaf-calendar-error">
            <div className="esnaf-calendar-error-content">
              <div className="esnaf-calendar-error-title">Hata!</div>
              <div>{error}</div>
            </div>
          </div>
        ) : (
          <>
            {/* Calendar */}
            <div className="esnaf-calendar-main">
              <div className="esnaf-calendar-grid">
                {renderCalendar()}
              </div>
            </div>

            {/* Right Panel - Selected Date Events and Upcoming Events */}
            <div className="esnaf-calendar-sidebar">
              {/* Selected Date Events */}
              <div className="esnaf-calendar-panel">
                <h3 className="esnaf-calendar-panel-title">
                  {selectedDate ? formatDate(selectedDate) : 'Tarih Seçin'}
                </h3>
                
                {selectedDateEvents.length === 0 ? (
                  <div className="esnaf-calendar-empty-state">
                    <Icon name="calendar" size={32} />
                    <p>
                      {selectedDate ? 'Bu tarihte randevu bulunmuyor' : 'Takvimden bir tarih seçin'}
                    </p>
                  </div>
                ) : (
                  <div className="esnaf-calendar-events-list">
                    {selectedDateEvents.map((event) => (
                      <div key={event.id} className="esnaf-calendar-event-card">
                        <div className="esnaf-calendar-event-header">
                          <h4 className="esnaf-calendar-event-title">
                            {event.client_name}
                          </h4>
                          <span className={`esnaf-calendar-event-status ${event.status}`}>
                            {getStatusText(event.status)}
                          </span>
                        </div>
                        
                        <p className="esnaf-calendar-event-description">
                          {event.service_description}
                        </p>
                        
                        <p className="esnaf-calendar-event-meta">
                          {event.appointment_time} • {event.notes || 'Not yok'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Events */}
              <div className="esnaf-calendar-panel">
                <h3 className="esnaf-calendar-panel-title">
                  Yaklaşan Randevular
                </h3>
                
                {upcomingEvents.length === 0 ? (
                  <div className="esnaf-calendar-empty-state upcoming">
                    <Icon name="clock" size={24} />
                    <p>
                      Önümüzdeki 7 günde randevu bulunmuyor
                    </p>
                  </div>
                ) : (
                  <div className="esnaf-calendar-upcoming-list">
                    {upcomingEvents.slice(0, 5).map((event) => {
                      const eventDate = new Date(event.appointment_date);
                      const today = new Date();
                      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div 
                          key={event.id} 
                          className="esnaf-calendar-upcoming-card"
                          onClick={() => handleDateSelect(eventDate)}
                        >
                          <div className="esnaf-calendar-upcoming-header">
                            <h4 className="esnaf-calendar-upcoming-title">
                              {event.client_name}
                            </h4>
                            <span className={`esnaf-calendar-upcoming-status ${event.status}`}>
                              {getStatusText(event.status)}
                            </span>
                          </div>
                          
                          <p className="esnaf-calendar-upcoming-description">
                            {event.service_description}
                          </p>
                          
                          <div className="esnaf-calendar-upcoming-footer">
                            <p className="esnaf-calendar-upcoming-meta">
                              {event.appointment_time} • {eventDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </p>
                            <span className={`esnaf-calendar-upcoming-days ${
                              daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : ''
                            }`}>
                              {daysUntil === 0 ? 'Bugün' : daysUntil === 1 ? 'Yarın' : `${daysUntil} gün`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {upcomingEvents.length > 5 && (
                      <div className="esnaf-calendar-more-events">
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