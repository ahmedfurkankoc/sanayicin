'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, apiClient, getAuthToken } from '@/app/utils/api';
import { useMusteri } from '../context/MusteriContext';

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
}

function ProfileContent() {
  const router = useRouter();
  const { role } = useMusteri();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<CustomUser | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'email' | 'phone' | 'password' | 'danger'>('basic');
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [infoMsg, setInfoMsg] = useState('');

    useEffect(() => {
    const load = async () => {
      try {
        // Önce hangi role için token var kontrol et
        const vendorToken = localStorage.getItem('esnaf_access_token');
        const clientToken = localStorage.getItem('client_access_token');
        
        if (!vendorToken && !clientToken) {
          setError('Giriş yapılmamış. Lütfen önce giriş yapın.');
          setTimeout(() => {
            router.push('/musteri/giris');
          }, 2000);
          return;
        }
        
        // Giriş yapan kullanıcının CustomUser bilgilerini al
        const res = await apiClient.get('/profile/');
        setUserData(res.data);
        setFirstName(res.data.first_name || '');
        setLastName(res.data.last_name || '');
        setPhone(res.data.phone_number || '');
              } catch (e: any) {
          console.error('Profile load error:', e);
          if (e?.response?.status === 401) {
            setError('Oturum süresi dolmuş veya giriş yapılmamış. Lütfen tekrar giriş yapın.');
            // 401 hatası durumunda login sayfasına yönlendir
            setTimeout(() => {
              router.push('/musteri/giris');
            }, 3000);
          } else {
            setError(e?.response?.data?.detail || 'Profil bilgileri yüklenemedi');
          }
        } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const displayName = useMemo(() => {
    if (!userData) return '';
    const first = userData.first_name || '';
    const last = userData.last_name || '';
    const full = `${first} ${last}`.trim();
    return full || userData.email || '';
  }, [userData]);

  const avatarUrl = useMemo(() => userData?.avatar || null, [userData]);

  const avatarInitial = useMemo(() => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    if (userData?.email) return userData.email.charAt(0).toUpperCase();
    return 'M';
  }, [displayName, userData]);

  if (loading) {
    return (
      <div className="musteri-page-container">
        <div className="musteri-loading"><div>Profil yükleniyor...</div></div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="musteri-page-container">
        <div className="musteri-error"><div>{error || 'Profil bulunamadı'}</div></div>
      </div>
    );
  }

  return (
    <div className="musteri-page-container">
      <div className="musteri-auth-container" style={{ gap: 24 }}>
        <div className="musteri-auth-card" style={{ width: '100%', maxWidth: 960 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className="musteri-auth-title" style={{ margin: 0 }}>Hesabım</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="musteri-auth-button" onClick={() => setActiveTab('basic')}>Kişisel Bilgiler</button>
              <button className="musteri-auth-button" onClick={() => setActiveTab('email')}>E-posta</button>
              <button className="musteri-auth-button" onClick={() => setActiveTab('phone')}>Cep Telefonu</button>
              <button className="musteri-auth-button" onClick={() => setActiveTab('password')}>Şifre</button>
              <button className="musteri-auth-button" onClick={() => setActiveTab('danger')}>Hesap İptali</button>
            </div>
          </div>

          {/* Tabs content */}
          <div style={{ marginTop: 24 }}>
            {/* Kişisel Bilgiler */}
            {activeTab === 'basic' && (
              <div>
                <h2 className="musteri-auth-subtitle" style={{ marginTop: 0 }}>Kişisel Bilgiler</h2>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ flex: '0 0 120px' }}>
                    <div style={{
                      width: 120,
                      height: 120,
                      borderRadius: 12,
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      fontSize: 48,
                      color: '#666'
                    }}>
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{avatarInitial}</span>
                      )}
                    </div>
                    {editingBasic && (
                      <div style={{ marginTop: 8 }}>
                        <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: '1 1 320px', minWidth: 280 }}>
                    {!editingBasic ? (
                      <>
                        <div className="musteri-info-grid">
                          <div className="musteri-info-item"><label>Ad</label><span>{userData.first_name || '—'}</span></div>
                          <div className="musteri-info-item"><label>Soyad</label><span>{userData.last_name || '—'}</span></div>
                          <div className="musteri-info-item"><label>Doğrulama</label><span>{userData.is_verified ? 'Doğrulandı' : 'Doğrulanmadı'}</span></div>
                          <div className="musteri-info-item"><label>Rol</label><span>{userData.role === 'client' ? 'Müşteri' : userData.role === 'vendor' ? 'Esnaf' : 'Admin'}</span></div>
                        </div>
                        <button className="musteri-auth-button" onClick={() => { setEditingBasic(true); setInfoMsg(''); }}>Düzenle</button>
                      </>
                    ) : (
                      <div className="musteri-auth-form">
                        <div className="musteri-form-row">
                          <div className="musteri-form-group">
                            <label className="musteri-form-label">Ad</label>
                            <input className="musteri-form-input" value={firstName} onChange={e => setFirstName(e.target.value)} />
                          </div>
                          <div className="musteri-form-group">
                            <label className="musteri-form-label">Soyad</label>
                            <input className="musteri-form-input" value={lastName} onChange={e => setLastName(e.target.value)} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="musteri-auth-button"
                            disabled={saving}
                            onClick={async () => {
                              try {
                                setSaving(true);
                                setInfoMsg('');
                                await apiClient.patch('/profile/update/', { first_name: firstName, last_name: lastName });
                                if (avatarFile) {
                                  const fd = new FormData();
                                  fd.append('avatar', avatarFile);
                                  await api.uploadAvatar(fd, 'client');
                                }
                                // Profil bilgilerini yeniden yükle
                                const profileRes = await apiClient.get('/profile/');
                                setUserData(profileRes.data);
                                setEditingBasic(false);
                                setInfoMsg('Kayıt güncellendi.');
                              } catch (e) {
                                console.error('Update error:', e);
                                setInfoMsg('Güncelleme başarısız.');
                              } finally {
                                setSaving(false);
                              }
                            }}
                          >Kaydet</button>
                          <button className="musteri-auth-button" onClick={() => setEditingBasic(false)}>Vazgeç</button>
                        </div>
                        {infoMsg && <p style={{ color: '#666', marginTop: 8 }}>{infoMsg}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* E-posta */}
            {activeTab === 'email' && (
              <div>
                <h2 className="musteri-auth-subtitle" style={{ marginTop: 0 }}>E-posta</h2>
                <div className="musteri-info-grid">
                  <div className="musteri-info-item"><label>E-posta</label><span>{userData.email}</span></div>
                </div>
                <p style={{ color: '#666', marginTop: 12 }}>E-posta değişikliği için yakında self-service akış eklenecek. Şimdilik destek ile iletişime geçin.</p>
              </div>
            )}

            {/* Cep Telefonu */}
            {activeTab === 'phone' && (
              <div>
                <h2 className="musteri-auth-subtitle" style={{ marginTop: 0 }}>Cep Telefonu</h2>
                {!editingPhone ? (
                  <>
                    <div className="musteri-info-grid">
                      <div className="musteri-info-item"><label>Telefon</label><span>{userData.phone_number || '—'}</span></div>
                    </div>
                    <button className="musteri-auth-button" onClick={() => { setEditingPhone(true); setInfoMsg(''); }}>Düzenle</button>
                  </>
                ) : (
                  <div className="musteri-auth-form">
                    <div className="musteri-form-group">
                      <label className="musteri-form-label">Telefon</label>
                      <input className="musteri-form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="musteri-auth-button"
                        disabled={saving}
                        onClick={async () => {
                          try {
                            setSaving(true);
                            setInfoMsg('');
                            // Telefon numarasını CustomUser'a kaydet
                            await apiClient.patch('/profile/update/', { phone_number: phone });
                            // Profil bilgilerini yeniden yükle
                            const profileRes = await apiClient.get('/profile/');
                            setUserData(profileRes.data);
                            setEditingPhone(false);
                            setInfoMsg('Telefon güncellendi.');
                          } catch (e) {
                            console.error('Phone update error:', e);
                            setInfoMsg('Güncelleme başarısız.');
                          } finally {
                            setSaving(false);
                          }
                        }}
                      >Kaydet</button>
                      <button className="musteri-auth-button" onClick={() => setEditingPhone(false)}>Vazgeç</button>
                    </div>
                    {infoMsg && <p style={{ color: '#666', marginTop: 8 }}>{infoMsg}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Şifre Değişikliği */}
            {activeTab === 'password' && (
              <div>
                <h2 className="musteri-auth-subtitle" style={{ marginTop: 0 }}>Şifre Değişikliği</h2>
                <p style={{ color: '#666' }}>Şimdilik şifre değişikliği e-posta ile yapılmaktadır. Aşağıdaki butona tıklayın, e-postanıza şifre sıfırlama bağlantısı gönderilsin.</p>
                <button
                  className="musteri-auth-button"
                  disabled={saving}
                  onClick={async () => {
                    try {
                      setSaving(true);
                      await api.forgotPassword({ email: userData.email });
                      setInfoMsg('Şifre sıfırlama e-postası gönderildi.');
                    } catch (e) {
                      console.error('Password reset error:', e);
                      setInfoMsg('E-posta gönderilemedi.');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >Şifre Sıfırlama E-postası Gönder</button>
                {infoMsg && <p style={{ color: '#666', marginTop: 8 }}>{infoMsg}</p>}
              </div>
            )}

            {/* Hesap İptali */}
            {activeTab === 'danger' && (
              <div>
                <h2 className="musteri-auth-subtitle" style={{ marginTop: 0, color: '#dc2626' }}>Hesap İptali</h2>
                <p style={{ color: '#666' }}>Hesap iptali için lütfen destek ile iletişime geçin. Yakında self-service iptal akışı eklenecek.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MusteriProfilPage() {
  return (
    <Suspense fallback={<div className="musteri-page-container"><div className="musteri-loading"><div>Yükleniyor...</div></div></div>}>
      <ProfileContent />
    </Suspense>
  );
}
