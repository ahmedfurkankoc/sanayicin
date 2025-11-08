'use client';

import React from "react";
import { useRouter } from "next/navigation";
import "../../styles/esnaf.css";
import EsnafPanelLayout from "../components/EsnafPanelLayout";
import { useEsnaf } from "../context/EsnafContext";
import { LoadingSpinner } from "../components/LoadingSpinner";
import Icon from "@/app/components/ui/Icon";

export default function EsnafAyarlarPage() {
  const router = useRouter();
  const { user, email, loading, handleLogout } = useEsnaf();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <EsnafPanelLayout activePage="ayarlar">
     
            {/* Header */}
            <div className="esnaf-page-header">
              <div>
                <h1 className="esnaf-page-title">Ayarlar</h1>
                <p className="esnaf-page-subtitle">
                  Merhaba, <strong>{user?.display_name || "Kullanıcı"}</strong>
                </p>
              </div>
              <div className="esnaf-ayarlar-avatar">
                {user?.user?.avatar ? (
                  <img 
                    src={user.user.avatar} 
                    alt="Profil" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  <span>{user?.display_name?.charAt(0) || email.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            {/* Ayarlar Bölümleri */}
            <div className="esnaf-ayarlar-sections">
              {/* Ana Ayarlar */}
              <div className="esnaf-ayarlar-section">
                <div className="esnaf-ayarlar-item" onClick={() => router.push("/esnaf/profil")}>
                  <div className="esnaf-ayarlar-item-icon">
                    <Icon name="user" />
                  </div>
                  <div className="esnaf-ayarlar-item-content">
                    <h3 className="esnaf-ayarlar-item-title">Profilim</h3>
                    <p className="esnaf-ayarlar-item-description">
                      Profil resmini, adını, email adresini, telefon numaranı ve konumunu düzenle
                    </p>
                  </div>
                  <div className="esnaf-ayarlar-item-arrow">→</div>
                </div>

                <div className="esnaf-ayarlar-item" onClick={() => router.push("/esnaf/ayarlar/calisma-saatleri")}>
                  <div className="esnaf-ayarlar-item-icon">
                    <Icon name="clock" />
                  </div>
                  <div className="esnaf-ayarlar-item-content">
                    <h3 className="esnaf-ayarlar-item-title">Çalışma Saatleri</h3>
                    <p className="esnaf-ayarlar-item-description">
                      Çalışma saatlerinizi belirleyin ve müşterilerin randevu alabilmesini sağlayın
                    </p>
                  </div>
                  <div className="esnaf-ayarlar-item-arrow">→</div>
                </div>

                <div className="esnaf-ayarlar-item" onClick={() => router.push("/esnaf/ayarlar/hizmetlerim")}>
                  <div className="esnaf-ayarlar-item-icon">
                    <Icon name="building" />
                  </div>
                  <div className="esnaf-ayarlar-item-content">
                    <h3 className="esnaf-ayarlar-item-title">Hizmetlerim</h3>
                    <p className="esnaf-ayarlar-item-description">
                      Hizmet alanlarını ve hizmet verdiğiniz araba markalarını seçin
                    </p>
                  </div>
                  <div className="esnaf-ayarlar-item-arrow">→</div>
                </div>

                <div className="esnaf-ayarlar-item">
                  <div className="esnaf-ayarlar-item-icon">
                    <Icon name="credit-card" />
                  </div>
                  <div className="esnaf-ayarlar-item-content">
                    <h3 className="esnaf-ayarlar-item-title">Cüzdanım</h3>
                    <p className="esnaf-ayarlar-item-description">
                      Hesabına para yükle, bakiyeni kontrol et ve ödeme tercihlerini yönet
                    </p>
                  </div>
                  <div className="esnaf-ayarlar-item-arrow">→</div>
                </div>

                <div className="esnaf-ayarlar-item" onClick={() => router.push("/musteri/hesabim")}
                >
                  <div className="esnaf-ayarlar-item-icon">
                    <Icon name="settings" />
                  </div>
                  <div className="esnaf-ayarlar-item-content">
                    <h3 className="esnaf-ayarlar-item-title">Hesap ayarlarım</h3>
                    <p className="esnaf-ayarlar-item-description">
                      Şifre ve bildirim tercihlerini yönet
                    </p>
                  </div>
                  <div className="esnaf-ayarlar-item-arrow">→</div>
                </div>

                <div className="esnaf-ayarlar-item">
                  <div className="esnaf-ayarlar-item-icon">
                    <Icon name="star" />
                  </div>
                  <div className="esnaf-ayarlar-item-content">
                    <h3 className="esnaf-ayarlar-item-title">Müşteri yorumları</h3>
                    <p className="esnaf-ayarlar-item-description">
                      Müşterilerin senin hakkında yazdıklarına göz at
                    </p>
                  </div>
                  <div className="esnaf-ayarlar-item-arrow">→</div>
                </div>
              </div>

              {/* Diğer Ayarlar */}
              <div className="esnaf-ayarlar-section">
                <div className="esnaf-ayarlar-item">
                  <div className="esnaf-ayarlar-item-icon">
                    <Icon name="help" />
                  </div>
                  <div className="esnaf-ayarlar-item-content">
                    <h3 className="esnaf-ayarlar-item-title">Destek Merkezi</h3>
                  </div>
                  <div className="esnaf-ayarlar-item-arrow">→</div>
                </div>

                <div className="esnaf-ayarlar-item">
                  <div className="esnaf-ayarlar-item-icon">
                    <Icon name="edit" />
                  </div>
                  <div className="esnaf-ayarlar-item-content">
                    <h3 className="esnaf-ayarlar-item-title">Sanayicin'e ulaş</h3>
                  </div>
                  <div className="esnaf-ayarlar-item-arrow">→</div>
                </div>

                <div className="esnaf-ayarlar-item" onClick={() => router.push("/musteri")}
                >
                  <div className="esnaf-ayarlar-item-icon">
                    <Icon name="refresh" />
                  </div>
                  <div className="esnaf-ayarlar-item-content">
                    <h3 className="esnaf-ayarlar-item-title">Müşteri profiline geç</h3>
                  </div>
                  <div className="esnaf-ayarlar-item-arrow">→</div>
                </div>

                <div className="esnaf-ayarlar-item">
                  <div className="esnaf-ayarlar-item-icon">
                    <Icon name="lock" />
                  </div>
                  <div className="esnaf-ayarlar-item-content">
                    <h3 className="esnaf-ayarlar-item-title">Veri ve gizlilik</h3>
                  </div>
                  <div className="esnaf-ayarlar-item-arrow">→</div>
                </div>

                <div className="esnaf-ayarlar-item" onClick={handleLogout}>
                  <div className="esnaf-ayarlar-item-icon">
                    <Icon name="logout" />
                  </div>
                  <div className="esnaf-ayarlar-item-content">
                    <h3 className="esnaf-ayarlar-item-title">Çıkış Yap</h3>
                  </div>
                  <div className="esnaf-ayarlar-item-arrow">→</div>
                </div>
              </div>
            </div>
    
    </EsnafPanelLayout>
  );
} 