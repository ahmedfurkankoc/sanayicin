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
  customer_name: string;
  customer_phone: string;
  customer_email: string;
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
    const matchesSearch = appointment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.service_description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <EsnafPanelLayout activePage="randevularim" title="Randevularım">
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
    <EsnafPanelLayout activePage="randevularim" title="Randevularım">
      {/* Çalışma Saatleri Uyarısı */}
      {showWorkingHoursWarning && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '16px 24px',
          margin: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Icon name="alert-triangle" size={20} color="#856404" />
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#856404', fontSize: '16px', fontWeight: '600' }}>
              Çalışma Saatleri Belirlenmemiş
            </h4>
            <p style={{ margin: '0', color: '#856404', fontSize: '14px' }}>
              Müşterilerin randevu talebi oluşturabilmesi için önce çalışma saatlerinizi belirlemeniz gerekmektedir.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/esnaf/ayarlar/calisma-saatleri'}
            style={{
              background: '#856404',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            Çalışma Saatlerini Belirle
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            
            <p style={{ color: '#666', margin: '0' }}>
              Toplam {appointments.length} randevu • {appointments.filter(a => a.status === 'pending').length} bekleyen
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid #e0e0e0', background: '#f9f9f9' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Müşteri adı veya hizmet ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            />
            <div style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#666'
            }}>
              <Icon name="search" size={16} />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'white',
              cursor: 'pointer'
            }}
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
      <div style={{ padding: '24px 32px' }}>
        {filteredAppointments.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#666'
          }}>
            <div style={{ color: '#ccc', marginBottom: '16px' }}>
              <Icon name="calendar" size={48} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Randevu Bulunamadı</h3>
            <p style={{ margin: '0' }}>Arama kriterlerinize uygun randevu bulunmuyor.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} style={{
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '700', color: '#111111' }}>
                      {appointment.customer_name}
                    </h3>
                    <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                      <Icon name="phone" size={14} />
                      <span style={{ marginLeft: '6px' }}>{appointment.customer_phone}</span>
                    </p>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                      <Icon name="mail" size={14} />
                      <span style={{ marginLeft: '6px' }}>{appointment.customer_email}</span>
                    </p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      background: getStatusColor(appointment.status),
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {getStatusText(appointment.status)}
                    </span>
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                      {new Date(appointment.appointment_date).toLocaleDateString('tr-TR')} • {appointment.appointment_time}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#111111' }}>
                    Hizmet Talebi
                  </h4>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                    {appointment.service_description}
                  </p>
                  {appointment.notes && (
                    <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                      Not: {appointment.notes}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  {appointment.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Onayla
                      </button>
                      <button 
                        onClick={() => handleAppointmentAction(appointment.id, 'reject')}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
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
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Tamamlandı Olarak İşaretle
                        </button>
                      ) : (
                        <div style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #f59e0b',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Icon name="clock" size={14} />
                          Randevu saati henüz gelmedi
                        </div>
                      )}
                    </>
                  )}
                  
                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                    <button 
                      onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                      style={{
                        background: 'transparent',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
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