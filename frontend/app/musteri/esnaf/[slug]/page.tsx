'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getAuthToken } from '@/app/utils/api';
import { iconMapping } from '@/app/utils/iconMapping';

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Ana İçerik */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Vendor Header */}
          <div style={{ 
            padding: '32px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            gap: '24px',
            alignItems: 'flex-start'
          }}>
            {/* Profil Fotoğrafı */}
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
                {vendor.user?.avatar ? (
                  <img 
                    src={vendor.user.avatar} 
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
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                margin: '0 0 8px 0',
                color: '#333'
              }}>
                {vendor.display_name}
              </h1>
              
              <p style={{ 
                fontSize: '18px', 
                color: '#666', 
                margin: '0 0 16px 0'
              }}>
                {vendor.business_type} • {vendor.company_title}
              </p>

              {/* İletişim Bilgileri */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {React.createElement(iconMapping['map-pin'], { size: 16, color: '#666' })}
                  <span style={{ fontSize: '14px', color: '#333' }}>
                    {vendor.city}, {vendor.district}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setShowPhone(!showPhone);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {React.createElement(iconMapping.phone, { size: 16, color: '#666' })}
                    <span style={{ fontSize: '14px', color: '#333' }}>
                      {showPhone ? 'Telefon Numarasını Gizle' : 'Telefon Numarasını Göster'}
                    </span>
                  </button>
                </div>
                
                {/* Telefon numarası gösterimi */}
                {showPhone && (
                  <div 
                    style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                      {vendor.business_phone}
                    </span>
                    <button
                      onClick={() => {
                        const phoneNumber = vendor.business_phone;
                        if (phoneNumber) {
                          window.location.href = `tel:${phoneNumber}`;
                        }
                      }}
                      style={{
                        marginLeft: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      Ara
                    </button>
                  </div>
                )}
              </div>

              {/* İletişim Butonları */}
              {(() => {
                // Kullanıcı kendi profiline bakıyor mu kontrol et
                const vendorToken = getAuthToken('vendor');
                const clientToken = getAuthToken('client');
                const isAuthenticated = vendorToken || clientToken;
                
                let isOwnProfile = false;
                let currentUserRole = null;
                
                if (vendorToken) {
                  try {
                    // JWT token'dan user ID'yi decode et
                    const tokenParts = vendorToken.split('.');
                    if (tokenParts.length === 3) {
                      const payload = JSON.parse(atob(tokenParts[1]));
                      const currentUserId = payload.user_id;
                      console.log('DEBUG: Current user ID from token:', currentUserId);
                      console.log('DEBUG: Vendor data:', vendor);
                      
                      // Vendor data'sında user_id var mı kontrol et
                      if (vendor.user_id) {
                        isOwnProfile = currentUserId === vendor.user_id;
                      } else {
                        // Geçici çözüm: email ile karşılaştır
                        const userEmail = getAuthToken('vendor') ? localStorage.getItem('esnaf_email') : null;
                        isOwnProfile = userEmail === vendor.user.email;
                      }
                      
                      currentUserRole = 'vendor';
                    }
                  } catch (e) {
                    console.error('Token decode error:', e);
                  }
                } else if (clientToken) {
                  currentUserRole = 'client';
                }

                console.log('DEBUG: Is own profile:', isOwnProfile);
                console.log('DEBUG: Current user role:', currentUserRole);

                // Kendi profiline bakıyorsa butonları gösterme
                if (isOwnProfile) {
                  return (
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f0f0f0', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#666'
                    }}>
                      Bu sizin kendi profiliniz. Kendinize mesaj gönderemez veya randevu alamazsınız.
                    </div>
                  );
                }

                // Giriş yapılmamışsa butonları gösterme
                if (!isAuthenticated) {
                  return (
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#fff3cd', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#856404',
                      border: '1px solid #ffeaa7'
                    }}>
                      Mesaj göndermek veya randevu almak için giriş yapmanız gerekiyor.
                    </div>
                  );
                }

                // Normal butonları göster
                return (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Teklif Al butonu - sadece client'lar için */}
                    {currentUserRole === 'client' && (
                      <button 
                        onClick={() => {
                          // Teklif alma sayfasına yönlendir (henüz oluşturulmadı)
                          alert('Teklif alma özelliği yakında eklenecek!');
                        }}
                        style={{
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {React.createElement(iconMapping.message, { size: 16 })}
                        Teklif Al
                      </button>
                    )}
                    
                    {/* Randevu butonu - sadece client'lar için */}
                    {currentUserRole === 'client' && (
                      <button 
                        onClick={() => {
                          router.push(`/musteri/esnaf/${slug}/randevu`);
                        }}
                        style={{
                          backgroundColor: '#ffd600',
                          color: '#111111',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {React.createElement(iconMapping.calendar, { size: 16 })}
                        Randevu Al
                      </button>
                    )}
                    
                    {/* Mesaj butonu - hem vendor hem client'lar için */}
                    <button
                      onClick={async () => {
                        if (!vendor) return;
                        
                        try {
                          setCreatingChat(true);
                          if (!vendor.user?.id) {
                            throw new Error('Vendor user ID bulunamadı');
                          }
                          const res = await api.chatCreateConversation(vendor.user.id);
                          const conversation = res.data ?? res;
                          
                          // Role'e göre farklı sayfalara yönlendir
                          if (currentUserRole === 'vendor') {
                            // Esnaf: Müşteri olarak mesaj göndermek için müşteri sayfasına git
                            router.push(`/musteri/mesajlar/${conversation.id}`);
                          } else {
                            // Client: Normal client mesajlar sayfasına git
                            router.push(`/musteri/mesajlar/${conversation.id}`);
                          }
                        } catch (error: any) {
                          console.error('Chat başlatılamadı:', error);
                        } finally {
                          setCreatingChat(false);
                        }
                      }}
                      disabled={creatingChat}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#111111',
                        border: '2px solid #ffd600',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: creatingChat ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {React.createElement(iconMapping.message, { size: 16 })}
                      {creatingChat ? 'Başlatılıyor...' : 'Mesaj Gönder'}
                    </button>
                  </div>
                );
              })()}
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
    </div>
  );
}

export default function VendorDetail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VendorDetailContent />
    </Suspense>
  );
}
