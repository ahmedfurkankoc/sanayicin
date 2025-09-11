'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "@/app/styles/esnaf.css";
import EsnafPanelLayout from "../components/EsnafPanelLayout";
import { useEsnaf } from "../context/EsnafContext";
import { api } from "@/app/utils/api";
import Icon from "@/app/components/ui/Icon";

export default function EsnafProfilPage() {
  const router = useRouter();
  const { user } = useEsnaf();

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
                <Icon name="twitter" size="md" color="white" />
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
                <div className="esnaf-about-features">
                  <div className="esnaf-feature-item">
                    <Icon name="zap" size="sm" color="var(--yellow)" />
                    <span>Hızlı hizmet</span>
                  </div>
                  <div className="esnaf-feature-item">
                    <Icon name="wrench" size="sm" color="var(--yellow)" />
                    <span>Uzman ekip</span>
                  </div>
                  <div className="esnaf-feature-item">
                    <Icon name="award" size="sm" color="var(--yellow)" />
                    <span>Kaliteli işçilik</span>
                  </div>
                </div>
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
    </EsnafPanelLayout>
  );
} 