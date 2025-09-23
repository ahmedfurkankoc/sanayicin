'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getAuthToken } from '@/app/utils/api';
import { iconMapping } from '@/app/utils/iconMapping';
import { useMusteri } from '../../context/MusteriContext';
import { toast } from "sonner";
import ReviewModal from '../../components/ReviewModal';
import QuoteRequestModal from '@/app/musteri/components/QuoteRequestModal';
import Reviews from '../../components/Reviews';

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
        setReviews(reviewsRes.data);
        
        // Ortalama puanı ve toplam değerlendirme sayısını hesapla
        const reviewData = reviewsRes.data;
        const total = reviewData.length;
        const average = total > 0 
          ? reviewData.reduce((acc: number, curr: any) => acc + curr.rating, 0) / total 
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

  const logoUrl = vendor.store_logo || vendor.user?.avatar || null;

  return (
    <div className="m-vendor-page">
      <div className="m-vendor-card">
        {/* Header */}
        <div className="m-vendor-header">
          {/* Logo / Avatar */}
          <div className="m-vendor-logo-wrap">
            <div className="m-vendor-logo">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={logoUrl} 
                  alt={vendor.display_name}
                />
              ) : (
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#666' }}>
                  {vendor.display_name ? vendor.display_name.charAt(0).toUpperCase() :
                   vendor.company_title ? vendor.company_title.charAt(0).toUpperCase() : 'E'}
                </span>
              )}
            </div>
          </div>

          {/* Vendor Bilgileri */}
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
            <p className="m-vendor-subtitle">
              {vendor.business_type} • {vendor.company_title}
            </p>

            {/* Aksiyonlar - Kendi profilinde gösterilmez */}
            {!isOwnProfile && (
              <div className="m-vendor-actions">
                <button
                  onClick={handlePhoneButton}
                  className={`m-btn m-btn-phone ${showPhone ? 'active' : ''}`}
                >
                  {React.createElement(iconMapping.phone, { size: 18, color: showPhone ? '#ffffff' : undefined })}
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
            )}

          </div>
        </div>
        {/* Detaylı Bilgiler */}
        <div className="m-vendor-sections">
          {/* Hakkında */}
          {vendor.about && (
            <div className="m-vendor-section">
              <h3 className="m-vendor-section-title">
                Hakkında
              </h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#666', margin: 0 }}>
                {vendor.about}
              </p>
            </div>
          )}

          {/* Hizmet Alanları */}
          {vendor.service_areas && vendor.service_areas.length > 0 && (
            <div className="m-vendor-section">
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
            <div className="m-vendor-section">
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

          {/* Sosyal Medya */}
          {vendor.social_media && (
            vendor.social_media.instagram || 
            vendor.social_media.facebook || 
            vendor.social_media.twitter || 
            vendor.social_media.website
          ) && (
            <div className="m-vendor-section">
              <h3 className="m-vendor-section-title">
                Sosyal Medya
              </h3>
              <div className="m-social-box">
                {vendor.social_media.instagram && (
                  <div className="m-social-row">
                    {React.createElement(iconMapping.instagram, { 
                      size: 20, 
                      color: '#E4405F',
                      style: { flexShrink: 0 }
                    })}
                    <span className="m-social-label">
                      Instagram:
                    </span>
                    <a 
                      href={vendor.social_media.instagram.startsWith('http') ? vendor.social_media.instagram : `https://instagram.com/${vendor.social_media.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="m-link"
                    >
                      {vendor.social_media.instagram}
                    </a>
                  </div>
                )}
                
                {vendor.social_media.facebook && (
                  <div className="m-social-row">
                    {React.createElement(iconMapping.facebook, { 
                      size: 20, 
                      color: '#1877F2',
                      style: { flexShrink: 0 }
                    })}
                    <span className="m-social-label">
                      Facebook:
                    </span>
                    <a 
                      href={vendor.social_media.facebook.startsWith('http') ? vendor.social_media.facebook : `https://facebook.com/${vendor.social_media.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="m-link"
                    >
                      {vendor.social_media.facebook}
                    </a>
                  </div>
                )}
                
                {vendor.social_media.twitter && (
                  <div className="m-social-row">
                    {React.createElement(iconMapping.twitter, { 
                      size: 20, 
                      color: '#1DA1F2',
                      style: { flexShrink: 0 }
                    })}
                    <span className="m-social-label">
                      Twitter:
                    </span>
                    <a 
                      href={vendor.social_media.twitter.startsWith('http') ? vendor.social_media.twitter : `https://twitter.com/${vendor.social_media.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="m-link"
                    >
                      {vendor.social_media.twitter}
                    </a>
                  </div>
                )}
                
                {vendor.social_media.website && (
                  <div className="m-social-row">
                    {React.createElement(iconMapping.globe, { 
                      size: 20, 
                      color: '#0066cc',
                      style: { flexShrink: 0 }
                    })}
                    <span className="m-social-label">
                      Web Sitesi:
                    </span>
                    <a 
                      href={vendor.social_media.website.startsWith('http') ? vendor.social_media.website : `https://${vendor.social_media.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="m-link"
                    >
                      {vendor.social_media.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Değerlendirmeler */}
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
