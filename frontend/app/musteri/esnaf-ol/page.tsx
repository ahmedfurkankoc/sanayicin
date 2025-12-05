'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api, getAuthToken } from "@/app/utils/api";
import { useTurkeyData } from "@/app/hooks/useTurkeyData";
import { useMusteri } from "../context/MusteriContext";
import MusteriHeader from "../components/MusteriHeader";
import LocationPicker from "@/app/components/LocationPicker";
import OTPInput from "@/app/components/OTPInput";

// Validation fonksiyonları
const validateBusinessType = (type: string): boolean => {
  return ["sahis", "limited", "anonim", "esnaf"].includes(type);
};

const validateTC = (tc: string): boolean => {
  return /^\d{11}$/.test(tc);
};

const validateTaxNo = (taxNo: string): boolean => {
  return /^\d{9,11}$/.test(taxNo);
};

// Adım bilgileri
const steps = [
  { number: 1, label: "İşletme" },
  { number: 2, label: "Hizmet" },
  { number: 3, label: "İşyeri" },
  { number: 4, label: "Yetkili" },
  { number: 5, label: "Doğrulama" },
];

export default function EsnafOlPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading, refreshUser } = useMusteri();
  const { cities, loadTurkeyData, getDistricts, getNeighbourhoods } = useTurkeyData();
  
  const [step, setStep] = useState(1);
  const registerCardRef = useRef<HTMLDivElement | null>(null);

  // Adım değiştiğinde kartın tepesine yumuşak kaydır
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = registerCardRef.current;
    if (!el) return;
    try {
      const headerOffset = 100;
      const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    } catch {}
  }, [step]);

  // 1. Adım - İşletme Bilgileri
  const [selectedType, setSelectedType] = useState("");
  const [companyInfo, setCompanyInfo] = useState({
    title: "",
    taxOffice: "",
    taxNo: "",
    displayName: "",
    about: "",
  });
  const [businessError, setBusinessError] = useState("");

  // 2. Adım - Hizmet Bilgileri
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [carBrands, setCarBrands] = useState<any[]>([]);
  const [selectedCarBrands, setSelectedCarBrands] = useState<string[]>([]);
  const [serviceError, setServiceError] = useState("");

  // 3. Adım - İşyeri Bilgileri
  const [selectedCity, setSelectedCity] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [neighbourhoods, setNeighbourhoods] = useState<string[]>([]);
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState("");
  const [locationInfo, setLocationInfo] = useState({
    address: "",
    phone: "",
    photo: null as File | null,
    photoPreview: null as string | null,
  });
  const [location, setLocation] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [locationError, setLocationError] = useState("");

  // 4. Adım - Yetkili Bilgileri
  const [managerInfo, setManagerInfo] = useState({
    birthdate: "",
    tc: "",
  });
  const [managerError, setManagerError] = useState("");

  // 5. Adım - SMS OTP
  const [smsOtpError, setSmsOtpError] = useState<string>('');
  const [smsVerifying, setSmsVerifying] = useState<boolean>(false);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  
  // Şehir verisini yükle
  useEffect(() => {
    loadTurkeyData();
  }, [loadTurkeyData]);
  
  // Hizmet alanlarını çek
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.getServiceAreas();
        setServiceAreas(response.data);
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
  
  // Araç markalarını çek
  useEffect(() => {
    const fetchCarBrands = async () => {
      try {
        const response = await api.getCarBrands();
        setCarBrands(response.data);
      } catch (error) {
        console.error('Araç markaları yüklenemedi:', error);
      }
    };
    fetchCarBrands();
  }, []);

  // İl değişince ilçeleri güncelle
  useEffect(() => {
    if (selectedCity) {
      const cityDistricts = getDistricts(selectedCity);
      setDistricts(cityDistricts);
      setSelectedDistrict("");
      setSelectedNeighbourhood("");
      setNeighbourhoods([]);
    } else {
      setDistricts([]);
      setSelectedDistrict("");
      setNeighbourhoods([]);
      setSelectedNeighbourhood("");
    }
  }, [selectedCity, getDistricts]);

  // İlçe değişince semtleri güncelle
  useEffect(() => {
    if (selectedCity && selectedDistrict) {
      const districtNeighbourhoods = getNeighbourhoods(selectedCity, selectedDistrict);
      setNeighbourhoods(districtNeighbourhoods);
      setSelectedNeighbourhood("");
    } else {
      setNeighbourhoods([]);
      setSelectedNeighbourhood("");
    }
  }, [selectedCity, selectedDistrict, getNeighbourhoods]);

  // Photo preview cleanup
  useEffect(() => {
    return () => {
      if (locationInfo.photoPreview) {
        URL.revokeObjectURL(locationInfo.photoPreview);
      }
    };
  }, [locationInfo.photoPreview]);
  
  // Authentication kontrolü
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/musteri/giris?next=/musteri/esnaf-ol');
      return;
    }
    
    // is_verified durumunu kontrol et
    if (user && !user.is_verified) {
      toast.error("Esnaf olmak için önce hesabınızı doğrulamanız gerekiyor.");
      router.replace('/musteri/panel');
    }

    // Zaten vendor ise
    if (user && user.role === 'vendor') {
      toast.info("Zaten esnaf hesabınız bulunuyor.");
      router.replace('/esnaf/panel');
    }
  }, [authLoading, isAuthenticated, router, user]);
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLocationInfo((prev) => ({ 
      ...prev, 
      photo: file,
      photoPreview: file ? URL.createObjectURL(file) : null
    }));
  };

  // Adım 1: İşletme Bilgileri
  const handleStep1Next = () => {
    setBusinessError("");
    
    if (!selectedType || !validateBusinessType(selectedType)) {
      setBusinessError("Lütfen geçerli bir işletme türü seçin.");
      return;
    }
    
    if (!companyInfo.title.trim()) {
      setBusinessError("Şirket adı gereklidir.");
      return;
    }
    
    if (!companyInfo.taxOffice.trim()) {
      setBusinessError("Vergi dairesi gereklidir.");
      return;
    }
    
    if (!companyInfo.taxNo.trim() || !validateTaxNo(companyInfo.taxNo)) {
      setBusinessError("Geçerli bir vergi numarası girin (9-11 haneli).");
      return;
    }
    
    if (!companyInfo.displayName.trim()) {
      setBusinessError("Görünen ad gereklidir.");
      return;
    }
    
    setStep(2);
  };

  // Adım 2: Hizmet Bilgileri
  const handleStep2Next = () => {
    setServiceError("");
    
    if (!selectedService) {
      setServiceError("Lütfen en az bir hizmet alanı seçin.");
      return;
    }
    
    if (selectedCategories.length === 0) {
      setServiceError("Lütfen en az bir kategori seçin.");
      return;
    }
    
    setStep(3);
  };

  // Adım 3: İşyeri Bilgileri
  const handleStep3Next = () => {
    setLocationError("");
    
    if (!selectedCity) {
      setLocationError("Şehir seçimi gereklidir.");
      return;
    }
    
    if (!selectedDistrict) {
      setLocationError("İlçe seçimi gereklidir.");
      return;
    }
    
    if (!selectedNeighbourhood) {
      setLocationError("Semt seçimi gereklidir.");
      return;
    }
    
    if (!locationInfo.address.trim()) {
      setLocationError("Açık adres gereklidir.");
      return;
    }
    
    if (!locationInfo.phone.trim()) {
      setLocationError("İşyeri telefonu gereklidir.");
      return;
    }
    
    setStep(4);
  };

  // Adım 4: Yetkili Bilgileri
  const handleStep4Next = () => {
    setManagerError("");
    
    if (!managerInfo.birthdate) {
      setManagerError("Doğum tarihi gereklidir.");
      return;
    }
    
    if (!managerInfo.tc.trim() || !validateTC(managerInfo.tc)) {
      setManagerError("Geçerli bir TC kimlik numarası girin (11 haneli).");
      return;
    }
    
    // Formu gönder
    handleSubmitUpgrade();
  };

  // Form gönderimi
  const handleSubmitUpgrade = async () => {
    setManagerError("");
    setSmsOtpError("");
    
    try {
      const formData = new FormData();
      
      // İşletme bilgileri
      formData.append('business_type', selectedType);
      formData.append('company_title', companyInfo.title);
      formData.append('tax_office', companyInfo.taxOffice);
      formData.append('tax_no', companyInfo.taxNo);
      formData.append('display_name', companyInfo.displayName);
      if (companyInfo.about) {
        formData.append('about', companyInfo.about);
      }
      
      // Hizmet bilgileri
      formData.append('service_area', selectedService);
      selectedCategories.forEach(catId => {
        formData.append('categories', catId);
      });
      if (selectedCarBrands.length > 0) {
        selectedCarBrands.forEach(brandId => {
          formData.append('car_brands', brandId);
        });
      }
      
      // İşyeri bilgileri
      formData.append('city', selectedCity);
      formData.append('district', selectedDistrict);
      formData.append('subdistrict', selectedNeighbourhood);
      formData.append('address', locationInfo.address);
      formData.append('business_phone', locationInfo.phone);
      
      // Konum bilgileri (6 ondalık basamağa yuvarla)
      if (location.latitude !== null && location.longitude !== null) {
        const roundedLat = parseFloat(location.latitude.toFixed(6));
        const roundedLng = parseFloat(location.longitude.toFixed(6));
        formData.append('latitude', roundedLat.toString());
        formData.append('longitude', roundedLng.toString());
      }
      
      // Yetkili bilgileri
      formData.append('manager_birthdate', managerInfo.birthdate);
      formData.append('manager_tc', managerInfo.tc);
      
      // Avatar (varsa)
      if (locationInfo.photo) {
        formData.append('avatar', locationInfo.photo);
      }
      
      const response = await api.clientToVendorUpgrade(formData);
      
      if (response.status === 201) {
        setVerificationEmail(user?.email || '');
        setStep(5);
        toast.success("Esnaf profili oluşturuldu. SMS doğrulama kodu gönderildi.");
            } else {
        if (response.data?.errors) {
          const fieldNames: { [key: string]: string } = {
            'business_type': 'İşletme Türü',
            'company_title': 'Şirket Adı',
            'tax_office': 'Vergi Dairesi',
            'tax_no': 'Vergi Numarası',
            'display_name': 'Görünen Ad',
            'service_area': 'Hizmet Alanı',
            'categories': 'Kategoriler',
            'address': 'Adres',
            'city': 'İl',
            'district': 'İlçe',
            'subdistrict': 'Semt',
            'business_phone': 'İşyeri Telefonu',
            'manager_birthdate': 'Doğum Tarihi',
            'manager_tc': 'TC Kimlik No',
            'latitude': 'Enlem',
            'longitude': 'Boylam',
            'avatar': 'Profil Fotoğrafı'
          };
          const errorMessages = Object.entries(response.data.errors).map(([field, errors]) => {
            const fieldName = fieldNames[field] || field;
            const errorArray = Array.isArray(errors) ? errors : [errors];
            return `${fieldName}: ${errorArray.join(', ')}`;
          }).join('\n');
          setManagerError(errorMessages);
        } else {
          setManagerError(response.data?.detail || "Bir hata oluştu.");
        }
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const fieldNames: { [key: string]: string } = {
          'business_type': 'İşletme Türü',
          'company_title': 'Şirket Adı',
          'tax_office': 'Vergi Dairesi',
          'tax_no': 'Vergi Numarası',
          'display_name': 'Görünen Ad',
          'service_area': 'Hizmet Alanı',
          'categories': 'Kategoriler',
          'address': 'Adres',
          'city': 'İl',
          'district': 'İlçe',
          'subdistrict': 'Semt',
          'business_phone': 'İşyeri Telefonu',
          'manager_birthdate': 'Doğum Tarihi',
          'manager_tc': 'TC Kimlik No',
          'latitude': 'Enlem',
          'longitude': 'Boylam',
          'avatar': 'Profil Fotoğrafı'
        };
        const errorMessages = Object.entries(err.response.data.errors).map(([field, errors]) => {
          const fieldName = fieldNames[field] || field;
          const errorArray = Array.isArray(errors) ? errors : [errors];
          return `${fieldName}: ${errorArray.join(', ')}`;
        }).join('\n');
        setManagerError(errorMessages);
      } else {
        setManagerError(err.response?.data?.detail || err.response?.data?.error || "Bir hata oluştu.");
      }
    }
  };

  // SMS OTP doğrulama
  const handleSMSOTPComplete = async (code: string) => {
    setSmsOtpError('');
    setSmsVerifying(true);
    
    try {
      const response = await api.verifySMSCode({
        email: verificationEmail || user?.email || '',
        code: code
      });
      
      if (response.data.message) {
        toast.success(response.data.message);
        await refreshUser();
        setTimeout(() => {
          router.push('/esnaf/panel');
        }, 2000);
      }
    } catch (err: any) {
      setSmsOtpError(err.response?.data?.error || 'Doğrulama kodu geçersiz. Lütfen tekrar deneyin.');
    } finally {
      setSmsVerifying(false);
    }
  };

  // SMS OTP yeniden gönder
  const handleResendSMSOTP = async () => {
    setSmsOtpError('');
    try {
      await api.sendSMSVerification({
        email: verificationEmail || user?.email || '',
        phone_number: user?.phone_number || ''
      });
      toast.success('SMS doğrulama kodu yeniden gönderildi.');
    } catch (err: any) {
      setSmsOtpError(err.response?.data?.error || 'SMS gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  if (authLoading) {
    return (
      <>
        <MusteriHeader />
        <main className="musteri-auth-main">
          <div className="musteri-auth-container">
            <div className="musteri-auth-card">
              <p>Yükleniyor...</p>
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
          <div className="musteri-auth-card" ref={registerCardRef}>
            <div className="musteri-auth-header">
              <h1 className="musteri-auth-title">Esnaf Ol</h1>
              <p className="musteri-auth-subtitle">
                Hizmet vermek için esnaf hesabına yükseltin
              </p>
            </div>
            
            {/* Adım Göstergesi */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '30px',
              position: 'relative'
            }}>
              {steps.map((s, index) => (
                <React.Fragment key={s.number}>
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: step === s.number ? '#FFD700' : step > s.number ? '#FFA500' : '#e0e0e0',
                      color: step >= s.number ? '#000' : '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      border: step === s.number ? '2px solid #FFD700' : 'none',
                      boxShadow: step === s.number ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
                    }}>
                      {step > s.number ? '✓' : s.number}
                    </div>
                    <span style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: step === s.number ? '#FFD700' : step > s.number ? '#FFA500' : '#666',
                      textAlign: 'center',
                      fontWeight: step === s.number ? 'bold' : 'normal'
                    }}>
                      {s.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: `${(index + 1) * (100 / steps.length)}%`,
                      width: `${100 / steps.length - 20}%`,
                      height: '2px',
                      backgroundColor: step > s.number ? '#FFA500' : step === s.number ? '#FFD700' : '#e0e0e0',
                      zIndex: 0
                    }} />
                  )}
                </React.Fragment>
              ))}
              </div>

            {/* Adım 1: İşletme Bilgileri */}
            {step === 1 && (
              <div>
                <div className="musteri-form-group">
                  <label className="musteri-form-label">İşletme Türü *</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
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
              
              <div className="musteri-form-group">
                  <label className="musteri-form-label">Şirket Adı *</label>
                <input
                  type="text"
                    value={companyInfo.title}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, title: e.target.value }))}
                  className="musteri-form-input"
                  placeholder="Şirket adınız"
                  required
                />
              </div>
              
              <div className="musteri-form-row">
                <div className="musteri-form-group">
                    <label className="musteri-form-label">Vergi Dairesi *</label>
                  <input
                    type="text"
                      value={companyInfo.taxOffice}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, taxOffice: e.target.value }))}
                    className="musteri-form-input"
                    placeholder="Vergi dairesi"
                    required
                  />
                </div>
                
                <div className="musteri-form-group">
                    <label className="musteri-form-label">Vergi Numarası *</label>
                  <input
                    type="text"
                      value={companyInfo.taxNo}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, taxNo: e.target.value.replace(/\D/g, '') }))}
                    className="musteri-form-input"
                    placeholder="9-11 haneli vergi no"
                    required
                    minLength={9}
                    maxLength={11}
                  />
                </div>
              </div>
              
              <div className="musteri-form-group">
                  <label className="musteri-form-label">Görünen Ad *</label>
                <input
                  type="text"
                    value={companyInfo.displayName}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, displayName: e.target.value }))}
                  className="musteri-form-input"
                  placeholder="Müşterilerin göreceği ad"
                  required
                />
              </div>
              
                <div className="musteri-form-group">
                  <label className="musteri-form-label">İşletme Hakkında</label>
                  <textarea
                    value={companyInfo.about}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, about: e.target.value }))}
                    className="musteri-form-input"
                    placeholder="İşletmeniz hakkında kısa bir açıklama yazın"
                    rows={4}
                  />
                </div>

                {businessError && (
                  <div className="musteri-error-message">{businessError}</div>
                )}

                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="musteri-auth-button"
                >
                  İleri
                </button>
              </div>
            )}

            {/* Adım 2: Hizmet Bilgileri */}
            {step === 2 && (
              <div>
                <div className="musteri-form-group">
                  <label className="musteri-form-label">Hizmet Alanı *</label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="musteri-form-input"
                    required
                  >
                    <option value="">Hizmet alanı seçiniz</option>
                    {serviceAreas.map(service => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>

                <div className="musteri-form-group">
                  <label className="musteri-form-label">Kategoriler *</label>
                  <div className="musteri-checkbox-group">
                    {categories.map(category => (
                      <label key={category.id} className="musteri-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, category.id.toString()]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(id => id !== category.id.toString()));
                            }
                          }}
                        />
                        {category.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="musteri-form-group">
                  <label className="musteri-form-label">Hizmet Verilen Araç Markaları</label>
                  <div className="musteri-checkbox-group">
                    {carBrands.map(brand => (
                      <label key={brand.id} className="musteri-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedCarBrands.includes(brand.id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCarBrands([...selectedCarBrands, brand.id.toString()]);
                            } else {
                              setSelectedCarBrands(selectedCarBrands.filter(id => id !== brand.id.toString()));
                            }
                          }}
                        />
                        {brand.name}
                      </label>
                    ))}
                  </div>
                </div>

                {serviceError && (
                  <div className="musteri-error-message">{serviceError}</div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="musteri-auth-button"
                    style={{ backgroundColor: '#666' }}
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={handleStep2Next}
                    className="musteri-auth-button"
                  >
                    İleri
                  </button>
                </div>
              </div>
            )}

            {/* Adım 3: İşyeri Bilgileri */}
            {step === 3 && (
              <div>
                <div className="musteri-form-row">
                  <div className="musteri-form-group">
                    <label className="musteri-form-label">Şehir *</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value);
                        const cityDistricts = getDistricts(e.target.value);
                        setDistricts(cityDistricts);
                        setSelectedDistrict("");
                        setSelectedNeighbourhood("");
                        setNeighbourhoods([]);
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
                    <label className="musteri-form-label">İlçe *</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                        if (selectedCity && e.target.value) {
                          const districtNeighbourhoods = getNeighbourhoods(selectedCity, e.target.value);
                          setNeighbourhoods(districtNeighbourhoods);
                          setSelectedNeighbourhood("");
                        }
                      }}
                      className="musteri-form-input"
                      required
                      disabled={!selectedCity}
                    >
                      <option value="">İlçe seçiniz</option>
                      {districts.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="musteri-form-group">
                  <label className="musteri-form-label">Semt *</label>
                  <select
                    value={selectedNeighbourhood}
                    onChange={(e) => setSelectedNeighbourhood(e.target.value)}
                    className="musteri-form-input"
                    required
                    disabled={!selectedDistrict}
                  >
                    <option value="">Semt seçiniz</option>
                    {neighbourhoods.map(neighbourhood => (
                      <option key={neighbourhood} value={neighbourhood}>{neighbourhood}</option>
                    ))}
                  </select>
                </div>
                
                <div className="musteri-form-group">
                  <label className="musteri-form-label">Açık Adres *</label>
                  <textarea
                    value={locationInfo.address}
                    onChange={(e) => setLocationInfo(prev => ({ ...prev, address: e.target.value }))}
                    className="musteri-form-input"
                    placeholder="Sokak, bina no, daire no vb."
                    required
                    rows={3}
                  />
                </div>
                
                <div className="musteri-form-group">
                  <label className="musteri-form-label">İşyeri Telefonu *</label>
                  <input
                    type="tel"
                    value={locationInfo.phone}
                    onChange={(e) => setLocationInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="musteri-form-input"
                    placeholder="0212 123 4567"
                    required
                  />
                </div>

                <div className="musteri-form-group">
                  <label className="musteri-form-label">Konum (Opsiyonel)</label>
                  <LocationPicker
                    onLocationChange={(lat, lng) => {
                      setLocation({ latitude: lat, longitude: lng });
                    }}
                    initialLat={location.latitude || undefined}
                    initialLng={location.longitude || undefined}
                  />
              </div>
              
                <div className="musteri-form-group">
                  <label className="musteri-form-label">Profil Fotoğrafı (Opsiyonel)</label>
                  {locationInfo.photoPreview && (
                    <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                      <img 
                        src={locationInfo.photoPreview} 
                        alt="Profil Fotoğrafı Önizleme" 
                        style={{ 
                          width: '150px', 
                          height: '150px', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          border: '2px solid #ddd',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }}
                      />
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                        Yeni profil fotoğrafı önizleme
                      </div>
                    </div>
                  )}
                  <div style={{
                    border: '2px dashed #ddd',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: locationInfo.photoPreview ? '#fafafa' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.backgroundColor = '#fffef5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ddd';
                    e.currentTarget.style.backgroundColor = locationInfo.photoPreview ? '#fafafa' : '#fff';
                  }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="musteri-file-input"
                      id="avatar-upload"
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="avatar-upload"
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{ color: '#666', fontSize: '14px' }}>
                        {locationInfo.photo ? 'Profil fotoğrafını değiştir' : 'Profil fotoğrafı seç'}
                      </span>
                      <span style={{ color: '#999', fontSize: '12px' }}>
                        Maksimum 5MB, JPG, PNG
                      </span>
                  </label>
                  </div>
                </div>

                {locationError && (
                  <div className="musteri-error-message">{locationError}</div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="musteri-auth-button"
                    style={{ backgroundColor: '#666' }}
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={handleStep3Next}
                    className="musteri-auth-button"
                  >
                    İleri
                  </button>
                </div>
              </div>
            )}

            {/* Adım 4: Yetkili Bilgileri */}
            {step === 4 && (
              <div>
                <div className="musteri-form-row">
                  <div className="musteri-form-group">
                    <label className="musteri-form-label">Doğum Tarihi *</label>
                  <input
                    type="date"
                      value={managerInfo.birthdate}
                      onChange={(e) => setManagerInfo(prev => ({ ...prev, birthdate: e.target.value }))}
                    className="musteri-form-input"
                    required
                  />
                </div>
                
                <div className="musteri-form-group">
                    <label className="musteri-form-label">TC Kimlik No *</label>
                  <input
                    type="text"
                      value={managerInfo.tc}
                      onChange={(e) => setManagerInfo(prev => ({ ...prev, tc: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                    className="musteri-form-input"
                    placeholder="11 haneli TC no"
                    required
                    minLength={11}
                    maxLength={11}
                  />
                </div>
              </div>
              
                {managerError && (
                  <div className="musteri-error-message">{managerError}</div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="musteri-auth-button"
                    style={{ backgroundColor: '#666' }}
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={handleStep4Next}
                    className="musteri-auth-button"
                    disabled={smsVerifying}
                  >
                    {smsVerifying ? "Gönderiliyor..." : "Başvuru Gönder"}
                  </button>
                </div>
              </div>
            )}

            {/* Adım 5: SMS OTP Doğrulama */}
            {step === 5 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>SMS Doğrulama</h2>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    {user?.phone_number ? (
                      <>
                        <strong>{user.phone_number}</strong> numarasına gönderilen doğrulama kodunu girin.
                      </>
                    ) : (
                      'Telefon numaranıza gönderilen doğrulama kodunu girin.'
                    )}
                  </p>
                </div>
                
                <OTPInput
                  length={6}
                  onComplete={handleSMSOTPComplete}
                  onResend={handleResendSMSOTP}
                  error={smsOtpError}
                  disabled={smsVerifying}
                  autoFocus={true}
                />

                {smsOtpError && (
                  <div className="musteri-error-message" style={{ marginTop: '15px' }}>
                    {smsOtpError}
                  </div>
                )}

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="musteri-auth-button"
                    style={{ backgroundColor: '#666', width: '100%' }}
                  >
                    Geri
                  </button>
                </div>
                </div>
              )}
            
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
