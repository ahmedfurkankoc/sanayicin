'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/utils/api';
import { useMusteri } from '../context/MusteriContext';
import { toast } from 'sonner';
import { iconMapping } from '@/app/utils/iconMapping';
import OTPModal from '@/app/components/OTPModal';
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
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [about, setAbout] = useState('');
  
  // Saving states
  const [savingName, setSavingName] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  
  // OTP states
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpPhone, setOtpPhone] = useState<string>('');
  const [otpUpdateType, setOtpUpdateType] = useState<'phone_update' | 'email_update' | 'password_update' | 'profile_update' | null>(null);
  const [otpUpdateData, setOtpUpdateData] = useState<FormData | null>(null);

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
        setEmail(user.email || '');
        
        // Telefon numarasını formatla (varsa)
        let formattedPhone = user.phone_number || '';
        if (formattedPhone) {
          // Sadece rakamları al
          formattedPhone = formattedPhone.replace(/\D/g, '');
          // +90 ile başlıyorsa kaldır
          if (formattedPhone.startsWith('90')) {
            formattedPhone = formattedPhone.substring(2);
          }
          // Başında 0 varsa kaldır
          if (formattedPhone.startsWith('0')) {
            formattedPhone = formattedPhone.substring(1);
          }
          // Maksimum 10 haneli
          if (formattedPhone.length > 10) {
            formattedPhone = formattedPhone.substring(0, 10);
          }
        }
        setPhone(formattedPhone);
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
      
      // OTP gerekiyorsa modal aç
      if (response.data?.requires_sms_verification && response.data?.token) {
        setOtpToken(response.data.token);
        setOtpPhone(response.data.phone_last_4 || '');
        setOtpUpdateType('profile_update');
        setOtpUpdateData(formData);
        setOtpModalOpen(true);
        setSavingName(false);
        return;
      }
      
      setUserData(response.data.profile || response.data);
      setEditingName(false);
      toast.success('Ad soyad güncellendi');
    } catch (error: any) {
      console.error('Ad soyad güncelleme hatası:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Ad soyad güncellenemedi';
      toast.error(errorMsg);
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
      
      // OTP gerekiyorsa modal aç
      if (response.data?.requires_sms_verification && response.data?.token) {
        setOtpToken(response.data.token);
        setOtpPhone(response.data.phone_last_4 || '');
        setOtpUpdateType('phone_update');
        setOtpUpdateData(formData);
        setOtpModalOpen(true);
        setSavingPhone(false);
        return;
      }
      
      setUserData(response.data.profile || response.data);
      setEditingPhone(false);
      toast.success('Telefon numarası güncellendi');
    } catch (error: any) {
      console.error('Telefon güncelleme hatası:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Telefon numarası güncellenemedi';
      toast.error(errorMsg);
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

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      const response = await api.updateProfile(formData, 'client');
      
      // OTP gerekiyorsa modal aç
      if (response.data?.requires_sms_verification && response.data?.token) {
        setOtpToken(response.data.token);
        setOtpPhone(response.data.phone_last_4 || '');
        setOtpUpdateType('email_update');
        setOtpUpdateData(formData);
        setOtpModalOpen(true);
        setSavingEmail(false);
        return;
      }
      
      setUserData(response.data.profile || response.data);
      setEditingEmail(false);
      toast.success('E-posta adresi güncellendi');
    } catch (error: any) {
      console.error('E-posta güncelleme hatası:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'E-posta adresi güncellenemedi';
      toast.error(errorMsg);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword || !newPassword2) {
      toast.error('Lütfen yeni şifrenizi girin');
      return;
    }

    if (newPassword !== newPassword2) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Şifre en az 8 karakter olmalı');
      return;
    }

    setSavingPassword(true);
    try {
      const formData = new FormData();
      formData.append('new_password', newPassword);
      const response = await api.updateProfile(formData, 'client');
      
      // OTP gerekiyorsa modal aç
      if (response.data?.requires_sms_verification && response.data?.token) {
        setOtpToken(response.data.token);
        setOtpPhone(response.data.phone_last_4 || '');
        setOtpUpdateType('password_update');
        setOtpUpdateData(formData);
        setOtpModalOpen(true);
        setSavingPassword(false);
        return;
      }
      
      setUserData(response.data.profile || response.data);
      setEditingPassword(false);
      setNewPassword('');
      setNewPassword2('');
      toast.success('Şifre güncellendi');
    } catch (error: any) {
      console.error('Şifre güncelleme hatası:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Şifre güncellenemedi';
      toast.error(errorMsg);
    } finally {
      setSavingPassword(false);
    }
  };

  const cancelEdit = (field: 'name' | 'phone' | 'email' | 'password' | 'about') => {
    switch (field) {
      case 'name':
        setFirstName(userData?.first_name || '');
        setLastName(userData?.last_name || '');
        setEditingName(false);
        break;
      case 'phone':
        // Telefon numarasını formatla
        let formattedPhoneCancel = userData?.phone_number || '';
        if (formattedPhoneCancel) {
          formattedPhoneCancel = formattedPhoneCancel.replace(/\D/g, '');
          if (formattedPhoneCancel.startsWith('90')) {
            formattedPhoneCancel = formattedPhoneCancel.substring(2);
          }
          if (formattedPhoneCancel.startsWith('0')) {
            formattedPhoneCancel = formattedPhoneCancel.substring(1);
          }
          if (formattedPhoneCancel.length > 10) {
            formattedPhoneCancel = formattedPhoneCancel.substring(0, 10);
          }
        }
        setPhone(formattedPhoneCancel);
        setEditingPhone(false);
        break;
      case 'email':
        setEmail(userData?.email || '');
        setEditingEmail(false);
        break;
      case 'password':
        setNewPassword('');
        setNewPassword2('');
        setEditingPassword(false);
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
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Ad"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="musteri-input"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    placeholder="Soyad"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="musteri-input"
                    style={{ flex: 1 }}
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
            {editingEmail ? (
              <div className="musteri-edit-mode">
                <input
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="musteri-input"
                />
                <div className="musteri-edit-actions">
                  <button 
                    onClick={handleSaveEmail}
                    disabled={savingEmail}
                    className="musteri-btn musteri-btn-primary musteri-btn-sm"
                  >
                    {savingEmail ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button 
                    onClick={() => cancelEdit('email')}
                    disabled={savingEmail}
                    className="musteri-btn musteri-btn-outline musteri-btn-sm"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
            <div className="musteri-field-display">
              <span className="musteri-field-value">{userData.email}</span>
                <button 
                  onClick={() => setEditingEmail(true)}
                  className="musteri-edit-btn"
                >
                  {React.createElement(iconMapping.edit, { size: 16 })}
                  Düzenle
                </button>
            </div>
            )}
          </div>

          {/* Telefon */}
          <div className="musteri-field-group">
            <label className="musteri-field-label">Telefon</label>
            {editingPhone ? (
              <div className="musteri-edit-mode">
                <div style={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 8, 
                  padding: '0 12px', 
                  background: '#fff',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <span style={{ color: '#64748b', fontWeight: 600, marginRight: 8, userSelect: 'none' }}>+90</span>
                  <input
                    type="tel"
                    placeholder="5552223333"
                    value={phone}
                    onChange={(e) => {
                      // Sadece rakamları al, başında 0 varsa kaldır
                      let value = e.target.value.replace(/\D/g, '');
                      // Başında 0 varsa kaldır
                      if (value.startsWith('0')) {
                        value = value.substring(1);
                      }
                      // Maksimum 10 haneli
                      if (value.length > 10) {
                        value = value.substring(0, 10);
                      }
                      setPhone(value);
                    }}
                    className="musteri-input"
                    style={{ 
                      flex: 1, 
                      border: 'none', 
                      outline: 'none', 
                      padding: '12px 0', 
                      background: 'transparent',
                      fontSize: 'inherit'
                    }}
                    maxLength={10}
                  />
                </div>
                <small style={{ 
                  display: 'block', 
                  marginTop: '4px', 
                  color: '#64748b', 
                  fontSize: '12px' 
                }}>
                  Başında 0 olmadan, boşluksuz 10 haneli numara girin (örn: 5552223333)
                </small>
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
                  {editingEmail ? (
                    <div className="musteri-edit-mode">
                      <input
                        type="email"
                        placeholder="ornek@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="musteri-input"
                      />
                      <div className="musteri-edit-actions">
                        <button 
                          onClick={handleSaveEmail}
                          disabled={savingEmail}
                          className="musteri-btn musteri-btn-primary musteri-btn-sm"
                        >
                          {savingEmail ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button 
                          onClick={() => cancelEdit('email')}
                          disabled={savingEmail}
                          className="musteri-btn musteri-btn-outline musteri-btn-sm"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div className="musteri-field-display">
                      <span className="musteri-field-value">{userData.email}</span>
                      <button 
                        onClick={() => setEditingEmail(true)}
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
                      <div style={{ 
                        width: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: 8, 
                        padding: '0 12px', 
                        background: '#fff',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                      >
                        <span style={{ color: '#64748b', fontWeight: 600, marginRight: 8, userSelect: 'none' }}>+90</span>
                        <input
                          type="tel"
                          placeholder="5552223333"
                          value={phone}
                          onChange={(e) => {
                            // Sadece rakamları al, başında 0 varsa kaldır
                            let value = e.target.value.replace(/\D/g, '');
                            // Başında 0 varsa kaldır
                            if (value.startsWith('0')) {
                              value = value.substring(1);
                            }
                            // Maksimum 10 haneli
                            if (value.length > 10) {
                              value = value.substring(0, 10);
                            }
                            setPhone(value);
                          }}
                          className="musteri-input"
                          style={{ 
                            flex: 1, 
                            border: 'none', 
                            outline: 'none', 
                            padding: '12px 0', 
                            background: 'transparent',
                            fontSize: 'inherit'
                          }}
                          maxLength={10}
                        />
                      </div>
                      <small style={{ 
                        display: 'block', 
                        marginTop: '4px', 
                        color: '#64748b', 
                        fontSize: '12px' 
                      }}>
                        Başında 0 olmadan, boşluksuz 10 haneli numara girin (örn: 5552223333)
                      </small>
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
                  {editingPassword ? (
                    <div className="musteri-edit-mode">
                      <input
                        type="password"
                        placeholder="Yeni şifre (en az 8 karakter)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="musteri-input"
                        minLength={8}
                      />
                      <input
                        type="password"
                        placeholder="Yeni şifre (tekrar)"
                        value={newPassword2}
                        onChange={(e) => setNewPassword2(e.target.value)}
                        className="musteri-input"
                        minLength={8}
                        style={{ marginTop: '0.75rem' }}
                      />
                      <div className="musteri-edit-actions">
                        <button 
                          onClick={handleSavePassword}
                          disabled={savingPassword}
                          className="musteri-btn musteri-btn-primary musteri-btn-sm"
                        >
                          {savingPassword ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button 
                          onClick={() => cancelEdit('password')}
                          disabled={savingPassword}
                          className="musteri-btn musteri-btn-outline musteri-btn-sm"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div className="musteri-field-display">
                    <span className="musteri-field-note">
                        Şifrenizi değiştirmek için aşağıdaki butona tıklayın.
                    </span>
                      <button 
                        onClick={() => setEditingPassword(true)}
                        className="musteri-btn musteri-btn-primary musteri-btn-sm"
                    >
                        Şifre Değiştir
                      </button>
                  </div>
                  )}
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

      {/* OTP Modal */}
      <OTPModal
        isOpen={otpModalOpen}
        onClose={() => {
          setOtpModalOpen(false);
          setOtpToken(null);
          setOtpPhone('');
          setOtpUpdateType(null);
          setOtpUpdateData(null);
        }}
        onVerify={async (code: string) => {
          if (!otpToken || !otpUpdateData || !otpUpdateType) {
            throw new Error('OTP doğrulama bilgileri eksik');
          }

          try {
            const response = await api.updateProfile(otpUpdateData, 'client', otpToken, code);
            
            setUserData(response.data.profile || response.data);
            
            // Edit modlarını kapat
            if (otpUpdateType === 'phone_update') {
              setEditingPhone(false);
              toast.success('Telefon numarası güncellendi');
            } else if (otpUpdateType === 'profile_update') {
              setEditingName(false);
              toast.success('Ad soyad güncellendi');
            } else if (otpUpdateType === 'email_update') {
              setEditingEmail(false);
              toast.success('E-posta adresi güncellendi');
            } else if (otpUpdateType === 'password_update') {
              setEditingPassword(false);
              setNewPassword('');
              setNewPassword2('');
              toast.success('Şifre güncellendi');
            }
            
            setOtpModalOpen(false);
            setOtpToken(null);
            setOtpPhone('');
            setOtpUpdateType(null);
            setOtpUpdateData(null);
          } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Doğrulama kodu hatalı';
            throw new Error(errorMsg);
          }
        }}
        onResend={async () => {
          if (!otpUpdateData || !otpUpdateType) {
            throw new Error('Yeniden gönderme bilgileri eksik');
          }

          try {
            // OTP'yi tekrar göndermek için aynı isteği tekrar gönder
            const response = await api.updateProfile(otpUpdateData, 'client');
            
            if (response.data?.requires_sms_verification && response.data?.token) {
              setOtpToken(response.data.token);
              setOtpPhone(response.data.phone_last_4 || '');
              toast.success('Doğrulama kodu tekrar gönderildi');
            } else {
              throw new Error('OTP gönderilemedi');
            }
          } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Kod gönderilemedi';
            throw new Error(errorMsg);
          }
        }}
        phoneNumber={otpPhone ? `****${otpPhone}` : undefined}
        title={
          otpUpdateType === 'phone_update' 
            ? 'Telefon Numarası Doğrulama'
            : otpUpdateType === 'profile_update'
            ? 'Ad Soyad Değişikliği Doğrulama'
            : otpUpdateType === 'email_update'
            ? 'E-posta Değişikliği Doğrulama'
            : otpUpdateType === 'password_update'
            ? 'Şifre Değişikliği Doğrulama'
            : 'SMS Doğrulama'
        }
        subtitle={
          otpUpdateType === 'phone_update'
            ? 'Yeni telefon numaranıza gönderilen 6 haneli doğrulama kodunu girin'
            : otpUpdateType === 'profile_update'
            ? 'Telefon numaranıza gönderilen 6 haneli doğrulama kodunu girin'
            : otpUpdateType === 'email_update'
            ? 'Telefon numaranıza gönderilen 6 haneli doğrulama kodunu girin'
            : otpUpdateType === 'password_update'
            ? 'Telefon numaranıza gönderilen 6 haneli doğrulama kodunu girin'
            : 'Telefon numaranıza gönderilen 6 haneli doğrulama kodunu girin'
        }
      />
    </div>
  );
}