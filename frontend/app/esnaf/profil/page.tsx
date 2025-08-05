'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "@/app/styles/esnaf.css";
import EsnafPanelLayout from "../components/EsnafPanelLayout";
import { useEsnaf } from "../context/EsnafContext";
import { api } from "@/app/utils/api";

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
      <EsnafPanelLayout activePage="profil" title="Profil Bilgilerim">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Profil yükleniyor...</p>
        </div>
      </EsnafPanelLayout>
    );
  }

  return (
    <EsnafPanelLayout activePage="profil" title="Profil Bilgilerim">
      <div className="esnaf-profile-container">
        <div className="esnaf-profile-header">
          <h1 className="esnaf-profile-title">Profil Bilgilerim</h1>
          <button
            onClick={() => router.push("/esnaf/profil/duzenle")}
            className="esnaf-edit-btn"
          >
            Profili Düzenle
          </button>
        </div>
        
        <div className="esnaf-profile-content">
          {/* Temel Bilgiler */}
          <div className="esnaf-profile-section">
            <h2 className="esnaf-section-title">Temel Bilgiler</h2>
            
            <div className="esnaf-profile-photo">
              <div className="esnaf-photo-display">
                {user.avatar ? (
                  <img src={user.avatar} alt="Profil Fotoğrafı" />
                ) : (
                  <div className="esnaf-photo-placeholder">
                    📷
                  </div>
                )}
              </div>
            </div>
            
            <div className="esnaf-info-grid">
              <div className="esnaf-info-item">
                <label>Şirket Adı:</label>
                <span>{user.company_title || "Belirtilmemiş"}</span>
              </div>

              <div className="esnaf-info-item">
                <label>Görünen Ad:</label>
                <span>{user.display_name || "Belirtilmemiş"}</span>
              </div>

              <div className="esnaf-info-item">
                <label>İşletme Türü:</label>
                <span>{user.business_type ? getBusinessTypeName(user.business_type) : "Belirtilmemiş"}</span>
              </div>

              <div className="esnaf-info-item">
                <label>Vergi Dairesi:</label>
                <span>{user.tax_office || "Belirtilmemiş"}</span>
              </div>

              <div className="esnaf-info-item">
                <label>Vergi No:</label>
                <span>{user.tax_no || "Belirtilmemiş"}</span>
              </div>

              <div className="esnaf-info-item">
                <label>Telefon:</label>
                <span>
                  {user.phone ? (
                    <a href={`tel:${user.phone}`}>{user.phone}</a>
                  ) : "Belirtilmemiş"}
                </span>
              </div>

              <div className="esnaf-info-item">
                <label>Hakkında:</label>
                <span>{user.about || "Belirtilmemiş"}</span>
              </div>
            </div>
          </div>

          {/* Hizmet Alanları */}
          <div className="esnaf-profile-section">
            <h2 className="esnaf-section-title">Hizmet Alanları</h2>
            
            <div className="esnaf-info-grid">
              <div className="esnaf-info-item">
                <label>Hizmet Alanları:</label>
                <span>
                  {user.service_areas && user.service_areas.length > 0 
                    ? user.service_areas.map((area: any) => area.name).join(", ")
                    : "Belirtilmemiş"
                  }
                </span>
              </div>

              <div className="esnaf-info-item">
                <label>Kategoriler:</label>
                <span>
                  {user.categories && user.categories.length > 0 
                    ? user.categories.map((cat: any) => cat.name).join(", ")
                    : "Belirtilmemiş"
                  }
                </span>
              </div>

              <div className="esnaf-info-item">
                <label>Araba Markaları:</label>
                <span>
                  {user.car_brands && user.car_brands.length > 0 
                    ? user.car_brands.map((brand: any) => brand.name).join(", ")
                    : "Belirtilmemiş"
                  }
                </span>
              </div>
            </div>
          </div>

          {/* İletişim Bilgileri */}
          <div className="esnaf-profile-section">
            <h2 className="esnaf-section-title">İletişim Bilgileri</h2>
            
            <div className="esnaf-info-grid">
              <div className="esnaf-info-item">
                <label>İl:</label>
                <span>{user.city || "Belirtilmemiş"}</span>
              </div>

              <div className="esnaf-info-item">
                <label>İlçe:</label>
                <span>{user.district || "Belirtilmemiş"}</span>
              </div>

              <div className="esnaf-info-item">
                <label>Mahalle:</label>
                <span>{user.subdistrict || "Belirtilmemiş"}</span>
              </div>

              <div className="esnaf-info-item">
                <label>Açık Adres:</label>
                <span>{user.address || "Belirtilmemiş"}</span>
              </div>


            </div>
          </div>

          {/* Sosyal Medya */}
          <div className="esnaf-profile-section">
            <h2 className="esnaf-section-title">Sosyal Medya</h2>
            
            <div className="esnaf-info-grid">
              <div className="esnaf-info-item">
                <label>Instagram:</label>
                <span>
                  {user.social_media?.instagram ? (
                    <a href={user.social_media.instagram} target="_blank" rel="noopener noreferrer">
                      {user.social_media.instagram}
                    </a>
                  ) : "Belirtilmemiş"}
                </span>
              </div>

              <div className="esnaf-info-item">
                <label>Facebook:</label>
                <span>
                  {user.social_media?.facebook ? (
                    <a href={user.social_media.facebook} target="_blank" rel="noopener noreferrer">
                      {user.social_media.facebook}
                    </a>
                  ) : "Belirtilmemiş"}
                </span>
              </div>

              <div className="esnaf-info-item">
                <label>Twitter:</label>
                <span>
                  {user.social_media?.twitter ? (
                    <a href={user.social_media.twitter} target="_blank" rel="noopener noreferrer">
                      {user.social_media.twitter}
                    </a>
                  ) : "Belirtilmemiş"}
                </span>
              </div>

              <div className="esnaf-info-item">
                <label>Web Sitesi:</label>
                <span>
                  {user.social_media?.website ? (
                    <a href={user.social_media.website} target="_blank" rel="noopener noreferrer">
                      {user.social_media.website}
                    </a>
                  ) : "Belirtilmemiş"}
                </span>
              </div>
            </div>
          </div>

          {/* Çalışma Saatleri */}
          <div className="esnaf-profile-section">
            <h2 className="esnaf-section-title">Çalışma Saatleri</h2>
            
            <div className="esnaf-working-hours">
              {Object.entries(user.working_hours || {}).map(([day, hours]: [string, any]) => (
                <div key={day} className="esnaf-working-day-display">
                  <span className="esnaf-day-name">{getDayName(day)}:</span>
                  <span className="esnaf-day-hours">
                    {!hours || hours.closed 
                      ? "Belirtilmemiş" 
                      : `${hours.open || ''} - ${hours.close || ''}`
                    }
                  </span>
                </div>
              ))}
              {(!user.working_hours || Object.keys(user.working_hours).length === 0) && (
                <p className="esnaf-no-data">Çalışma saatleri henüz belirtilmemiş.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </EsnafPanelLayout>
  );
} 