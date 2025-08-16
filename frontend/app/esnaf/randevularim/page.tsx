'use client';

import React, { useState, useEffect } from "react";
import "../../styles/esnaf.css";
import EsnafPanelLayout from "../components/EsnafPanelLayout";
import { useEsnaf } from "../context/EsnafContext";
import Icon from "@/app/components/ui/Icon";
import { api } from "@/app/utils/api";
import { toast } from "sonner";

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
}

interface VendorProfile {
  working_hours?: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
}

export default function EsnafRandevularimPage() {
  const { user, email } = useEsnaf();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [showWorkingHoursWarning, setShowWorkingHoursWarning] = useState(false);

  // Vendor profilini ve randevuları çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Vendor profilini çek
        const profileResponse = await api.getProfile('vendor');
        const profile = profileResponse.data;
        setVendorProfile(profile);
        
        // Çalışma saatleri kontrolü
        if (!profile.working_hours || Object.keys(profile.working_hours).length === 0) {
          setShowWorkingHoursWarning(true);
        }
        
        // Randevuları çek
        const appointmentsResponse = await api.getVendorAppointments();
        setAppointments(appointmentsResponse.data);
      } catch (error) {
        console.error('Veri çekme hatası:', error);
        toast.error('Veriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
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

  // Randevu saati geçmiş mi kontrol et
  const isAppointmentTimePassed = (appointment: Appointment) => {
    const appointmentDate = new Date(appointment.appointment_date);
    const appointmentTime = appointment.appointment_time;
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    
    appointmentDate.setHours(hours, minutes, 0, 0);
    const now = new Date();
    
    return appointmentDate < now;
  };

  const handleAppointmentAction = async (appointmentId: number, action: string) => {
    try {
      await api.updateAppointmentStatus(appointmentId, action);
      
      // Randevuları yeniden çek
      const response = await api.getVendorAppointments();
      setAppointments(response.data);
      
      const actionTexts = {
        'confirm': 'onaylandı',
        'reject': 'reddedildi', 
        'complete': 'tamamlandı',
        'cancel': 'iptal edildi'
      };
      
      toast.success(`Randevu ${actionTexts[action as keyof typeof actionTexts] || 'güncellendi'}`);
    } catch (error: any) {
      console.error('İşlem hatası:', error);
      
      // Backend'den gelen hata mesajını göster
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('İşlem sırasında hata oluştu');
      }
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;
    const matchesSearch = appointment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.service_description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <EsnafPanelLayout activePage="randevularim" title="Randevularım">
        <div className="esnaf-appointments-loading">
          Yükleniyor...
        </div>
      </EsnafPanelLayout>
    );
  }

  return (
    <EsnafPanelLayout activePage="randevularim" title="Randevularım">
      {/* Çalışma Saatleri Uyarısı */}
      {showWorkingHoursWarning && (
        <div className="esnaf-appointments-warning">
          <Icon name="alert-triangle" size={20} className="esnaf-appointments-warning-icon" />
          <div className="esnaf-appointments-warning-content">
            <h4 className="esnaf-appointments-warning-title">
              Çalışma Saatleri Belirlenmemiş
            </h4>
            <p className="esnaf-appointments-warning-text">
              Müşterilerin randevu talebi oluşturabilmesi için önce çalışma saatlerinizi belirlemeniz gerekmektedir.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/esnaf/ayarlar/calisma-saatleri'}
            className="esnaf-appointments-warning-btn"
          >
            Çalışma Saatlerini Belirle
          </button>
        </div>
      )}

      {/* Header */}
      <div className="esnaf-appointments-header">
        <div className="esnaf-appointments-header-inner">
          <div>
            <h1 className="esnaf-page-title">Randevularım</h1>
            <p className="esnaf-appointments-stats">
              Toplam {appointments.length} randevu • {appointments.filter(a => a.status === 'pending').length} bekleyen
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="esnaf-appointments-filters">
        <div className="esnaf-appointments-filters-inner">
          {/* Search */}
          <div className="esnaf-appointments-search-container">
            <input
              type="text"
              placeholder="Müşteri adı veya hizmet ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="esnaf-appointments-search-input"
            />
            <div className="esnaf-appointments-search-icon">
              <Icon name="search" size={16} />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="esnaf-appointments-status-filter"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="confirmed">Onaylandı</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal Edildi</option>
            <option value="rejected">Reddedildi</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="esnaf-appointments-list">
        {filteredAppointments.length === 0 ? (
          <div className="esnaf-appointments-empty">
            <div className="esnaf-appointments-empty-icon">
              <Icon name="calendar" size={48} />
            </div>
            <h3 className="esnaf-appointments-empty-title">Randevu Bulunamadı</h3>
            <p className="esnaf-appointments-empty-text">Arama kriterlerinize uygun randevu bulunmuyor.</p>
          </div>
        ) : (
          <div className="esnaf-appointments-cards">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="esnaf-appointment-card">
                <div className="esnaf-appointment-header">
                  <div className="esnaf-appointment-client-info">
                    <h3>{appointment.client_name}</h3>
                    <p className="esnaf-appointment-contact-info">
                      <Icon name="phone" size={14} className="esnaf-appointment-contact-icon" />
                      <span>{appointment.client_phone}</span>
                    </p>
                    <p className="esnaf-appointment-contact-info">
                      <Icon name="mail" size={14} className="esnaf-appointment-contact-icon" />
                      <span>{appointment.client_email}</span>
                    </p>
                  </div>
                  
                  <div className="esnaf-appointment-status-section">
                    <span className={`esnaf-appointment-status ${appointment.status}`}>
                      {getStatusText(appointment.status)}
                    </span>
                    <div className="esnaf-appointment-date-time">
                      {new Date(appointment.appointment_date).toLocaleDateString('tr-TR')} • {appointment.appointment_time}
                    </div>
                  </div>
                </div>

                <div className="esnaf-appointment-service-section">
                  <h4 className="esnaf-appointment-service-title">
                    Hizmet Talebi
                  </h4>
                  <p className="esnaf-appointment-service-description">
                    {appointment.service_description}
                  </p>
                  {appointment.notes && (
                    <p className="esnaf-appointment-notes">
                      Not: {appointment.notes}
                    </p>
                  )}
                </div>

                <div className="esnaf-appointment-actions">
                  {appointment.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                        className="esnaf-appointment-btn esnaf-appointment-btn-confirm"
                      >
                        Onayla
                      </button>
                      <button 
                        onClick={() => handleAppointmentAction(appointment.id, 'reject')}
                        className="esnaf-appointment-btn esnaf-appointment-btn-reject"
                      >
                        Reddet
                      </button>
                    </>
                  )}
                  
                  {appointment.status === 'confirmed' && (
                    <>
                      {isAppointmentTimePassed(appointment) ? (
                        <button 
                          onClick={() => handleAppointmentAction(appointment.id, 'complete')}
                          className="esnaf-appointment-btn esnaf-appointment-btn-complete"
                        >
                          Tamamlandı Olarak İşaretle
                        </button>
                      ) : (
                        <div className="esnaf-appointment-time-warning">
                          <Icon name="clock" size={14} />
                          Randevu saati henüz gelmedi
                        </div>
                      )}
                    </>
                  )}
                  
                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                    <button 
                      onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                      className="esnaf-appointment-btn esnaf-appointment-btn-cancel"
                    >
                      İptal Et
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EsnafPanelLayout>
  );
} 