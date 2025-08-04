'use client';

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/app/utils/api";
import { iconMapping } from "@/app/utils/iconMapping";


interface Vendor {
  id: number;
  slug: string;
  user: {
    email: string;
    email_verified: boolean;
  };
  business_type: string;
  company_title: string;
  display_name: string;
  phone: string;
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
                {vendor.avatar ? (
                  <img 
                    src={vendor.avatar} 
                    alt={vendor.display_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  '🏪'
                )}
              </div>
            </div>

            {/* Vendor Bilgileri */}
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                margin: '0 0 8px 0',
                color: '#333'
              }}>
                {vendor.display_name}
              </h1>
              
              {vendor.company_title && (
                <p style={{ 
                  fontSize: '16px', 
                  color: '#666', 
                  margin: '0 0 16px 0' 
                }}>
                  {vendor.company_title}
                </p>
              )}

              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>📍</span>
                  <span style={{ fontSize: '14px', color: '#333' }}>
                    {vendor.city}, {vendor.district}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>📞</span>
                  <span style={{ fontSize: '14px', color: '#333' }}>
                    {vendor.phone}
                  </span>
                </div>
              </div>

              {/* İletişim Butonları */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => router.push(`/musteri/esnaf/${slug}/randevu`)}
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
                  📅 Randevu Al
                </button>
                <button style={{
                  backgroundColor: 'transparent',
                  color: '#111111',
                  border: '2px solid #ffd600',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📞 İletişime Geç
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
                  Uzmanlık Alanları
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {vendor.categories.map((category: any) => (
                    <span key={category.id} style={{
                      backgroundColor: '#e8f4fd',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      color: '#0066cc',
                      border: '1px solid #b3d9ff',
                      fontWeight: '500'
                    }}>
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Adres Bilgileri */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                margin: '0 0 16px 0',
                color: '#333'
              }}>
                Adres Bilgileri
              </h3>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <p style={{ 
                  fontSize: '16px', 
                  lineHeight: '1.6', 
                  color: '#333',
                  margin: 0
                }}>
                  <strong>Şehir:</strong> {vendor.city}<br />
                  <strong>İlçe:</strong> {vendor.district}<br />
                  {vendor.subdistrict && (
                    <>
                      <strong>Mahalle:</strong> {vendor.subdistrict}<br />
                    </>
                  )}
                  <strong>Adres:</strong> {vendor.address}
                </p>
              </div>
            </div>



            {/* Çalışma Saatleri */}
            {vendor.working_hours && Object.keys(vendor.working_hours).length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {React.createElement(iconMapping.clock, { 
                    size: 24, 
                    color: '#666'
                  })}
                  Çalışma Saatleri
                </h3>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {Object.entries(vendor.working_hours).map(([day, hours]) => (
                      <div key={day} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid #e9ecef'
                      }}>
                        <span style={{ 
                          fontSize: '16px', 
                          fontWeight: '500',
                          color: '#333',
                          minWidth: '100px'
                        }}>
                          {day === 'monday' && 'Pazartesi'}
                          {day === 'tuesday' && 'Salı'}
                          {day === 'wednesday' && 'Çarşamba'}
                          {day === 'thursday' && 'Perşembe'}
                          {day === 'friday' && 'Cuma'}
                          {day === 'saturday' && 'Cumartesi'}
                          {day === 'sunday' && 'Pazar'}
                        </span>
                        <span style={{ 
                          fontSize: '16px', 
                          color: hours.closed ? '#dc3545' : '#28a745',
                          fontWeight: '500'
                        }}>
                          {hours.closed ? 'Kapalı' : `${hours.open} - ${hours.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sosyal Medya */}
            {vendor.social_media && 
             (vendor.social_media.instagram || vendor.social_media.facebook || vendor.social_media.twitter || vendor.social_media.website) && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {React.createElement(iconMapping.globe, { 
                    size: 24, 
                    color: '#666'
                  })}
                  Sosyal Medya
                </h3>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {vendor.social_media.instagram && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              </div>
            )}

            {/* İletişim Bilgileri */}
            <div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                margin: '0 0 16px 0',
                color: '#333'
              }}>
                İletişim Bilgileri
              </h3>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <p style={{ 
                  fontSize: '16px', 
                  lineHeight: '1.6', 
                  color: '#333',
                  margin: 0
                }}>
                  <strong>Telefon:</strong> {vendor.phone}<br />
                  <strong>E-posta:</strong> {vendor.user.email}
                </p>
              </div>
            </div>
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