'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "@/app/styles/esnaf.css";
import EsnafPanelLayout from "../components/EsnafPanelLayout";
import { useEsnaf } from "../context/EsnafContext";
import { api, resolveMediaUrl } from "@/app/utils/api";
import Icon from "@/app/components/ui/Icon";
import VendorLocationMap from "@/app/components/VendorLocationMap";

interface VendorImage {
  id: number;
  image: string;
  image_url: string;
  description: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export default function EsnafProfilPage() {
  const router = useRouter();
  const { user } = useEsnaf();
  const [location, setLocation] = useState<{ latitude?: number; longitude?: number }>({});
  const [galleryImages, setGalleryImages] = useState<VendorImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // Konum bilgilerini yükle
  useEffect(() => {
    const loadLocation = async () => {
      if (user?.slug) {
        try {
          const response = await api.getVendorLocation(user.slug);
          setLocation({
            latitude: response.data.latitude,
            longitude: response.data.longitude
          });
        } catch (error) {
          console.log('Konum bilgisi bulunamadı:', error);
        }
      }
    };

    loadLocation();
  }, [user?.slug]);

  // Görselleri yükle (sadece görüntüleme için)
  useEffect(() => {
    if (!user) return;
    
    // Önce user objesinden kontrol et (daha hızlı, API çağrısı yok)
    if (user.gallery_images && Array.isArray(user.gallery_images) && user.gallery_images.length > 0) {
      setGalleryImages(user.gallery_images);
      setCurrentImageIndex(0); // Reset index when images change
      return;
    }
    
    // User objesinde yoksa API'den yükle
    const loadImages = async () => {
      try {
        const response = await api.getVendorImages();
        const responseData = response.data;
        const images: VendorImage[] = Array.isArray(responseData) 
          ? responseData 
          : (Array.isArray(responseData?.results) ? responseData.results : []);
        setGalleryImages(images);
        setCurrentImageIndex(0); // Reset index when images change
      } catch (error) {
        // Fallback: user objesinden al veya boş array
        setGalleryImages(user?.gallery_images && Array.isArray(user.gallery_images) 
          ? user.gallery_images 
          : []);
        setCurrentImageIndex(0);
      }
    };

    loadImages();
  }, [user]);

  // currentImageIndex sınırlarını kontrol et
  useEffect(() => {
    if (galleryImages.length > 0 && currentImageIndex >= galleryImages.length) {
      setCurrentImageIndex(0);
    }
  }, [galleryImages.length, currentImageIndex]);

  // İşletme türünü Türkçe'ye çevir
  const getBusinessTypeName = (businessType: string) => {
    const businessTypes: { [key: string]: string } = {
      "sahis": "Şahıs Şirketi",
      "limited": "Limited Şirketi", 
      "anonim": "Anonim Şirketi",
      "esnaf": "Esnaf"
    };
    return businessTypes[businessType] || businessType;
  };

  const getDayName = (day: string) => {
    const dayNames: { [key: string]: string } = {
      'monday': 'Pazartesi',
      'tuesday': 'Salı',
      'wednesday': 'Çarşamba',
      'thursday': 'Perşembe',
      'friday': 'Cuma',
      'saturday': 'Cumartesi',
      'sunday': 'Pazar'
    };
    return dayNames[day] || day;
  };


  if (!user) {
    return (
      <EsnafPanelLayout activePage="profil">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Profil yükleniyor...</p>
        </div>
      </EsnafPanelLayout>
    );
  }

  return (
    <EsnafPanelLayout activePage="profil">
      <div className="esnaf-modern-profile">
        
        {/* Modern Header */}
        <div className="esnaf-profile-hero">
          <div className="esnaf-profile-hero-bg"></div>
          <div className="esnaf-profile-hero-content">
            <div className="esnaf-profile-avatar-section">
              <div className="esnaf-profile-avatar">
                {user.user?.avatar ? (
                  <img src={user.user.avatar} alt="Profil Fotoğrafı" className="esnaf-avatar-img" />
                ) : (
                  <div className="esnaf-avatar-initial">
                    {user.display_name ? user.display_name.charAt(0).toUpperCase() : 
                     user.company_title ? user.company_title.charAt(0).toUpperCase() : 'E'}
                  </div>
                )}
              </div>
              <div className="esnaf-profile-info">
                <h1 className="esnaf-profile-name">
                  {user.display_name || user.company_title || "Esnaf"}
                </h1>
                <p className="esnaf-profile-business-type">
                  {user.business_type ? getBusinessTypeName(user.business_type) : "İşletme"}
                </p>
                <div className="esnaf-profile-location">
                  <Icon name="map-pin" size="sm" color="var(--black)" />
                  <span className="esnaf-profile-location-text">
                    {user.district && user.city 
                      ? `${user.district}, ${user.city}` 
                      : user.city || "Konum belirtilmemiş"
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div className="esnaf-profile-actions">
              <div className="esnaf-profile-stats">
                <div className="esnaf-stat-item">
                  <span className="esnaf-stat-label">İşletme</span>
                  <span className="esnaf-stat-value">{user.business_type ? getBusinessTypeName(user.business_type) : "—"}</span>
                </div>
                <div className="esnaf-stat-item">
                  <span className="esnaf-stat-label">Konum</span>
                  <span className="esnaf-stat-value">{user.city || "—"}</span>
                </div>
              </div>
              <button
                onClick={() => router.push("/esnaf/profil/duzenle")}
                className="esnaf-profile-edit-btn"
              >
                Profili Düzenle
              </button>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="esnaf-profile-social">
          <div className="esnaf-social-links">
            {user.social_media?.instagram && (
              <a href={user.social_media.instagram} target="_blank" rel="noopener noreferrer" className="esnaf-social-link instagram">
                <Icon name="instagram" size="md" color="white" />
              </a>
            )}
            {user.social_media?.facebook && (
              <a href={user.social_media.facebook} target="_blank" rel="noopener noreferrer" className="esnaf-social-link facebook">
                <Icon name="facebook" size="md" color="white" />
              </a>
            )}
            {user.social_media?.twitter && (
              <a href={user.social_media.twitter} target="_blank" rel="noopener noreferrer" className="esnaf-social-link twitter">
                <Icon name="twitter-x" size="md" color="white" />
              </a>
            )}
            {user.social_media?.youtube && (
              <a href={user.social_media.youtube} target="_blank" rel="noopener noreferrer" className="esnaf-social-link youtube">
                <Icon name="youtube" size="md" color="white" />
              </a>
            )}
            {user.social_media?.tiktok && (
              <a href={user.social_media.tiktok} target="_blank" rel="noopener noreferrer" className="esnaf-social-link tiktok">
                <Icon name="tiktok" size="md" color="white" />
              </a>
            )}
            {user.social_media?.website && (
              <a href={user.social_media.website} target="_blank" rel="noopener noreferrer" className="esnaf-social-link website">
                <Icon name="globe" size="md" color="white" />
              </a>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="esnaf-profile-main">
          <div className="esnaf-profile-sidebar">
            {/* Skills/Service Areas */}
            <div className="esnaf-profile-card">
              <h3 className="esnaf-card-title">Hizmet Alanları</h3>
              <div className="esnaf-skills-container">
                {user.service_areas && user.service_areas.length > 0 ? (
                  user.service_areas.map((area: any, index: number) => (
                    <span key={index} className="esnaf-skill-tag">
                      {area.name}
                    </span>
                  ))
                ) : (
                  <span className="esnaf-no-skills">Hizmet alanı belirtilmemiş</span>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="esnaf-profile-card">
              <h3 className="esnaf-card-title">Kategoriler</h3>
              <div className="esnaf-skills-container">
                {user.categories && user.categories.length > 0 ? (
                  user.categories.map((cat: any, index: number) => (
                    <span key={index} className="esnaf-skill-tag">
                      {cat.name}
                    </span>
                  ))
                ) : (
                  <span className="esnaf-no-skills">Kategori belirtilmemiş</span>
                )}
              </div>
            </div>

            {/* Car Brands */}
            <div className="esnaf-profile-card">
              <h3 className="esnaf-card-title">Araba Markaları</h3>
              <div className="esnaf-skills-container">
                {user.car_brands && user.car_brands.length > 0 ? (
                  user.car_brands.map((brand: any, index: number) => (
                    <span key={index} className="esnaf-skill-tag">
                      {brand.name}
                    </span>
                  ))
                ) : (
                  <span className="esnaf-no-skills">Marka belirtilmemiş</span>
                )}
              </div>
            </div>

            {/* Gallery Section */}
            <div className="esnaf-profile-card">
              <h3 className="esnaf-card-title">İşletme Görselleri</h3>
              
              {galleryImages.length > 0 ? (
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
                      {galleryImages.map((img, index) => (
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
                            src={resolveMediaUrl(img.image_url || img.image)}
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
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) => 
                              prev === 0 ? galleryImages.length - 1 : prev - 1
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
                          <Icon name="chevron-left" size="sm" color="var(--black)" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) => 
                              prev === galleryImages.length - 1 ? 0 : prev + 1
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
                          <Icon name="chevron-right" size="sm" color="var(--black)" />
                        </button>
                      </>
                    )}

                    {/* Dots Indicator */}
                    {galleryImages.length > 1 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '12px'
                      }}>
                        {galleryImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              border: 'none',
                              backgroundColor: index === currentImageIndex ? 'var(--primary)' : '#ddd',
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
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: 'var(--gray)',
                  fontSize: '14px'
                }}>
                  <Icon name="image" size="md" color="var(--gray)" />
                  <p style={{ marginTop: '8px', fontSize: '12px' }}>Henüz görsel yok</p>
                </div>
              )}
            </div>

            {/* Verification Status */}
            <div className="esnaf-profile-card">
              <h3 className="esnaf-card-title">Doğrulama Durumu</h3>
              <div className="esnaf-verification-list">
                <div className="esnaf-verification-item">
                  <Icon name="mail" size="sm" color="var(--black)" />
                  <span className="esnaf-verification-text">E-posta</span>
                  <Icon name="check-circle" size="sm" color="#48bb78" />
                </div>
                <div className="esnaf-verification-item">
                  <Icon name="phone" size="sm" color="var(--black)" />
                  <span className="esnaf-verification-text">Telefon</span>
                  <Icon name="check-circle" size="sm" color="#48bb78" />
                </div>
                <div className="esnaf-verification-item">
                  <Icon name="building" size="sm" color="var(--black)" />
                  <span className="esnaf-verification-text">İşletme</span>
                  <Icon name="check-circle" size="sm" color="#48bb78" />
                </div>
              </div>
            </div>
          </div>

          <div className="esnaf-profile-content">
            {/* About Section */}
            <div className="esnaf-profile-card">
              <h3 className="esnaf-card-title">Hakkında</h3>
              <div className="esnaf-about-content">
                <p className="esnaf-about-text">
                  {user.about || "Hakkında bilgi henüz eklenmemiş."}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="esnaf-profile-card">
              <h3 className="esnaf-card-title">İletişim Bilgileri</h3>
              <div className="esnaf-contact-grid">
                <div className="esnaf-contact-item">
                  <Icon name="phone" size="sm" color="var(--black)" />
                  <div className="esnaf-contact-info">
                    <span className="esnaf-contact-label">Telefon</span>
                    <span className="esnaf-contact-value">
                      {user.phone ? (
                        <a href={`tel:${user.phone}`}>{user.phone}</a>
                      ) : "Belirtilmemiş"}
                    </span>
                  </div>
                </div>
                <div className="esnaf-contact-item">
                  <Icon name="map-pin" size="sm" color="var(--black)" />
                  <div className="esnaf-contact-info">
                    <span className="esnaf-contact-label">Adres</span>
                    <span className="esnaf-contact-value">
                      {user.address || `${user.city || ""} ${user.district || ""}`.trim() || "Belirtilmemiş"}
                    </span>
                  </div>
                </div>
                <div className="esnaf-contact-item">
                  <Icon name="building" size="sm" color="var(--black)" />
                  <div className="esnaf-contact-info">
                    <span className="esnaf-contact-label">Vergi No</span>
                    <span className="esnaf-contact-value">{user.tax_no || "Belirtilmemiş"}</span>
                  </div>
                </div>
                <div className="esnaf-contact-item">
                  <Icon name="credit-card" size="sm" color="var(--black)" />
                  <div className="esnaf-contact-info">
                    <span className="esnaf-contact-label">Vergi Dairesi</span>
                    <span className="esnaf-contact-value">{user.tax_office || "Belirtilmemiş"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Map */}
            <div className="esnaf-profile-card">
              <h3 className="esnaf-card-title">Konum</h3>
              <div className="esnaf-location-section">
                <div className="esnaf-location-info">
                  <Icon name="map-pin" size="sm" color="var(--black)" />
                  <span className="esnaf-location-text">
                    {user.subdistrict ? `${user.subdistrict}, ` : ''}
                    {user.district}, {user.city}
                  </span>
                </div>
                <VendorLocationMap
                  vendor={{
                    slug: user.slug || '',
                    display_name: user.display_name || user.company_title || 'İşletme',
                    city: user.city || '',
                    district: user.district || '',
                    subdistrict: user.subdistrict || ''
                  }}
                  latitude={location.latitude}
                  longitude={location.longitude}
                  height="300px"
                  className="esnaf-profile-map"
                  showNearbyVendors={false}
                />
              </div>
            </div>

            {/* Working Hours */}
            <div className="esnaf-profile-card">
              <h3 className="esnaf-card-title">Çalışma Saatleri</h3>
              <div className="esnaf-working-hours-modern">
                {Object.entries(user.working_hours || {}).map(([day, hours]: [string, any]) => (
                  <div key={day} className="esnaf-working-day-modern">
                    <span className="esnaf-day-name-modern">{getDayName(day)}</span>
                    <span className="esnaf-day-hours-modern">
                      {!hours || hours.closed 
                        ? "Kapalı" 
                        : `${hours.open || ''} - ${hours.close || ''}`
                      }
                    </span>
                  </div>
                ))}
                {(!user.working_hours || Object.keys(user.working_hours).length === 0) && (
                  <div className="esnaf-no-working-hours">
                    <Icon name="clock" size="md" color="var(--gray)" />
                    <span>Çalışma saatleri henüz belirtilmemiş</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && galleryImages.length > 0 && (
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
                prev === 0 ? galleryImages.length - 1 : prev - 1
              );
            }
            if (e.key === 'ArrowRight') {
              setCurrentImageIndex((prev) => 
                prev === galleryImages.length - 1 ? 0 : prev + 1
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
              src={resolveMediaUrl(galleryImages[currentImageIndex]?.image_url || galleryImages[currentImageIndex]?.image)}
              alt={galleryImages[currentImageIndex]?.description || 'Galeri görseli'}
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
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => 
                      prev === 0 ? galleryImages.length - 1 : prev - 1
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
                  <Icon name="chevron-left" size="md" color="var(--black)" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => 
                      prev === galleryImages.length - 1 ? 0 : prev + 1
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
                  <Icon name="chevron-right" size="md" color="var(--black)" />
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
                  {currentImageIndex + 1} / {galleryImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </EsnafPanelLayout>
  );
} 