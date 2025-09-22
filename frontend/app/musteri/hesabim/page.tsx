'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/utils/api';
import { useMusteri } from '../context/MusteriContext';
import { toast } from 'sonner';
import { iconMapping } from '@/app/utils/iconMapping';
import '../../styles/musteri.css';

interface CustomUser {
  id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_verified: boolean;
  phone_number?: string;
  avatar?: string;
  can_provide_services: boolean;
  can_request_services: boolean;
  verification_method: string;
  about?: string;
}

export default function MusteriHesabimPage() {
  const router = useRouter();
  const { isAuthenticated, user: currentUser, loading: authLoading } = useMusteri();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<CustomUser | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'email' | 'phone' | 'password' | 'danger'>('basic');
  
  // Editing states
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  
  // Saving states
  const [savingName, setSavingName] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (authLoading) return; // Auth hazır değilken yönlendirme yapma
        if (!isAuthenticated) {
          router.replace('/musteri/giris?next=/musteri/hesabim');
          return;
        }

        const response = await api.getProfile('client');
        const user = response.data;
        setUserData(user);
        
        // Form verilerini doldur
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setPhone(user.phone_number || '');
        setAbout(user.about || '');
        
      } catch (error: any) {
        console.error('Profil yükleme hatası:', error);
        toast.error('Profil bilgileri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, authLoading, router]);

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      const response = await api.updateProfile(formData, 'client');
      
      setUserData(response.data);
      
      setEditingName(false);
      toast.success('Ad soyad güncellendi');
    } catch (error: any) {
      console.error('Ad soyad güncelleme hatası:', error);
      toast.error('Ad soyad güncellenemedi');
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePhone = async () => {
    setSavingPhone(true);
    try {
      const formData = new FormData();
      formData.append('phone_number', phone);
      const response = await api.updateProfile(formData, 'client');
      
      setUserData(response.data);
      
      setEditingPhone(false);
      toast.success('Telefon numarası güncellendi');
    } catch (error: any) {
      console.error('Telefon güncelleme hatası:', error);
      toast.error('Telefon numarası güncellenemedi');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSaveAbout = async () => {
    setSavingAbout(true);
    try {
      const formData = new FormData();
      formData.append('about', about);
      const response = await api.updateProfile(formData, 'client');
      
      setUserData(response.data);
      
      setEditingAbout(false);
      toast.success('Hakkında bilgisi güncellendi');
    } catch (error: any) {
      console.error('Hakkında güncelleme hatası:', error);
      toast.error('Hakkında bilgisi güncellenemedi');
    } finally {
      setSavingAbout(false);
    }
  };

  const cancelEdit = (field: 'name' | 'phone' | 'about') => {
    switch (field) {
      case 'name':
        setFirstName(userData?.first_name || '');
        setLastName(userData?.last_name || '');
        setEditingName(false);
        break;
      case 'phone':
        setPhone(userData?.phone_number || '');
        setEditingPhone(false);
        break;
      case 'about':
        setAbout(userData?.about || '');
        setEditingAbout(false);
        break;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="musteri-loading">
          <div className="musteri-loading-spinner"></div>
          <p>Hesap bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container">
        <div className="musteri-error">
          <p>Hesap bilgileri yüklenemedi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="musteri-page-header">
        <h1>Hesabım</h1>
        <p>Hesap bilgilerinizi görüntüleyebilir ve düzenleyebilirsiniz.</p>
      </div>

      {/* Tab Navigation */}
      <div className="musteri-tabs-container">
        <div className="musteri-tabs-nav">
          <button
            className={`musteri-tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            {React.createElement(iconMapping.user, { size: 16 })}
            Kişisel Bilgiler
          </button>
          <button
            className={`musteri-tab-btn ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            {React.createElement(iconMapping.mail, { size: 16 })}
            E-posta
          </button>
          <button
            className={`musteri-tab-btn ${activeTab === 'phone' ? 'active' : ''}`}
            onClick={() => setActiveTab('phone')}
          >
            {React.createElement(iconMapping.phone, { size: 16 })}
            Telefon
          </button>
          <button
            className={`musteri-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            {React.createElement(iconMapping.lock, { size: 16 })}
            Şifre
          </button>
          <button
            className={`musteri-tab-btn ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            {React.createElement(iconMapping['alert-circle'], { size: 16 })}
            Hesap
          </button>
        </div>

        {/* Tab Content */}
        <div className="musteri-tab-content">
          {activeTab === 'basic' && (
            <div className="musteri-account-sections">
        {/* Kişisel Bilgiler */}
        <div className="musteri-account-section">
          <div className="musteri-section-header">
            <h3>Kişisel Bilgiler</h3>
          </div>

          {/* Ad Soyad */}
          <div className="musteri-field-group">
            <label className="musteri-field-label">Ad Soyad</label>
            {editingName ? (
              <div className="musteri-edit-mode">
                <div className="musteri-name-inputs">
                  <input
                    type="text"
                    placeholder="Ad"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="musteri-input"
                  />
                  <input
                    type="text"
                    placeholder="Soyad"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="musteri-input"
                  />
                </div>
                <div className="musteri-edit-actions">
                  <button 
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="musteri-btn musteri-btn-primary musteri-btn-sm"
                  >
                    {savingName ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button 
                    onClick={() => cancelEdit('name')}
                    disabled={savingName}
                    className="musteri-btn musteri-btn-outline musteri-btn-sm"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="musteri-field-display">
                <span className="musteri-field-value">
                  {userData.first_name || userData.last_name 
                    ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
                    : 'Belirtilmemiş'
                  }
                </span>
                <button 
                  onClick={() => setEditingName(true)}
                  className="musteri-edit-btn"
                >
                  {React.createElement(iconMapping.edit, { size: 16 })}
                  Düzenle
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="musteri-field-group">
            <label className="musteri-field-label">E-posta</label>
            <div className="musteri-field-display">
              <span className="musteri-field-value">{userData.email}</span>
              <span className="musteri-field-note">E-posta adresi değiştirilemez</span>
            </div>
          </div>

          {/* Telefon */}
          <div className="musteri-field-group">
            <label className="musteri-field-label">Telefon</label>
            {editingPhone ? (
              <div className="musteri-edit-mode">
                <input
                  type="tel"
                  placeholder="0555 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="musteri-input"
                />
                <div className="musteri-edit-actions">
                  <button 
                    onClick={handleSavePhone}
                    disabled={savingPhone}
                    className="musteri-btn musteri-btn-primary musteri-btn-sm"
                  >
                    {savingPhone ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button 
                    onClick={() => cancelEdit('phone')}
                    disabled={savingPhone}
                    className="musteri-btn musteri-btn-outline musteri-btn-sm"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="musteri-field-display">
                <span className="musteri-field-value">
                  {userData.phone_number || 'Belirtilmemiş'}
                </span>
                <button 
                  onClick={() => setEditingPhone(true)}
                  className="musteri-edit-btn"
                >
                  {React.createElement(iconMapping.edit, { size: 16 })}
                  Düzenle
                </button>
              </div>
            )}
          </div>

          {/* Hakkında */}
          <div className="musteri-field-group">
            <label className="musteri-field-label">Hakkında</label>
            {editingAbout ? (
              <div className="musteri-edit-mode">
                <textarea
                  placeholder="Kendiniz hakkında kısa bilgi..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="musteri-textarea"
                  rows={3}
                />
                <div className="musteri-edit-actions">
                  <button 
                    onClick={handleSaveAbout}
                    disabled={savingAbout}
                    className="musteri-btn musteri-btn-primary musteri-btn-sm"
                  >
                    {savingAbout ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button 
                    onClick={() => cancelEdit('about')}
                    disabled={savingAbout}
                    className="musteri-btn musteri-btn-outline musteri-btn-sm"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="musteri-field-display">
                <span className="musteri-field-value">
                  {userData.about || 'Belirtilmemiş'}
                </span>
                <button 
                  onClick={() => setEditingAbout(true)}
                  className="musteri-edit-btn"
                >
                  {React.createElement(iconMapping.edit, { size: 16 })}
                  Düzenle
                </button>
              </div>
            )}
          </div>
        </div>

            </div>
          )}

          {activeTab === 'email' && (
            <div className="musteri-account-sections">
              <div className="musteri-account-section">
                <div className="musteri-section-header">
                  <h3>E-posta Ayarları</h3>
                </div>

                <div className="musteri-field-group">
                  <label className="musteri-field-label">Mevcut E-posta</label>
                  <div className="musteri-field-display">
                    <span className="musteri-field-value">{userData.email}</span>
                    <span className={`musteri-status-badge ${userData.is_verified ? 'verified' : 'unverified'}`}>
                      {userData.is_verified ? (
                        <>
                          {React.createElement(iconMapping.check, { size: 16 })}
                          Doğrulanmış
                        </>
                      ) : (
                        <>
                          {React.createElement(iconMapping['alert-circle'], { size: 16 })}
                          Doğrulanmamış
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="musteri-field-group">
                  <label className="musteri-field-label">E-posta Değiştirme</label>
                  <div className="musteri-field-display">
                    <span className="musteri-field-note">
                      Güvenlik nedeniyle e-posta adresi değiştirilemez. 
                      Yeni e-posta ile hesap oluşturmanız gerekir.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'phone' && (
            <div className="musteri-account-sections">
              <div className="musteri-account-section">
                <div className="musteri-section-header">
                  <h3>Telefon Ayarları</h3>
                </div>

                <div className="musteri-field-group">
                  <label className="musteri-field-label">Telefon Numarası</label>
                  {editingPhone ? (
                    <div className="musteri-edit-mode">
                      <input
                        type="tel"
                        placeholder="0555 123 45 67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="musteri-input"
                      />
                      <div className="musteri-edit-actions">
                        <button 
                          onClick={handleSavePhone}
                          disabled={savingPhone}
                          className="musteri-btn musteri-btn-primary musteri-btn-sm"
                        >
                          {savingPhone ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button 
                          onClick={() => cancelEdit('phone')}
                          disabled={savingPhone}
                          className="musteri-btn musteri-btn-outline musteri-btn-sm"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="musteri-field-display">
                      <span className="musteri-field-value">
                        {userData.phone_number || 'Belirtilmemiş'}
                      </span>
                      <button 
                        onClick={() => setEditingPhone(true)}
                        className="musteri-edit-btn"
                      >
                        {React.createElement(iconMapping.edit, { size: 16 })}
                        Düzenle
                      </button>
                    </div>
                  )}
                </div>

                <div className="musteri-field-group">
                  <label className="musteri-field-label">SMS Doğrulama</label>
                  <div className="musteri-field-display">
                    <span className="musteri-field-note">
                      Telefon numaranız güvenlik için SMS doğrulaması gerektirir.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="musteri-account-sections">
              <div className="musteri-account-section">
                <div className="musteri-section-header">
                  <h3>Şifre ve Güvenlik</h3>
                </div>

                <div className="musteri-field-group">
                  <label className="musteri-field-label">Mevcut Şifre</label>
                  <div className="musteri-field-display">
                    <span className="musteri-field-value">••••••••</span>
                    <span className="musteri-field-note">Son değiştirilme: Bilgi yok</span>
                  </div>
                </div>

                <div className="musteri-field-group">
                  <label className="musteri-field-label">Şifre Değiştirme</label>
                  <div className="musteri-field-display">
                    <span className="musteri-field-note">
                      Şifrenizi değiştirmek için şifre sıfırlama linkini kullanabilirsiniz.
                    </span>
                    <a 
                      href="/musteri/sifremi-unuttum" 
                      className="musteri-btn musteri-btn-outline musteri-btn-sm"
                    >
                      Şifre Sıfırla
                    </a>
                  </div>
                </div>

                <div className="musteri-field-group">
                  <label className="musteri-field-label">İki Faktörlü Doğrulama</label>
                  <div className="musteri-field-display">
                    <span className="musteri-field-note">
                      Hesabınızın güvenliği için iki faktörlü doğrulama önerilir.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="musteri-account-sections">
              <div className="musteri-account-section musteri-danger-section">
                <div className="musteri-section-header">
                  <h3>Hesap Yönetimi</h3>
                </div>

                <div className="musteri-field-group">
                  <label className="musteri-field-label">Hesap Türü</label>
                  <div className="musteri-field-display">
                    <span className="musteri-field-value">
                      {userData.role === 'vendor' ? 'Esnaf Hesabı' : 'Müşteri Hesabı'}
                    </span>
                    {userData.role === 'client' && (
                      <a 
                        href="/musteri/esnaf-ol" 
                        className="musteri-btn musteri-btn-primary musteri-btn-sm"
                      >
                        Esnaf Ol
                      </a>
                    )}
                  </div>
                </div>

                <div className="musteri-field-group">
                  <label className="musteri-field-label">Hesap Durumu</label>
                  <div className="musteri-field-display">
                    <span className={`musteri-status-badge ${userData.is_verified ? 'verified' : 'unverified'}`}>
                      {userData.is_verified ? (
                        <>
                          {React.createElement(iconMapping.check, { size: 16 })}
                          Aktif
                        </>
                      ) : (
                        <>
                          {React.createElement(iconMapping['alert-circle'], { size: 16 })}
                          Doğrulama Bekliyor
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="musteri-field-group">
                  <label className="musteri-field-label">Tehlikeli İşlemler</label>
                  <div className="musteri-field-display">
                    <span className="musteri-field-note">
                      Bu işlemler geri alınamaz. Dikkatli olun.
                    </span>
                  </div>
                </div>

                <div className="musteri-field-group">
                  <label className="musteri-field-label">Hesabı Sil</label>
                  <div className="musteri-field-display">
                    <span className="musteri-field-note">
                      Hesabınızı kalıcı olarak silmek istiyorsanız destek ekibimizle iletişime geçin.
                    </span>
                    <button className="musteri-btn musteri-btn-danger musteri-btn-sm">
                      Hesabı Sil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}