'use client';

import React, { useState, useEffect } from 'react';
import { useMusteri } from '../context/MusteriContext';
import { api } from '@/app/utils/api';
import { toast } from 'sonner';
import Link from 'next/link';
import '../../styles/musteri.css';

interface Appointment {
  id: number;
  client_name: string;
  client_phone: string;
  client_email: string;
  service_description: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  vendor: {
    id: number;
    slug: string;
    display_name: string;
    business_phone: string;
    city: string;
    district: string;
    user: {
      email: string;
    };
  };
}

export default function MusteriTaleplerimPage() {
  const { user } = useMusteri();
  const clientEmail = user?.email;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchAppointments();
  }, [clientEmail]);

  const fetchAppointments = async () => {
    if (!clientEmail) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.getClientAppointments(clientEmail);
      setAppointments(response.data);
    } catch (error: any) {
      console.error('Randevu talepleri getirme hatası:', error);
      toast.error('Randevu talepleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'var(--green)';
      case 'pending': return 'var(--yellow)';
      case 'completed': return 'var(--blue)';
      case 'cancelled': return 'var(--red)';
      case 'rejected': return 'var(--red)';
      default: return 'var(--gray)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Onaylandı';
      case 'pending': return 'Beklemede';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      case 'rejected': return 'Reddedildi';
      default: return 'Bilinmiyor';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // HH:MM formatında göster
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (selectedStatus === 'all') return true;
    return appointment.status === selectedStatus;
  });

  if (loading) {
    return (
      <div className="musteri-page-container">
        <div className="musteri-loading">
          <div className="musteri-loading-spinner"></div>
          <p>Randevu talepleri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="musteri-page-container">
      <div className="musteri-page-header">
        <h1>Taleplerim</h1>
        <p>Randevu taleplerinizi ve durumlarını buradan takip edebilirsiniz.</p>
      </div>

      {/* Status Filter */}
      <div className="musteri-filter-section">
        <div className="musteri-filter-buttons">
          <button
            className={`musteri-filter-btn ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('all')}
          >
            Tümü ({appointments.length})
          </button>
          <button
            className={`musteri-filter-btn ${selectedStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('pending')}
          >
            Beklemede ({appointments.filter(a => a.status === 'pending').length})
          </button>
          <button
            className={`musteri-filter-btn ${selectedStatus === 'confirmed' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('confirmed')}
          >
            Onaylı ({appointments.filter(a => a.status === 'confirmed').length})
          </button>
          <button
            className={`musteri-filter-btn ${selectedStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('completed')}
          >
            Tamamlandı ({appointments.filter(a => a.status === 'completed').length})
          </button>
          <button
            className={`musteri-filter-btn ${selectedStatus === 'cancelled' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('cancelled')}
          >
            İptal ({appointments.filter(a => a.status === 'cancelled').length})
          </button>
          <button
            className={`musteri-filter-btn ${selectedStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('rejected')}
          >
            Red ({appointments.filter(a => a.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="musteri-empty-state">
          <div className="musteri-empty-icon">📋</div>
          <h3>
            {selectedStatus === 'all' 
              ? 'Henüz randevu talebiniz bulunmuyor' 
              : `${getStatusText(selectedStatus)} statüsünde randevu talebiniz bulunmuyor`
            }
          </h3>
          <p>
            {selectedStatus === 'all' 
              ? 'Esnaflardan randevu taleplerinde bulunarak burada takip edebilirsiniz.'
              : 'Diğer filtreleri kullanarak randevu taleplerinizi görüntüleyebilirsiniz.'
            }
          </p>
          {selectedStatus === 'all' && (
            <Link href="/musteri" className="musteri-btn musteri-btn-primary">
              Hizmet Ara
            </Link>
          )}
        </div>
      ) : (
        <div className="musteri-appointments-list">
          {filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="musteri-appointment-card">
              <div className="musteri-appointment-header">
                <div className="musteri-appointment-vendor">
                  <Link 
                    href={`/musteri/esnaf/${appointment.vendor.slug}`}
                    className="musteri-vendor-link"
                  >
                    <h3>{appointment.vendor.display_name}</h3>
                  </Link>
                  <p>{appointment.vendor.city} / {appointment.vendor.district}</p>
                  <p>📞 {appointment.vendor.business_phone}</p>
                </div>
                <div 
                  className="musteri-appointment-status"
                  style={{ 
                    backgroundColor: getStatusColor(appointment.status),
                    color: appointment.status === 'pending' ? 'var(--black)' : 'white'
                  }}
                >
                  {getStatusText(appointment.status)}
                </div>
              </div>

              <div className="musteri-appointment-details">
                <div className="musteri-appointment-info">
                  <div className="musteri-info-row">
                    <span className="musteri-info-label">📅 Tarih:</span>
                    <span className="musteri-info-value">
                      {formatDate(appointment.appointment_date)} - {formatTime(appointment.appointment_time)}
                    </span>
                  </div>
                  <div className="musteri-info-row">
                    <span className="musteri-info-label">🔧 Hizmet:</span>
                    <span className="musteri-info-value">{appointment.service_description}</span>
                  </div>
                  <div className="musteri-info-row">
                    <span className="musteri-info-label">👤 Ad Soyad:</span>
                    <span className="musteri-info-value">{appointment.client_name}</span>
                  </div>
                  <div className="musteri-info-row">
                    <span className="musteri-info-label">📞 Telefon:</span>
                    <span className="musteri-info-value">{appointment.client_phone}</span>
                  </div>
                  {appointment.notes && (
                    <div className="musteri-info-row">
                      <span className="musteri-info-label">📝 Notlar:</span>
                      <span className="musteri-info-value">{appointment.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="musteri-appointment-footer">
                <div className="musteri-appointment-dates">
                  <small>
                    Oluşturulma: {new Date(appointment.created_at).toLocaleDateString('tr-TR')}
                  </small>
                  {appointment.updated_at !== appointment.created_at && (
                    <small>
                      Güncelleme: {new Date(appointment.updated_at).toLocaleDateString('tr-TR')}
                    </small>
                  )}
                </div>
                
                <div className="musteri-appointment-actions">
                  <Link 
                    href={`/musteri/esnaf/${appointment.vendor.slug}`}
                    className="musteri-btn musteri-btn-outline"
                  >
                    Esnaf Profilini Gör
                  </Link>
                  {(appointment.status === 'confirmed' || appointment.status === 'completed') && (
                    <Link 
                      href={`/musteri/mesajlar?vendor=${appointment.vendor.id}`}
                      className="musteri-btn musteri-btn-primary"
                    >
                      Mesaj Gönder
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
