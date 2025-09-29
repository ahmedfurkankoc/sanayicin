'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getAuthToken } from "@/app/utils/api";
import { useTurkeyData } from "@/app/hooks/useTurkeyData";
import { useMusteri } from "../context/MusteriContext";
import MusteriHeader from "../components/MusteriHeader";

export default function EsnafOlPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useMusteri();
  const { cities, loadTurkeyData, getDistricts } = useTurkeyData();
  
  const [formData, setFormData] = useState({
    business_type: '',
    company_title: '',
    tax_office: '',
    tax_no: '',
    display_name: '',
    city: '',
    district: '',
    subdistrict: '',
    address: '',
    business_phone: '',
    manager_birthdate: '',
    manager_tc: '',
    service_areas: [] as number[],
    categories: [] as number[],
    car_brands: [] as number[],
    social_media: {},
    working_hours: {},
    unavailable_dates: [] as string[],
    about: '', // İşletme hakkında açıklama
  });
  
  const [districts, setDistricts] = useState<string[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [carBrands, setCarBrands] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Şehir verisini yükle
  useEffect(() => {
    loadTurkeyData();
  }, [loadTurkeyData]);
  
  // Hizmet alanlarını çek
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.getServiceAreas();
        setServices(response.data);
      } catch (error) {
        console.error('Hizmet alanları yüklenemedi:', error);
      }
    };
    fetchServices();
  }, []);
  
  // Kategorileri çek
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Kategoriler yüklenemedi:', error);
      }
    };
    fetchCategories();
  }, []);
  
  // Araba markalarını çek
  useEffect(() => {
    const fetchCarBrands = async () => {
      try {
        const response = await api.getCarBrands();
        setCarBrands(response.data);
      } catch (error) {
        console.error('Araba markaları yüklenemedi:', error);
      }
    };
    fetchCarBrands();
  }, []);
  
  // Authentication kontrolü
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/musteri/giris?next=/musteri/esnaf-ol');
      return;
    }
    
    // is_verified durumunu kontrol et
    if (user && !user.is_verified) {
      setError("Esnaf olmak için önce hesabınızı doğrulamanız gerekiyor. Email veya SMS doğrulaması yapın.");
    }
  }, [authLoading, isAuthenticated, router, user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMultiSelectChange = (name: string, value: number[]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // FormData oluştur
      const formDataObj = new FormData();
      
      // Temel alanları ekle
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'service_areas' || key === 'categories' || key === 'car_brands') {
          // Array'leri JSON olarak ekle
          formDataObj.append(key, JSON.stringify(value));
        } else if (key === 'social_media' || key === 'working_hours') {
          // JSON alanları
          formDataObj.append(key, JSON.stringify(value));
        } else if (key === 'unavailable_dates') {
          // Array'i JSON olarak ekle
          formDataObj.append(key, JSON.stringify(value));
        } else {
          formDataObj.append(key, value as string);
        }
      });
      
      // Belgeler kaldırıldı: Dosya ekleme yok
      
      // API'ye gönder
      const response = await fetch('/api/vendor/upgrade/', {
        method: 'POST',
        body: formDataObj,
        headers: {
          'Authorization': `Bearer ${getAuthToken('client')}`
        }
      });
      
      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.auto_approved) {
          // Otomatik onaylandı
          setSuccess(true);
          setTimeout(() => {
            // Vendor token'ı varsa esnaf paneline, yoksa ana sayfaya yönlendir
            if (getAuthToken('vendor')) {
              router.push('/esnaf/panel');
            } else {
              router.push('/');
            }
          }, 3000);
        } else {
          // Manuel onay bekliyor
          setSuccess(true);
          setTimeout(() => {
            router.push('/musteri/panel');
          }, 3000);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Başvuru gönderilemedi');
      }
    } catch (err: any) {
      setError(err.message || 'Başvuru gönderilemedi');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <>
        <MusteriHeader />
        <main className="musteri-auth-main">
          <div className="musteri-auth-container">
            <div className="musteri-auth-card">
              <div className="musteri-success-message">
                <h2>Başvuru Başarılı!</h2>
                {user?.is_verified ? (
                  <>
                    <p>Hesabınız otomatik olarak esnaf hesabına yükseltildi!</p>
                    <p>Esnaf paneline yönlendiriliyorsunuz...</p>
                  </>
                ) : (
                  <>
                    <p>Esnaf yükseltme talebiniz alındı. Admin onayı bekleniyor.</p>
                    <p>Panel sayfasına yönlendiriliyorsunuz...</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }
  
  return (
    <>
      <main className="musteri-auth-main">
        <div className="musteri-auth-container">
          <div className="musteri-auth-card">
            <div className="musteri-auth-header">
              <h1 className="musteri-auth-title">Esnaf Ol</h1>
              <p className="musteri-auth-subtitle">
                Hizmet vermek için esnaf hesabına yükseltin
              </p>
            </div>
            
            {/* Bilgilendirme Mesajı */}
            {user && (
              <div className={`musteri-info-message ${user.is_verified ? 'musteri-info-success' : 'musteri-info-warning'}`}>
                {user.is_verified ? (
                  <>
                    <strong>✅ Hesabınız Doğrulanmış</strong>
                    <p>Başvurunuz onaylandıktan sonra hesabınız otomatik olarak esnaf hesabına yükseltilecek.</p>
                  </>
                ) : (
                  <>
                    <strong>⚠️ Hesap Doğrulaması Gerekli</strong>
                    <p>Esnaf olmak için önce hesabınızı doğrulamanız gerekiyor. Email veya SMS doğrulaması yapın.</p>
                  </>
                )}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="musteri-auth-form">
              {/* İşletme Bilgileri */}
              <div className="musteri-form-section">
                <h3 className="musteri-form-section-title">İşletme Bilgileri</h3>
                
                <div className="musteri-form-group">
                  <label htmlFor="business_type" className="musteri-form-label">
                    İşletme Türü *
                  </label>
                  <select
                    id="business_type"
                    name="business_type"
                    value={formData.business_type}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    required
                  >
                    <option value="">İşletme türü seçiniz</option>
                    <option value="sahis">Şahıs Şirketi</option>
                    <option value="limited">Limited Şirketi</option>
                    <option value="anonim">Anonim Şirketi</option>
                    <option value="esnaf">Esnaf</option>
                  </select>
                </div>
              </div>
              
              <div className="musteri-form-group">
                <label htmlFor="company_title" className="musteri-form-label">
                  Şirket Adı *
                </label>
                <input
                  type="text"
                  id="company_title"
                  name="company_title"
                  value={formData.company_title}
                  onChange={handleInputChange}
                  className="musteri-form-input"
                  placeholder="Şirket adınız"
                  required
                />
              </div>
              
              <div className="musteri-form-row">
                <div className="musteri-form-group">
                  <label htmlFor="tax_office" className="musteri-form-label">
                    Vergi Dairesi *
                  </label>
                  <input
                    type="text"
                    id="tax_office"
                    name="tax_office"
                    value={formData.tax_office}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="Vergi dairesi"
                    required
                  />
                </div>
                
                <div className="musteri-form-group">
                  <label htmlFor="tax_no" className="musteri-form-label">
                    Vergi Numarası *
                  </label>
                  <input
                    type="text"
                    id="tax_no"
                    name="tax_no"
                    value={formData.tax_no}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="9-11 haneli vergi no"
                    required
                    minLength={9}
                    maxLength={11}
                  />
                </div>
              </div>
              
              <div className="musteri-form-group">
                <label htmlFor="display_name" className="musteri-form-label">
                  Görünen Ad *
                </label>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  className="musteri-form-input"
                  placeholder="Müşterilerin göreceği ad"
                  required
                />
              </div>
              
              {/* Adres Bilgileri */}
              <div className="musteri-form-section">
                <h3 className="musteri-form-section-title">Adres Bilgileri</h3>
                
                <div className="musteri-form-row">
                  <div className="musteri-form-group">
                    <label htmlFor="city" className="musteri-form-label">
                      Şehir *
                    </label>
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={(e) => {
                        handleInputChange(e);
                        setDistricts(getDistricts(e.target.value));
                      }}
                      className="musteri-form-input"
                      required
                    >
                      <option value="">Şehir seçiniz</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="musteri-form-group">
                    <label htmlFor="district" className="musteri-form-label">
                      İlçe *
                    </label>
                    <select
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="musteri-form-input"
                      required
                      disabled={!formData.city}
                    >
                      <option value="">İlçe seçiniz</option>
                      {districts.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="musteri-form-group">
                  <label htmlFor="subdistrict" className="musteri-form-label">
                    Mahalle *
                  </label>
                  <input
                    type="text"
                    id="subdistrict"
                    name="subdistrict"
                    value={formData.subdistrict}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="Mahalle adı"
                    required
                  />
                </div>
                
                <div className="musteri-form-group">
                  <label htmlFor="address" className="musteri-form-label">
                    Açık Adres *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="Sokak, bina no, daire no vb."
                    required
                    rows={3}
                  />
                </div>
                
                <div className="musteri-form-group">
                  <label htmlFor="business_phone" className="musteri-form-label">
                    İşyeri Telefonu *
                  </label>
                  <input
                    type="tel"
                    id="business_phone"
                    name="business_phone"
                    value={formData.business_phone}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="0212 123 4567"
                    required
                  />
                </div>
              </div>
              
              {/* Yönetici Bilgileri */}
              <div className="musteri-form-row">
                <div className="musteri-form-group">
                  <label htmlFor="manager_birthdate" className="musteri-form-label">
                    Doğum Tarihi *
                  </label>
                  <input
                    type="date"
                    id="manager_birthdate"
                    name="manager_birthdate"
                    value={formData.manager_birthdate}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    required
                  />
                </div>
                
                <div className="musteri-form-group">
                  <label htmlFor="manager_tc" className="musteri-form-label">
                    TC Kimlik No *
                  </label>
                  <input
                    type="text"
                    id="manager_tc"
                    name="manager_tc"
                    value={formData.manager_tc}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="11 haneli TC no"
                    required
                    minLength={11}
                    maxLength={11}
                  />
                </div>
              </div>
              
              {/* Hizmet Bilgileri */}
              <div className="musteri-form-section">
                <h3 className="musteri-form-section-title">Hizmet Bilgileri</h3>
                
                <div className="musteri-form-group">
                  <label className="musteri-form-label">
                    Hizmet Alanları *
                  </label>
                  <div className="musteri-checkbox-group">
                    {services.map(service => (
                      <label key={service.id} className="musteri-checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.service_areas.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleMultiSelectChange('service_areas', [...formData.service_areas, service.id]);
                            } else {
                              handleMultiSelectChange('service_areas', formData.service_areas.filter(id => id !== service.id));
                            }
                          }}
                        />
                        {service.name}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="musteri-form-group">
                  <label className="musteri-form-label">
                    Kategoriler *
                  </label>
                  <div className="musteri-checkbox-group">
                    {categories.map(category => (
                      <label key={category.id} className="musteri-checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleMultiSelectChange('categories', [...formData.categories, category.id]);
                            } else {
                              handleMultiSelectChange('categories', formData.categories.filter(id => id !== category.id));
                            }
                          }}
                        />
                        {category.name}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="musteri-form-group">
                  <label className="musteri-form-label">
                    Hizmet Verilen Araba Markaları *
                  </label>
                  <div className="musteri-checkbox-group">
                    {carBrands.map(brand => (
                      <label key={brand.id} className="musteri-checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.car_brands.includes(brand.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleMultiSelectChange('car_brands', [...formData.car_brands, brand.id]);
                            } else {
                              handleMultiSelectChange('car_brands', formData.car_brands.filter(id => id !== brand.id));
                            }
                          }}
                        />
                        {brand.name}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="musteri-form-group">
                  <label htmlFor="about" className="musteri-form-label">
                    İşletme Hakkında
                  </label>
                  <textarea
                    id="about"
                    name="about"
                    value={formData.about}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="İşletmeniz hakkında kısa bir açıklama yazın"
                    rows={4}
                  />
                </div>
              </div>
              
              {/* Belgeler bölümü kaldırıldı */}
              
              {error && (
                <div className="musteri-error-message">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                className="musteri-auth-button"
                disabled={loading}
              >
                {loading ? "Başvuru gönderiliyor..." : "Başvuru Gönder"}
              </button>
            </form>
            
            <div className="musteri-auth-footer">
              <p>
                Zaten esnaf mısınız?{" "}
                <Link href="/esnaf/giris" className="musteri-auth-link-bold">
                  Giriş yapın
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
