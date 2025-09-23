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
        <div className="esnaf-panel-loading">
          <div className="esnaf-loading-spinner" />
          <div>Yükleniyor...</div>
        </div>
      </EsnafPanelLayout>
    );
  }

  return (
    <EsnafPanelLayout activePage="ayarlar">
      <div className="esnaf-page-container">
        {/* Header */}
        <div className="esnaf-page-header">
          <div>
            <h1 className="esnaf-page-title">Çalışma Saatleri</h1>
            <p className="esnaf-page-subtitle">Müşterilerin randevu alabilmesi için çalışma saatlerinizi belirleyin</p>
          </div>
        </div>

        {/* Çalışma Saatleri Formu */}
        <div className="esnaf-profile-section">
          {Object.entries(dayNames).map(([dayKey, dayName]) => (
            <div key={dayKey} className="esnaf-working-day">
              {/* Gün Adı */}
              <div className="esnaf-day-header esnaf-day-label">{dayName}</div>

              {/* Kapalı/Açık Toggle */}
              <div className="esnaf-checkbox-label" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                <input
                  type="checkbox"
                  id={`closed-${dayKey}`}
                  checked={!workingHours[dayKey].closed}
                  onChange={(e) => handleDayChange(dayKey, 'closed', !e.target.checked)}
                  className="esnaf-checkbox"
                />
                <label htmlFor={`closed-${dayKey}`}>Açık</label>
              </div>

              {/* Saat Seçiciler */}
              {!workingHours[dayKey].closed && (
                <div className="esnaf-time-inputs">
                  <label className="esnaf-time-label">Açılış:</label>
                  <select
                    className="esnaf-select"
                    value={(workingHours[dayKey].open || '09:00').split(':')[0]}
                    onChange={(e) => handleDayChange(dayKey, 'open', `${e.target.value}:00`)}
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={`open-${dayKey}-${h}`} value={String(h).padStart(2, '0')}>
                        {String(h).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                  <label className="esnaf-time-label">Kapanış:</label>
                  <select
                    className="esnaf-select"
                    value={(workingHours[dayKey].close || '18:00').split(':')[0]}
                    onChange={(e) => handleDayChange(dayKey, 'close', `${e.target.value}:00`)}
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={`close-${dayKey}-${h}`} value={String(h).padStart(2, '0')}>
                        {String(h).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Kapalı Durumu */}
              {workingHours[dayKey].closed && (
                <span className="esnaf-appointment-status cancelled">Kapalı</span>
              )}
            </div>
          ))}
        </div>

        {/* Tatil Günleri Bölümü */}
        <div className="esnaf-profile-section" style={{ marginTop: 16 }}>
          {/* Tatil Günleri Header */}
          <div className="esnaf-content-header" style={{ background: '#fef2f2' }}>
            <h3 className="esnaf-dashboard-title" style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="calendar" size={18} color="#dc2626" />
              Tatil Günleri
            </h3>
            <p className="esnaf-dashboard-description" style={{ marginTop: 8 }}>
              Bu tarihlerde çalışmayacaksınız. Müşteriler bu tarihlerde randevu alamayacaktır.
            </p>
          </div>

          {/* Tatil Günleri İçerik */}
          <div>
            {/* Tarih Ekleme */}
            <div className="esnaf-action-bar" style={{ borderBottom: 'none', padding: 0, marginBottom: 16 }}>
              <input
                type="date"
                id="unavailable-date"
                min={new Date().toISOString().split('T')[0]}
                className="esnaf-input"
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
                className="esnaf-btn esnaf-btn-red"
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
                
                <div className="esnaf-dashboard-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
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
              <div className="esnaf-calendar-empty-state">
                <Icon name="calendar" size={32} color="#ccc" />
                <p>Henüz tatil günü eklenmemiş</p>
                <p style={{ fontSize: 12 }}>Yukarıdan tarih seçip "Tatil Günü Ekle" butonuna tıklayın</p>
              </div>
            )}
          </div>
        </div>

        {/* Bilgi Kutusu */}
        <div className="esnaf-profile-section" style={{ background: '#f0f9ff', borderColor: '#b3d9ff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Icon name="info" size={20} color="#0066cc" />
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#0066cc', fontSize: 16, fontWeight: 600 }}>
                Önemli Bilgi
              </h4>
              <p style={{ margin: 0, color: '#0066cc', fontSize: 14, lineHeight: '1.5' }}>
                Çalışma saatlerinizi belirledikten sonra müşteriler bu saatler içinde randevu talebi oluşturabilecek. 
                Kapalı olarak işaretlediğiniz günlerde randevu alınamayacaktır.
              </p>
            </div>
          </div>
        </div>

        {/* Kaydet ve İptal Butonları */}
        <div className="esnaf-form-actions" style={{ justifyContent: 'flex-end' }}>
          <button 
            type="button"
            onClick={() => router.push('/esnaf/ayarlar')}
            className="esnaf-cancel-btn"
          >
            İptal
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="esnaf-save-btn"
          >
            <Icon name="save" size={16} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </EsnafPanelLayout>
  );
} 