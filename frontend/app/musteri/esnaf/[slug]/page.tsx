'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getAuthToken } from '@/app/utils/api';
import { iconMapping } from '@/app/utils/iconMapping';
import { useMusteri } from '../../context/MusteriContext';

interface Vendor {
  id: number;
  slug: string;
  user: {
    id: number;
    email: string;
    is_verified: boolean;
    avatar?: string;
  };
  user_id?: number; // Backend'den gelmesi gereken field
  business_type: string;
  company_title: string;
  display_name: string;
  business_phone: string; // phone yerine business_phone
  city: string;
  district: string;
  subdistrict: string;
  address: string;
  about?: string;
  // Yeni: mağaza logosu
  store_logo?: string | null;
  profile_photo?: string;
  avatar?: string;
  service_areas?: any[];
  categories?: any[];
  social_media?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
  working_hours?: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
}

function VendorDetailContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { isAuthenticated, user } = useMusteri();
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [creatingChat, setCreatingChat] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  // Hizmet alanlarını ve kategorileri çek
  useEffect(() => {
    Promise.all([
      api.getServiceAreas().then(res => res.data),
      api.getCategories().then(res => res.data)
    ]).then(([servicesData, categoriesData]) => {
      setServices(servicesData);
      setCategories(categoriesData);
    }).catch(() => {
      setServices([]);
      setCategories([]);
    });
  }, []);

  // Vendor detaylarını çek
  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    api.getVendorDetail(slug)
      .then((res: any) => {
        setVendor(res.data);
        setError("");
      })
      .catch((err: any) => {
        setError("Vendor bulunamadı");
        console.error("Vendor detay hatası:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  const handleAppointment = () => {
    if (!vendor) return;
    router.push(`/musteri/esnaf/${vendor.slug}/randevu`);
  };

  const handleQuote = async () => {
    if (!vendor || creatingChat) return;
    try {
      setCreatingChat(true);
      const res = await api.chatCreateConversation(vendor.user.id);
      const conversationId = res?.data?.id;
      if (conversationId) {
        // İlk mesajı gönder: Teklif talebi
        try {
          await api.chatSendMessageREST(conversationId, 'Merhaba, hizmetiniz için teklif almak istiyorum.');
        } catch (_) {}
        router.push(`/musteri/mesajlar/${conversationId}`);
      }
    } catch (e) {
      console.error('Teklif akışı başlatılamadı:', e);
    } finally {
      setCreatingChat(false);
    }
  };

  const handleMessage = async () => {
    if (!vendor || creatingChat) return;
    try {
      setCreatingChat(true);
      const res = await api.chatCreateConversation(vendor.user.id);
      const conversationId = res?.data?.id;
      if (conversationId) {
        router.push(`/musteri/mesajlar/${conversationId}`);
      }
    } catch (e) {
      console.error('Mesaj başlatılamadı:', e);
    } finally {
      setCreatingChat(false);
    }
  };

  const handlePhoneButton = () => {
    if (!vendor) return;
    if (!showPhone) {
      setShowPhone(true);
    } else {
      const sanitized = (vendor.business_phone || '').replace(/[^\d+]/g, '');
      if (sanitized) {
        window.location.href = `tel:${sanitized}`;
      }
    }
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
        <div style={{ fontSize: '18px', color: '#666' }}>{error || 'Vendor bulunamadı'}</div>
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

  const logoUrl = vendor.store_logo || vendor.user?.avatar || null;

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        margin: '24px auto',
        maxWidth: '1100px'
      }}>
        {/* Header */}
        <div style={{
          padding: '32px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start'
        }}>
          {/* Logo / Avatar */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '12px',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: '#ccc',
              overflow: 'hidden'
            }}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={logoUrl} 
                  alt={vendor.display_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#666'
                }}>
                  {vendor.display_name ? vendor.display_name.charAt(0).toUpperCase() :
                   vendor.company_title ? vendor.company_title.charAt(0).toUpperCase() : 'E'}
                </span>
              )}
            </div>
          </div>

          {/* Vendor Bilgileri */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                margin: 0,
                color: '#333'
              }}>
                {vendor.display_name}
              </h1>
              {vendor.user?.is_verified && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {React.createElement(iconMapping.check, { size: 14 })}
                  Doğrulanmış
                </div>
              )}
            </div>
            <p style={{ fontSize: '18px', color: '#666', margin: '0 0 16px 0' }}>
              {vendor.business_type} • {vendor.company_title}
            </p>

            {/* Aksiyonlar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button
                onClick={handlePhoneButton}
                style={{
                  backgroundColor: showPhone ? '#10b981' : '#fff8cc',
                  color: showPhone ? '#ffffff' : '#111111',
                  border: showPhone ? '1px solid #0ea5a4' : '1px solid #ffe066',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {React.createElement(iconMapping.phone, { size: 18, color: showPhone ? '#ffffff' : undefined })}
                {showPhone ? (vendor.business_phone || 'Telefon') : 'Telefonu Göster'}
              </button>
              <button
                onClick={handleAppointment}
                style={{
                  backgroundColor: '#ffd600',
                  color: '#111111',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {React.createElement(iconMapping.calendar, { size: 18 })}
                Randevu Al
              </button>
              <button
                onClick={handleQuote}
                disabled={creatingChat}
                style={{
                  backgroundColor: '#111111',
                  color: '#ffd600',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: creatingChat ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: creatingChat ? 0.8 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {React.createElement(iconMapping.file, { size: 18 })}
                {creatingChat ? 'İşleniyor...' : 'Teklif Al'}
              </button>
              <button
                onClick={handleMessage}
                disabled={creatingChat}
                style={{
                  backgroundColor: '#f0f0f0',
                  color: '#111111',
                  border: '1px solid #e0e0e0',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: creatingChat ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: creatingChat ? 0.8 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {React.createElement(iconMapping.message, { size: 18 })}
                {creatingChat ? 'İşleniyor...' : 'Mesaj Gönder'}
              </button>
            </div>

          </div>
        </div>
        {/* Detaylı Bilgiler */}
        <div style={{ padding: '32px' }}>
          {/* Hakkında */}
          {vendor.about && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                margin: '0 0 16px 0',
                color: '#333'
              }}>
                Hakkında
              </h3>
              <p style={{ 
                fontSize: '16px', 
                lineHeight: '1.6', 
                color: '#666',
                margin: 0
              }}>
                {vendor.about}
              </p>
            </div>
          )}

          {/* Hizmet Alanları */}
          {vendor.service_areas && vendor.service_areas.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                margin: '0 0 16px 0',
                color: '#333'
              }}>
                Hizmet Alanları
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {vendor.service_areas.map((service: any) => (
                  <span key={service.id} style={{
                    backgroundColor: '#f0f0f0',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    color: '#333',
                    fontWeight: '500'
                  }}>
                    {service.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Kategoriler */}
          {vendor.categories && vendor.categories.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                margin: '0 0 16px 0',
                color: '#333'
              }}>
                Kategoriler
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {vendor.categories.map((category: any) => (
                  <span key={category.id} style={{
                    backgroundColor: '#e3f2fd',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    color: '#1976d2',
                    fontWeight: '500'
                  }}>
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sosyal Medya */}
          {vendor.social_media && (
            vendor.social_media.instagram || 
            vendor.social_media.facebook || 
            vendor.social_media.twitter || 
            vendor.social_media.website
          ) && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                margin: '0 0 16px 0',
                color: '#333'
              }}>
                Sosyal Medya
              </h3>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                {vendor.social_media.instagram && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    {React.createElement(iconMapping.instagram, { 
                      size: 20, 
                      color: '#E4405F',
                      style: { flexShrink: 0 }
                    })}
                    <span style={{ fontSize: '16px', color: '#333', fontWeight: '500', minWidth: '80px' }}>
                      Instagram:
                    </span>
                    <a 
                      href={vendor.social_media.instagram.startsWith('http') ? vendor.social_media.instagram : `https://instagram.com/${vendor.social_media.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#0066cc',
                        textDecoration: 'none',
                        fontSize: '16px',
                        wordBreak: 'break-all'
                      }}
                    >
                      {vendor.social_media.instagram}
                    </a>
                  </div>
                )}
                
                {vendor.social_media.facebook && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    {React.createElement(iconMapping.facebook, { 
                      size: 20, 
                      color: '#1877F2',
                      style: { flexShrink: 0 }
                    })}
                    <span style={{ fontSize: '16px', color: '#333', fontWeight: '500', minWidth: '80px' }}>
                      Facebook:
                    </span>
                    <a 
                      href={vendor.social_media.facebook.startsWith('http') ? vendor.social_media.facebook : `https://facebook.com/${vendor.social_media.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#0066cc',
                        textDecoration: 'none',
                        fontSize: '16px',
                        wordBreak: 'break-all'
                      }}
                    >
                      {vendor.social_media.facebook}
                    </a>
                  </div>
                )}
                
                {vendor.social_media.twitter && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    {React.createElement(iconMapping.twitter, { 
                      size: 20, 
                      color: '#1DA1F2',
                      style: { flexShrink: 0 }
                    })}
                    <span style={{ fontSize: '16px', color: '#333', fontWeight: '500', minWidth: '80px' }}>
                      Twitter:
                    </span>
                    <a 
                      href={vendor.social_media.twitter.startsWith('http') ? vendor.social_media.twitter : `https://twitter.com/${vendor.social_media.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#0066cc',
                        textDecoration: 'none',
                        fontSize: '16px',
                        wordBreak: 'break-all'
                      }}
                    >
                      {vendor.social_media.twitter}
                    </a>
                  </div>
                )}
                
                {vendor.social_media.website && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    {React.createElement(iconMapping.globe, { 
                      size: 20, 
                      color: '#0066cc',
                      style: { flexShrink: 0 }
                    })}
                    <span style={{ fontSize: '16px', color: '#333', fontWeight: '500', minWidth: '80px' }}>
                      Web Sitesi:
                    </span>
                    <a 
                      href={vendor.social_media.website.startsWith('http') ? vendor.social_media.website : `https://${vendor.social_media.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#0066cc',
                        textDecoration: 'none',
                        fontSize: '16px',
                        wordBreak: 'break-all'
                      }}
                    >
                      {vendor.social_media.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}

export default function VendorDetailPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <VendorDetailContent />
    </Suspense>
  );
}
