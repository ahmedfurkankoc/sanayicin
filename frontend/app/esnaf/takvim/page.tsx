'use client';

import React, { useState } from "react";
import "../../styles/esnaf.css";
import EsnafPanelLayout from "../components/EsnafPanelLayout";
import { useEsnaf } from "../context/EsnafContext";
import Icon from "@/app/components/ui/Icon";

interface CalendarEvent {
  id: string;
  customerName: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  description: string;
}

export default function EsnafTakvimPage() {
  const { user, email } = useEsnaf();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock takvim verileri
  const [events] = useState<CalendarEvent[]>([
    {
      id: '1',
      customerName: 'Ahmet Yılmaz',
      service: 'Motor Bakımı',
      date: '2025-07-15',
      time: '14:00',
      status: 'confirmed',
      description: 'Motor yağı değişimi ve genel kontrol'
    },
    {
      id: '2',
      customerName: 'Fatma Demir',
      service: 'Fren Sistemi Tamiri',
      date: '2025-07-16',
      time: '10:30',
      status: 'pending',
      description: 'Fren balataları değişimi ve sistem kontrolü'
    },
    {
      id: '3',
      customerName: 'Mehmet Kaya',
      service: 'Elektrik Arıza',
      date: '2025-07-18',
      time: '16:00',
      status: 'confirmed',
      description: 'Araç elektrik sistemi arıza tespiti'
    },
    {
      id: '4',
      customerName: 'Ayşe Özkan',
      service: 'Kaporta Boya',
      date: '2025-07-20',
      time: '09:00',
      status: 'pending',
      description: 'Ön tampon boya işlemi'
    },
    {
      id: '5',
      customerName: 'Ali Veli',
      service: 'Lastik Değişimi',
      date: '2025-07-22',
      time: '11:00',
      status: 'confirmed',
      description: '4 lastik değişimi ve balans'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Onaylandı';
      case 'pending': return 'Beklemede';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return 'Bilinmiyor';
    }
  };

  // Takvim fonksiyonları
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const renderCalendar = () => {
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
      const dayEvents = getEventsForDate(date);
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
        }} onClick={() => setSelectedDate(date)}>
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
            }} title={`${event.customerName} - ${event.service}`}>
              {event.time} {event.customerName}
            </div>
          ))}
        </div>
      );
    }

    return days;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

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
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
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
              onClick={() => setCurrentDate(new Date())}
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
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
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

        {/* Selected Date Events */}
        <div style={{ width: '350px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '20px' }}>
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
                      {event.customerName}
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
                    {event.service}
                  </p>
                  
                  <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
                    {event.time} • {event.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </EsnafPanelLayout>
  );
} 