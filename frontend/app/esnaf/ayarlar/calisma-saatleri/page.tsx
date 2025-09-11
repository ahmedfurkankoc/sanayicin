'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/styles/esnaf.css";
import EsnafPanelLayout from "../../components/EsnafPanelLayout";
import { useEsnaf } from "../../context/EsnafContext";
import { api } from "@/app/utils/api";
import { toast } from "sonner";
import Icon from "@/app/components/ui/Icon";

interface WorkingHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

export default function EsnafCalismaSaatleriPage() {
  const router = useRouter();
  const { user, email } = useEsnaf();
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '18:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: false }
  });
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dayNames = {
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
    saturday: 'Cumartesi',
    sunday: 'Pazar'
  };

  // Mevcut çalışma saatlerini çek
  useEffect(() => {
    const fetchWorkingHours = async () => {
      try {
        const response = await api.getProfile('vendor');
        if (response.data.working_hours) {
          setWorkingHours(response.data.working_hours);
        }
        if (response.data.unavailable_dates) {
          setUnavailableDates(response.data.unavailable_dates);
        }
      } catch (error) {
        console.error('Çalışma saatleri çekme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkingHours();
  }, []);

  const handleDayChange = (day: string, field: string, value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleAddUnavailableDate = (date: string) => {
    if (!unavailableDates.includes(date)) {
      setUnavailableDates(prev => [...prev, date]);
    } else {
      toast.error('Bu tarih zaten tatil günü olarak eklenmiş!');
    }
  };

  const handleRemoveUnavailableDate = (date: string) => {
    setUnavailableDates(prev => prev.filter(d => d !== date));
    toast.success('Tatil günü kaldırıldı!');
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('working_hours', JSON.stringify(workingHours));
      formData.append('unavailable_dates', JSON.stringify(unavailableDates));
      
      await api.updateProfile(formData, 'vendor');
      toast.success('Çalışma saatleri başarıyla güncellendi!');
      router.push('/esnaf/ayarlar');
    } catch (error: any) {
      console.error('Kaydetme hatası:', error);
      toast.error(error.response?.data?.detail || 'Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <EsnafPanelLayout activePage="ayarlar">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          color: '#666'
        }}>
          Yükleniyor...
        </div>
      </EsnafPanelLayout>
    );
  }

  return (
    <EsnafPanelLayout activePage="ayarlar">
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #e0e0e0' }}>
                  <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#111111', margin: '0 0 8px 0' }}>
              Çalışma Saatleri
            </h1>
            <p style={{ color: '#666', margin: '0' }}>
              Müşterilerin randevu alabilmesi için çalışma saatlerinizi belirleyin
            </p>
          </div>
      </div>

      {/* Çalışma Saatleri Formu */}
      <div style={{ padding: '24px 32px' }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          border: '1px solid #e0e0e0',
          overflow: 'hidden'
        }}>
          {Object.entries(dayNames).map(([dayKey, dayName]) => (
            <div key={dayKey} style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              {/* Gün Adı */}
              <div style={{ 
                minWidth: '120px',
                fontWeight: '600',
                color: '#333',
                fontSize: '16px'
              }}>
                {dayName}
              </div>

              {/* Kapalı/Açık Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id={`closed-${dayKey}`}
                  checked={!workingHours[dayKey].closed}
                  onChange={(e) => handleDayChange(dayKey, 'closed', !e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor={`closed-${dayKey}`} style={{ fontSize: '14px', color: '#666' }}>
                  Açık
                </label>
              </div>

              {/* Saat Seçiciler */}
              {!workingHours[dayKey].closed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>Açılış:</span>
                    <input
                      type="time"
                      value={workingHours[dayKey].open}
                      onChange={(e) => handleDayChange(dayKey, 'open', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <span style={{ fontSize: '14px', color: '#666' }}>-</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>Kapanış:</span>
                    <input
                      type="time"
                      value={workingHours[dayKey].close}
                      onChange={(e) => handleDayChange(dayKey, 'close', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Kapalı Durumu */}
              {workingHours[dayKey].closed && (
                <span style={{ 
                  color: '#ef4444', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  marginLeft: '16px'
                }}>
                  Kapalı
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Tatil Günleri Bölümü */}
        <div style={{ 
          marginTop: '32px',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden'
        }}>
          {/* Tatil Günleri Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fef2f2'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: '#dc2626', 
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Icon name="calendar" size={18} color="#dc2626" />
              Tatil Günleri
            </h3>
            <p style={{ 
              color: '#666', 
              fontSize: '13px', 
              margin: '8px 0 0 0',
              lineHeight: '1.4'
            }}>
              Bu tarihlerde çalışmayacaksınız. Müşteriler bu tarihlerde randevu alamayacaktır.
            </p>
          </div>

          {/* Tatil Günleri İçerik */}
          <div style={{ padding: '20px 24px' }}>
            {/* Tarih Ekleme */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              <input
                type="date"
                id="unavailable-date"
                min={new Date().toISOString().split('T')[0]}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '150px'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('unavailable-date') as HTMLInputElement;
                  if (input && input.value) {
                    handleAddUnavailableDate(input.value);
                    input.value = '';
                    toast.success('Tatil günü eklendi!');
                  } else {
                    toast.error('Lütfen bir tarih seçin');
                  }
                }}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Tatil Günü Ekle
              </button>
            </div>

            {/* Seçili Tatil Günleri */}
            {unavailableDates.length > 0 ? (
              <div>
                <h4 style={{ 
                  fontSize: '15px', 
                  fontWeight: '600', 
                  color: '#333', 
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Icon name="calendar" size={16} color="#dc2626" />
                  Seçili Tatil Günleri ({unavailableDates.length})
                </h4>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  {unavailableDates.map((date, index) => (
                    <div key={index} style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      color: '#dc2626'
                    }}>
                      <span style={{ fontWeight: '500' }}>
                        {new Date(date).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUnavailableDate(date)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '18px',
                          padding: '0',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fecaca';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#999',
                fontSize: '14px'
              }}>
                <Icon name="calendar" size={32} color="#ccc" />
                <p style={{ margin: '12px 0 0 0' }}>
                  Henüz tatil günü eklenmemiş
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                  Yukarıdan tarih seçip "Tatil Günü Ekle" butonuna tıklayın
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bilgi Kutusu */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #b3d9ff',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Icon name="info" size={20} color="#0066cc" />
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#0066cc', fontSize: '16px', fontWeight: '600' }}>
                Önemli Bilgi
              </h4>
              <p style={{ margin: '0', color: '#0066cc', fontSize: '14px', lineHeight: '1.5' }}>
                Çalışma saatlerinizi belirledikten sonra müşteriler bu saatler içinde randevu talebi oluşturabilecek. 
                Kapalı olarak işaretlediğiniz günlerde randevu alınamayacaktır.
              </p>
            </div>
          </div>
        </div>

        {/* Kaydet ve İptal Butonları */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '24px',
          padding: '24px 0',
          borderTop: '1px solid #e0e0e0'
        }}>
          <button 
            onClick={() => router.push('/esnaf/ayarlar')}
            style={{
              background: 'transparent',
              color: '#666',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            İptal
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? '#ccc' : '#ffd600',
              color: '#111111',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Icon name="save" size={16} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </EsnafPanelLayout>
  );
} 