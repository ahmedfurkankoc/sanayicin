'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/styles/esnaf.css";
import EsnafPanelLayout from "../../components/EsnafPanelLayout";
import { useEsnaf } from "../../context/EsnafContext";
import { api } from "@/app/utils/api";
import { toast } from "sonner";
import { Clock, Calendar, X, Save, Info } from "lucide-react";

interface WorkingHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

export default function EsnafCalismaSaatleriPage() {
  const router = useRouter();
  const { user } = useEsnaf();
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
        toast.error('Çalışma saatleri yüklenirken hata oluştu');
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
      toast.success('Tatil günü eklendi!');
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
      toast.error(error.response?.data?.detail || 'Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
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
            <p className="esnaf-page-subtitle">
              Müşterilerin randevu alabilmesi için çalışma saatlerinizi belirleyin
            </p>
          </div>
        </div>

        {/* Çalışma Saatleri */}
        <div className="esnaf-working-hours-section">
          <div className="esnaf-working-hours-grid">
            {Object.entries(dayNames).map(([dayKey, dayName]) => {
              const dayHours = workingHours[dayKey];
              const isClosed = dayHours.closed;

              return (
                <div key={dayKey} className={`esnaf-working-day-card ${isClosed ? 'closed' : ''}`}>
                  <div className="esnaf-working-day-header">
                    <div className="esnaf-working-day-name">
                      <Clock size={18} />
                      <span>{dayName}</span>
                    </div>
                    <label className="esnaf-toggle-switch">
                      <input
                        type="checkbox"
                        checked={!isClosed}
                        onChange={(e) => handleDayChange(dayKey, 'closed', !e.target.checked)}
                      />
                      <span className="esnaf-toggle-slider"></span>
                    </label>
                  </div>

                  {!isClosed && (
                    <div className="esnaf-working-day-times">
                      <div className="esnaf-time-selector">
                        <label>Açılış</label>
                        <select
                          value={(dayHours.open || '09:00').split(':')[0]}
                          onChange={(e) => handleDayChange(dayKey, 'open', `${e.target.value.padStart(2, '0')}:00`)}
                          className="esnaf-time-select"
                        >
                          {Array.from({ length: 24 }).map((_, h) => (
                            <option key={h} value={String(h).padStart(2, '0')}>
                              {String(h).padStart(2, '0')}:00
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="esnaf-time-separator">-</div>
                      <div className="esnaf-time-selector">
                        <label>Kapanış</label>
                        <select
                          value={(dayHours.close || '18:00').split(':')[0]}
                          onChange={(e) => handleDayChange(dayKey, 'close', `${e.target.value.padStart(2, '0')}:00`)}
                          className="esnaf-time-select"
                        >
                          {Array.from({ length: 24 }).map((_, h) => (
                            <option key={h} value={String(h).padStart(2, '0')}>
                              {String(h).padStart(2, '0')}:00
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {isClosed && (
                    <div className="esnaf-working-day-closed">
                      <span>Kapalı</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tatil Günleri */}
        <div className="esnaf-unavailable-dates-section">
          <div className="esnaf-section-header">
            <div className="esnaf-section-header-icon">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="esnaf-section-title">Tatil Günleri</h2>
              <p className="esnaf-section-description">
                Bu tarihlerde çalışmayacaksınız. Müşteriler bu tarihlerde randevu alamayacaktır.
              </p>
            </div>
          </div>

          <div className="esnaf-unavailable-dates-content">
            <div className="esnaf-date-picker-wrapper">
              <input
                type="date"
                id="unavailable-date-input"
                min={new Date().toISOString().split('T')[0]}
                className="esnaf-date-input"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('unavailable-date-input') as HTMLInputElement;
                  if (input?.value) {
                    handleAddUnavailableDate(input.value);
                    input.value = '';
                  } else {
                    toast.error('Lütfen bir tarih seçin');
                  }
                }}
                className="esnaf-btn-primary"
              >
                <Calendar size={16} />
                Tatil Günü Ekle
              </button>
            </div>

            {unavailableDates.length > 0 ? (
              <div className="esnaf-unavailable-dates-list">
                {unavailableDates.map((date, index) => (
                  <div key={index} className="esnaf-unavailable-date-tag">
                    <Calendar size={16} />
                    <span>{formatDate(date)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUnavailableDate(date)}
                      className="esnaf-unavailable-date-remove"
                      aria-label="Kaldır"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="esnaf-empty-state">
                <Calendar size={32} />
                <p>Henüz tatil günü eklenmemiş</p>
                <p className="esnaf-empty-state-hint">
                  Yukarıdan tarih seçip "Tatil Günü Ekle" butonuna tıklayın
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bilgi Kutusu */}
        <div className="esnaf-info-box">
          <Info size={20} />
          <div>
            <h4 className="esnaf-info-box-title">Önemli Bilgi</h4>
            <p className="esnaf-info-box-text">
              Çalışma saatlerinizi belirledikten sonra müşteriler bu saatler içinde randevu talebi oluşturabilecek. 
              Kapalı olarak işaretlediğiniz günlerde randevu alınamayacaktır.
            </p>
          </div>
        </div>

        {/* Kaydet ve İptal Butonları */}
        <div className="esnaf-form-actions">
          <button 
            type="button"
            onClick={() => router.push('/esnaf/ayarlar')}
            className="esnaf-btn-secondary"
          >
            İptal
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="esnaf-btn-primary"
          >
            <Save size={16} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </EsnafPanelLayout>
  );
}
