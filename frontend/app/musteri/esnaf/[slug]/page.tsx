'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getAuthToken, resolveMediaUrl } from '@/app/utils/api';
import { iconMapping } from '@/app/utils/iconMapping';
import { useMusteri } from '../../context/MusteriContext';
import { toast } from "sonner";
import ReviewModal from '../../components/ReviewModal';
import QuoteRequestModal from '@/app/musteri/components/QuoteRequestModal';
import Reviews from '../../components/Reviews';
import VendorLocationMap from '@/app/components/VendorLocationMap';

interface VendorImage {
  id: number;
  image: string;
  image_url: string;
  description: string;
  order: number;
  created_at: string;
  updated_at: string;
}

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
  company_title: string;
  display_name: string;
  business_phone: string; // phone yerine business_phone
  city: string;
  district: string;
  subdistrict: string;
  address: string;
  latitude?: number;
  longitude?: number;
  about?: string;
  // Logo artık avatar üzerinden gösterilir
  profile_photo?: string;
  avatar?: string;
  service_areas?: any[];
  categories?: any[];
  car_brands?: Array<{
    id: number;
    name: string;
    logo?: string;
    logo_url?: string;
    description?: string;
    is_active: boolean;
  }>;
  gallery_images?: VendorImage[];
  social_media?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
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
  
  // Kullanıcının kendi profilini görüntüleyip görüntülemediğini kontrol et
  const isOwnProfile = vendor ? user?.id === vendor.user?.id : false;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [creatingChat, setCreatingChat] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // currentImageIndex sınırlarını kontrol et
  useEffect(() => {
    if (vendor?.gallery_images && vendor.gallery_images.length > 0) {
      if (currentImageIndex >= vendor.gallery_images.length) {
        setCurrentImageIndex(0);
      }
    }
  }, [vendor?.gallery_images, currentImageIndex]);

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

  // Vendor detaylarını ve değerlendirmeleri çek
  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    Promise.all([
      api.getVendorDetail(slug),
      api.getVendorReviews(slug)
    ])
      .then(([vendorRes, reviewsRes]: any) => {
        setVendor(vendorRes.data);
        // Reviews yanıtını normalize et (düz liste veya sayfalı { results, count })
        const payload = reviewsRes?.data ?? reviewsRes;
        const list: any[] = Array.isArray(payload)
          ? payload
          : (Array.isArray(payload?.results) ? payload.results : []);
        setReviews(list);

        // Ortalama puanı ve toplam değerlendirme sayısını hesapla
        const total: number = (typeof payload?.count === 'number') ? payload.count : list.length;
        const average: number = list.length > 0
          ? list.reduce((acc: number, curr: any) => acc + (Number(curr?.rating) || 0), 0) / list.length
          : 0;

        setTotalReviews(total);
        setAverageRating(average);
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

  // View analytics: owner değilse sayfa yüklenince kaydet
  useEffect(() => {
    if (!vendor) return;
    const isOwner = user?.id && vendor.user?.id && user.id === vendor.user.id;
    if (!isOwner) {
      try { api.vendorTrackView(vendor.slug); } catch {}
    }
  }, [vendor, user?.id]);

  const handleAppointment = () => {
    if (!vendor) return;
    router.push(`/musteri/esnaf/${vendor.slug}/randevu`);
  };

  const handleQuote = () => {
    if (!vendor) return;
    if (!isAuthenticated) {
      toast.error('Teklif talebi için giriş yapmalısınız.', {
        description: 'Üye girişi yaptıktan sonra talep oluşturabilirsiniz.',
        action: { label: 'Giriş Yap', onClick: () => router.push('/musteri/giris') }
      });
      return;
    }
    setShowQuoteModal(true);
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
      try { api.vendorTrackCall(vendor.slug, vendor.business_phone || ''); } catch {}
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

  const logoUrl = vendor.user?.avatar || vendor.avatar || null;

  return (
    <div className="m-vendor-page">
      <div className="m-vendor-modern-profile">
        {/* Modern Header */}
        <div className="m-vendor-hero">
          <div className="m-vendor-hero-content">
            <div className="m-vendor-avatar-section">
          <div className="m-vendor-logo-wrap">
            <div className="m-vendor-logo">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={logoUrl} 
                  alt={vendor.display_name}
                />
              ) : (
                    <span>
                  {vendor.display_name ? vendor.display_name.charAt(0).toUpperCase() :
                   vendor.company_title ? vendor.company_title.charAt(0).toUpperCase() : 'E'}
                </span>
              )}
            </div>
                {/* Social Media Links - Desktop'ta avatar altında küçük */}
                {vendor.social_media && (
                  vendor.social_media.instagram || 
                  vendor.social_media.facebook || 
                  vendor.social_media.twitter || 
                  vendor.social_media.youtube ||
                  vendor.social_media.tiktok ||
                  vendor.social_media.website
                ) && (
                  <div className="m-vendor-social-links m-vendor-social-links-small m-vendor-social-desktop">
                    {vendor.social_media.instagram && (
                      <a 
                        href={vendor.social_media.instagram.startsWith('http') ? vendor.social_media.instagram : `https://instagram.com/${vendor.social_media.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="m-vendor-social-link instagram"
                      >
                        {React.createElement(iconMapping.instagram, { size: 16, color: 'white' })}
                      </a>
                    )}
                    {vendor.social_media.facebook && (
                      <a 
                        href={vendor.social_media.facebook.startsWith('http') ? vendor.social_media.facebook : `https://facebook.com/${vendor.social_media.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="m-vendor-social-link facebook"
                      >
                        {React.createElement(iconMapping.facebook, { size: 16, color: 'white' })}
                      </a>
                    )}
                    {vendor.social_media.twitter && (
                      <a 
                        href={vendor.social_media.twitter.startsWith('http') ? vendor.social_media.twitter : `https://x.com/${vendor.social_media.twitter.replace('https://twitter.com/', '').replace('twitter.com/', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="m-vendor-social-link twitter"
                      >
                        {React.createElement(iconMapping['twitter-x'], { size: 16, color: 'white' })}
                      </a>
                    )}
                    {vendor.social_media.youtube && (
                      <a 
                        href={vendor.social_media.youtube.startsWith('http') ? vendor.social_media.youtube : `https://youtube.com/${vendor.social_media.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="m-vendor-social-link youtube"
                      >
                        {React.createElement(iconMapping.youtube, { size: 16, color: 'white' })}
                      </a>
                    )}
                    {vendor.social_media.tiktok && (
                      <a 
                        href={vendor.social_media.tiktok.startsWith('http') ? vendor.social_media.tiktok : `https://tiktok.com/@${vendor.social_media.tiktok.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="m-vendor-social-link tiktok"
                      >
                        {React.createElement(iconMapping.tiktok, { size: 16, color: 'white' })}
                      </a>
                    )}
                    {vendor.social_media.website && (
                      <a 
                        href={vendor.social_media.website.startsWith('http') ? vendor.social_media.website : `https://${vendor.social_media.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="m-vendor-social-link website"
                      >
                        {React.createElement(iconMapping.globe, { size: 16, color: 'white' })}
                      </a>
                    )}
                  </div>
                )}
          </div>
          <div className="m-vendor-body">
            <div className="m-vendor-title-row">
              <h1 className="m-vendor-title">
                {vendor.display_name}
              </h1>
              {vendor.user?.is_verified && (
                <div className="m-vendor-verified">
                  {React.createElement(iconMapping.check, { size: 14 })}
                  Doğrulanmış
                </div>
              )}
            </div>
                <div className="m-vendor-location">
                  {React.createElement(iconMapping['map-pin'], { size: 16 })}
                  <span>
                    {vendor.district && vendor.city 
                      ? `${vendor.district}, ${vendor.city}` 
                      : vendor.city || "Konum belirtilmemiş"
                    }
                  </span>
                </div>
              </div>
              {/* Social Media Links - Mobilde body'nin altında */}
              {vendor.social_media && (
                vendor.social_media.instagram || 
                vendor.social_media.facebook || 
                vendor.social_media.twitter || 
                vendor.social_media.youtube ||
                vendor.social_media.tiktok ||
                vendor.social_media.website
              ) && (
                <div className="m-vendor-social-links m-vendor-social-links-small m-vendor-social-mobile">
                  {vendor.social_media.instagram && (
                    <a 
                      href={vendor.social_media.instagram.startsWith('http') ? vendor.social_media.instagram : `https://instagram.com/${vendor.social_media.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="m-vendor-social-link instagram"
                    >
                      {React.createElement(iconMapping.instagram, { size: 16, color: 'white' })}
                    </a>
                  )}
                  {vendor.social_media.facebook && (
                    <a 
                      href={vendor.social_media.facebook.startsWith('http') ? vendor.social_media.facebook : `https://facebook.com/${vendor.social_media.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="m-vendor-social-link facebook"
                    >
                      {React.createElement(iconMapping.facebook, { size: 16, color: 'white' })}
                    </a>
                  )}
                  {vendor.social_media.twitter && (
                    <a 
                      href={vendor.social_media.twitter.startsWith('http') ? vendor.social_media.twitter : `https://x.com/${vendor.social_media.twitter.replace('https://twitter.com/', '').replace('twitter.com/', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="m-vendor-social-link twitter"
                    >
                      {React.createElement(iconMapping['twitter-x'], { size: 16, color: 'white' })}
                    </a>
                  )}
                  {vendor.social_media.youtube && (
                    <a 
                      href={vendor.social_media.youtube.startsWith('http') ? vendor.social_media.youtube : `https://youtube.com/${vendor.social_media.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="m-vendor-social-link youtube"
                    >
                      {React.createElement(iconMapping.youtube, { size: 16, color: 'white' })}
                    </a>
                  )}
                  {vendor.social_media.tiktok && (
                    <a 
                      href={vendor.social_media.tiktok.startsWith('http') ? vendor.social_media.tiktok : `https://tiktok.com/@${vendor.social_media.tiktok.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="m-vendor-social-link tiktok"
                    >
                      {React.createElement(iconMapping.tiktok, { size: 16, color: 'white' })}
                    </a>
                  )}
                  {vendor.social_media.website && (
                    <a 
                      href={vendor.social_media.website.startsWith('http') ? vendor.social_media.website : `https://${vendor.social_media.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="m-vendor-social-link website"
                    >
                      {React.createElement(iconMapping.globe, { size: 16, color: 'white' })}
                    </a>
                  )}
                </div>
              )}
            </div>
            
            {/* Sağ Taraf: Aksiyonlar */}
            {!isOwnProfile && (
              <div className="m-vendor-right-section">
              <div className="m-vendor-actions">
                <button
                  onClick={handlePhoneButton}
                  className={`m-btn m-btn-phone ${showPhone ? 'active' : ''}`}
                >
                    {React.createElement(iconMapping.phone, { size: 18 })}
                  {showPhone ? (vendor.business_phone || 'Telefon') : 'Telefonu Göster'}
                </button>
                <button
                  onClick={handleAppointment}
                  className="m-btn m-btn-apt"
                >
                  {React.createElement(iconMapping.calendar, { size: 18 })}
                  Randevu Al
                </button>
                <button
                  onClick={handleQuote}
                  disabled={creatingChat}
                  className="m-btn m-btn-quote"
                >
                  {React.createElement(iconMapping.file, { size: 18 })}
                  {creatingChat ? 'İşleniyor...' : 'Teklif Al'}
                </button>
                <button
                  onClick={handleMessage}
                  disabled={creatingChat}
                  className="m-btn m-btn-msg"
                >
                  {React.createElement(iconMapping.message, { size: 18 })}
                  {creatingChat ? 'İşleniyor...' : 'Mesaj Gönder'}
                </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="m-vendor-main">
          <div className="m-vendor-sidebar">
          {/* Hizmet Alanları */}
          {vendor.service_areas && vendor.service_areas.length > 0 && (
              <div className="m-vendor-card">
              <h3 className="m-vendor-section-title">
                Hizmet Alanları
              </h3>
              <div className="m-chip-row">
                {vendor.service_areas.map((service: any) => (
                  <span key={service.id} className="m-chip">
                    {service.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Kategoriler */}
          {vendor.categories && vendor.categories.length > 0 && (
              <div className="m-vendor-card">
              <h3 className="m-vendor-section-title">
                Kategoriler
              </h3>
              <div className="m-chip-row">
                {vendor.categories.map((category: any) => (
                  <span key={category.id} className="m-chip blue">
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          )}

            {/* Araba Markaları */}
            {vendor.car_brands && vendor.car_brands.length > 0 && (
              <div className="m-vendor-card">
              <h3 className="m-vendor-section-title">
                  Araba Markaları
              </h3>
                <div className="m-car-brands-grid">
                  {vendor.car_brands.map((brand: any) => (
                    <div key={brand.id} className="m-car-brand-item">
                      {(brand.logo || brand.logo_url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={brand.logo_url || resolveMediaUrl(brand.logo)}
                          alt={brand.name}
                          className="m-car-brand-logo"
                          onError={(e) => {
                            // Logo yüklenemezse sadece ismi göster
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.classList.add('no-logo');
                            }
                          }}
                        />
                      ) : null}
                      <span className="m-car-brand-name">{brand.name}</span>
                    </div>
                  ))}
                </div>
                  </div>
                )}
                
            {/* Galeri Görselleri */}
            {vendor.gallery_images && vendor.gallery_images.length > 0 && (
              <div className="m-vendor-card">
                <h3 className="m-vendor-section-title">
                  İşletme Görselleri
                </h3>
                <div style={{ position: 'relative' }}>
                  {/* Slider Container */}
                  <div style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    width: '100%',
                    aspectRatio: '1'
                  }}>
                    <div style={{
                      display: 'flex',
                      transform: `translateX(-${currentImageIndex * 100}%)`,
                      transition: 'transform 0.3s ease',
                      height: '100%'
                    }}>
                      {vendor.gallery_images.map((img, index) => (
                        <div
                          key={img.id}
                          style={{
                            minWidth: '100%',
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                            flexShrink: 0,
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setCurrentImageIndex(index);
                            setShowLightbox(true);
                          }}
                        >
                          <img
                            src={img.image_url || img.image}
                            alt={img.description || 'Galeri görseli'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                            onError={(e) => {
                              console.error('Görsel yüklenemedi:', img);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                  </div>

                    {/* Navigation Buttons */}
                    {vendor.gallery_images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) => 
                              prev === 0 ? vendor.gallery_images!.length - 1 : prev - 1
                            );
                          }}
                          style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            zIndex: 2
                          }}
                        >
                          {React.createElement(iconMapping['chevron-left'], { size: 16 })}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) => 
                              prev === vendor.gallery_images!.length - 1 ? 0 : prev + 1
                            );
                          }}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            zIndex: 2
                          }}
                        >
                          {React.createElement(iconMapping['chevron-right'], { size: 16 })}
                        </button>
                      </>
                    )}

                    {/* Dots Indicator */}
                    {vendor.gallery_images.length > 1 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '12px'
                      }}>
                        {vendor.gallery_images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              border: 'none',
                              backgroundColor: index === currentImageIndex ? 'var(--yellow)' : '#ddd',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              padding: 0
                            }}
                            aria-label={`Görsel ${index + 1}`}
                          />
                        ))}
                  </div>
                )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="m-vendor-content">
            {/* Detaylı Bilgiler */}
            <div className="m-vendor-sections">
              {/* Hakkında */}
              {vendor.about && (
                <div className="m-vendor-card">
                  <h3 className="m-vendor-section-title">
                    Hakkında
                  </h3>
                  <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#4a5568', margin: 0 }}>
                    {vendor.about}
                  </p>
            </div>
          )}

          {/* Konum */}
              <div className="m-vendor-card">
            <h3 className="m-vendor-section-title">
              Konum
            </h3>
            
            {/* Konum Bilgileri */}
            <div className="m-location-info">
              <div className="m-location-details">
                <div className="m-location-item">
                  <span className="m-location-label">Adres:</span>
                  <span className="m-location-value">
                    {vendor.address || `${vendor.subdistrict ? vendor.subdistrict + ', ' : ''}${vendor.district}, ${vendor.city}`}
                  </span>
                </div>
                <div className="m-location-item">
                  <span className="m-location-label">İl:</span>
                  <span className="m-location-value">{vendor.city}</span>
                </div>
                <div className="m-location-item">
                  <span className="m-location-label">İlçe:</span>
                  <span className="m-location-value">{vendor.district}</span>
                </div>
                {vendor.subdistrict && (
                  <div className="m-location-item">
                    <span className="m-location-label">Mahalle:</span>
                    <span className="m-location-value">{vendor.subdistrict}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Konum Haritası */}
            <VendorLocationMap
              vendor={{
                slug: vendor.slug,
                display_name: vendor.display_name,
                company_title: vendor.company_title,
                city: vendor.city,
                district: vendor.district,
                subdistrict: vendor.subdistrict,
                address: vendor.address,
                business_phone: vendor.business_phone,
                avatar: vendor.user?.avatar
              }}
              latitude={vendor.latitude}
              longitude={vendor.longitude}
              height="300px"
              showNearbyVendors={true}
            />
          </div>
            </div>
          </div>
          </div>

        {/* Değerlendirmeler - Sayfanın En Altında */}
        <div className="m-vendor-card m-reviews-section">
          <Reviews
            reviews={reviews}
            averageRating={averageRating}
            totalReviews={totalReviews}
            onReview={() => {
              // Kendi profilini değerlendiremez
              if (isOwnProfile) {
                toast.error("Kendi profilinizi değerlendiremezsiniz.", {
                  description: "Sadece diğer esnafları değerlendirebilirsiniz."
                });
                return;
              }
              
              // Giriş yapmamış kullanıcı kontrolü
              if (!isAuthenticated) {
                toast.error("Değerlendirme yapmak için giriş yapmalısınız.", {
                  description: "Üye girişi yaptıktan sonra değerlendirme yapabilirsiniz.",
                  action: {
                    label: "Giriş Yap",
                    onClick: () => router.push("/musteri/giris")
                  }
                });
                return;
              }
              
              setShowReviewModal(true);
            }}
            showReviewButton={!isOwnProfile && isAuthenticated} // Sadece kendi profili değilse ve giriş yapmışsa göster
          />
        </div>
      </div>
      
      {/* Değerlendirme Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        vendorName={vendor.display_name}
        vendorSlug={vendor.slug}
        services={vendor.categories || []}
      />
      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        vendorSlug={vendor.slug}
        services={vendor.categories || []}
      />

      {/* Lightbox Modal */}
      {showLightbox && vendor.gallery_images && vendor.gallery_images.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            cursor: 'pointer'
          }}
          onClick={() => setShowLightbox(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowLightbox(false);
            if (e.key === 'ArrowLeft') {
              setCurrentImageIndex((prev) => 
                prev === 0 ? vendor.gallery_images!.length - 1 : prev - 1
              );
            }
            if (e.key === 'ArrowRight') {
              setCurrentImageIndex((prev) => 
                prev === vendor.gallery_images!.length - 1 ? 0 : prev + 1
              );
            }
          }}
          tabIndex={0}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={vendor.gallery_images[currentImageIndex]?.image_url || vendor.gallery_images[currentImageIndex]?.image}
              alt={vendor.gallery_images[currentImageIndex]?.description || 'Galeri görseli'}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
            
            {/* Close Button */}
            <button
              onClick={() => setShowLightbox(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: 'var(--black)',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>

            {/* Navigation in Lightbox */}
            {vendor.gallery_images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => 
                      prev === 0 ? vendor.gallery_images!.length - 1 : prev - 1
                    );
                  }}
                  style={{
                    position: 'absolute',
                    left: '-50px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  {React.createElement(iconMapping['chevron-left'], { size: 24 })}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => 
                      prev === vendor.gallery_images!.length - 1 ? 0 : prev + 1
                    );
                  }}
                  style={{
                    position: 'absolute',
                    right: '-50px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  {React.createElement(iconMapping['chevron-right'], { size: 24 })}
                </button>
                
                {/* Image Counter */}
                <div style={{
                  position: 'absolute',
                  bottom: '-40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  {currentImageIndex + 1} / {vendor.gallery_images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
