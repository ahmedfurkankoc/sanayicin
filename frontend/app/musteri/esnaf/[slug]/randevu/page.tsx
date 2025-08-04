'use client';

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/app/utils/api";
import { toast } from "sonner";

interface Vendor {
  id: number;
  slug: string;
  display_name: string;
  phone: string;
  working_hours?: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
}

interface AppointmentForm {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_description: string;
  appointment_date: string;
  appointment_time: string;
  notes: string;
}

export default function CustomerAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<AppointmentForm>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    service_description: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  });

  // Vendor bilgilerini çek
  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    api.getVendorDetail(slug)
      .then((res: any) => {
        setVendor(res.data);
        setError("");
      })
      .catch((err: any) => {
        setError("Esnaf bulunamadı");
        console.error("Vendor detay hatası:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendor) return;

    // Form validasyonu
    if (!formData.customer_name.trim()) {
      toast.error('Adınızı giriniz');
      return;
    }
    if (!formData.customer_phone.trim()) {
      toast.error('Telefon numaranızı giriniz');
      return;
    }
    if (!formData.customer_email.trim()) {
      toast.error('E-posta adresinizi giriniz');
      return;
    }
    if (!formData.service_description.trim()) {
      toast.error('Hizmet açıklamasını giriniz');
      return;
    }
    if (!formData.appointment_date) {
      toast.error('Tarih seçiniz');
      return;
    }
    if (!formData.appointment_time) {
      toast.error('Saat seçiniz');
      return;
    }

    setSubmitting(true);
    
    try {
      await api.createAppointment(formData, vendor.slug);
      toast.success('Randevu talebiniz başarıyla oluşturuldu!');
      router.push(`/musteri/esnaf/${slug}`);
    } catch (error: any) {
      console.error('Randevu oluşturma hatası:', error);
      toast.error(error.response?.data?.detail || 'Randevu oluşturulurken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableTimes = () => {
    if (!vendor?.working_hours) return [];
    
    const selectedDate = new Date(formData.appointment_date);
    const dayOfWeek = selectedDate.getDay();
    
    // Gün adını al
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    const dayHours = vendor.working_hours[dayName];
    if (!dayHours || dayHours.closed) return [];
    
    const times = [];
    const start = new Date(`2000-01-01 ${dayHours.open}`);
    const end = new Date(`2000-01-01 ${dayHours.close}`);
    
    // Bugün seçilmişse ve şu anki saat geçmişse, o saatleri gösterme
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Esnafın çalışma saatleri aralığında 30 dakikalık aralıklarla saatler oluştur
    while (start < end) {
      const timeString = start.toTimeString().slice(0, 5);
      
      // Bugünse ve saat geçmişse, o saati ekleme
      if (!isToday || timeString > currentTime) {
        times.push(timeString);
      }
      
      start.setMinutes(start.getMinutes() + 30);
    }
    
    return times;
  };

  const isDateDisabled = (date: string) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Geçmiş tarihleri devre dışı bırak
    return selectedDate < today;
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Yükleniyor...</div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>{error || 'Esnaf bulunamadı'}</div>
        <button 
          onClick={() => router.back()}
          style={{
            backgroundColor: '#ffd600',
            color: '#111111',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e0e0e0',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div 
            onClick={() => router.push('/')}
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ffd600',
              cursor: 'pointer'
            }}
          >
            Sanayicin
          </div>
        </div>
        
        <button 
          onClick={() => router.back()}
          style={{
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ddd',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
          ← Geri Dön
        </button>
      </header>

      {/* Ana İçerik */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '32px',
            borderBottom: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              margin: '0 0 8px 0',
              color: '#333'
            }}>
              Randevu Talebi
            </h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#666', 
              margin: '0' 
            }}>
              {vendor.display_name} ile randevu oluşturun
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Müşteri Bilgileri */}
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0',
                  color: '#333'
                }}>
                  Kişisel Bilgiler
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: '#333'
                    }}>
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                      placeholder="Adınız ve soyadınız"
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: '#333'
                    }}>
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                      placeholder="+90 5XX XXX XX XX"
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: '#333'
                    }}>
                      E-posta *
                    </label>
                    <input
                      type="email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Hizmet Bilgileri */}
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0',
                  color: '#333'
                }}>
                  Hizmet Bilgileri
                </h3>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Hizmet Açıklaması *
                  </label>
                  <textarea
                    name="service_description"
                    value={formData.service_description}
                    onChange={handleInputChange}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      resize: 'vertical'
                    }}
                    placeholder="İhtiyacınız olan hizmeti detaylı olarak açıklayın..."
                  />
                </div>
              </div>

              {/* Randevu Bilgileri */}
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0',
                  color: '#333'
                }}>
                  Randevu Bilgileri
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: '#333'
                    }}>
                      Tarih *
                    </label>
                    <input
                      type="date"
                      name="appointment_date"
                      value={formData.appointment_date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: '#333'
                    }}>
                      Saat *
                    </label>
                    <select
                      name="appointment_time"
                      value={formData.appointment_time}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="">Saat seçin</option>
                      {formData.appointment_date && getAvailableTimes().map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    {formData.appointment_date && getAvailableTimes().length === 0 && (
                      <p style={{ 
                        margin: '8px 0 0 0', 
                        color: '#ef4444', 
                        fontSize: '14px' 
                      }}>
                        Bu tarihte müsait saat bulunmuyor. Esnafın çalışma saatlerini kontrol edin.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: '#333'
                    }}>
                      Notlar
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '16px',
                        resize: 'vertical'
                      }}
                      placeholder="Ek bilgiler, özel istekler..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                justifyContent: 'flex-end',
                paddingTop: '24px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#666',
                    border: '1px solid #e0e0e0',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: submitting ? '#ccc' : '#ffd600',
                    color: '#111111',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  {submitting ? 'Gönderiliyor...' : 'Randevu Talebi Oluştur'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 