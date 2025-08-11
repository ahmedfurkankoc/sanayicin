'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/app/utils/api";

// UI Components
import EsnafFooter from "../components/EsnafFooter";
import EsnafAuthHeader from "../components/EsnafAuthHeader";

// Hooks
import { useTurkeyData } from "@/app/hooks/useTurkeyData";
import { useEsnaf } from "../context/EsnafContext";




// Validation fonksiyonları
const validateBusinessType = (type: string): boolean => {
  return ["sahis", "limited", "anonim", "esnaf"].includes(type);
};

const validateServiceArea = (serviceAreaId: string, validServiceAreas: any[]): boolean => {
  return validServiceAreas.some(area => area.id.toString() === serviceAreaId);
};

const validateCategories = (categoryIds: string[], validCategories: any[]): boolean => {
  return categoryIds.every(catId => 
    validCategories.some(cat => cat.id.toString() === catId)
  );
};

const validateEmail = (email: string): boolean => {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
};

const validateTC = (tc: string): boolean => {
  return /^\d{11}$/.test(tc);
};

const validatePhone = (phone: string): boolean => {
  return /^[\d\s\-\+\(\)]{10,15}$/.test(phone);
};

const validateTaxNo = (taxNo: string): boolean => {
  return /^\d{10}$/.test(taxNo);
};

// Güvenlik: Sadece izin verilen değerler
const businessTypes = [
  { value: "sahis", label: "Şahıs Şirketi" },
  { value: "limited", label: "Limited Şirketi" },
  { value: "anonim", label: "Anonim Şirketi" },
  { value: "esnaf", label: "Esnaf" },
];

export default function EsnafKayitPage() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Turkey data hook'u kullan
  const { cities, isLoading: isLoadingCities, loadTurkeyData, getDistricts, getNeighbourhoods } = useTurkeyData();
  
  // İl, ilçe, semt state'leri
  const [selectedCity, setSelectedCity] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [neighbourhoods, setNeighbourhoods] = useState<string[]>([]);
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState("");

  // 3. adım state
  const [companyInfo, setCompanyInfo] = useState({
    title: "",
    taxOffice: "",
    taxNo: "",
    displayName: "",
    about: "",
    photo: null as File | null,
    photoName: "",
    phone: "",
    city: "",
    district: "",
    subdistrict: "",
    address: "",
    location: "",
  });
  const [companyError, setCompanyError] = useState("");

  // 4. adım state
  const [managerInfo, setManagerInfo] = useState({
    firstName: "",
    lastName: "",
    birthdate: "",
    tc: "",
    phone: "",
    email: "",
    password: "",
    password2: "",
    agreement: false,
  });
  const [managerError, setManagerError] = useState("");

  // 5. adım - Doğrulama seçimi state
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms' | null>('email');
  const [verificationError, setVerificationError] = useState("");

  // 6. adım - Email doğrulama state
  const [verificationEmail, setVerificationEmail] = useState<string>('');

  const router = useRouter();
  const { isAuthenticated, refreshUser } = useEsnaf();

  // Eğer kullanıcı zaten giriş yapmışsa panel'e yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/esnaf/panel");
    }
  }, [isAuthenticated, router]);

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
      setSelectedNeighbourhood("");
      setNeighbourhoods([]);
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

  // Service areas ve categories'leri yükle
  useEffect(() => {
    const loadServiceAreas = async () => {
      try {
        const serviceAreasRes = await api.getServiceAreas();
        setServiceAreas(serviceAreasRes.data);
      } catch (error) {
        console.error("Hizmet alanları yüklenirken hata:", error);
      }
    };
    loadServiceAreas();
  }, []);

  // Hizmet alanı değişince ilgili kategorileri yükle
  useEffect(() => {
    const loadCategories = async () => {
      if (selectedService) {
        try {
          const categoriesRes = await api.getCategoriesByServiceArea(selectedService);
          setCategories(categoriesRes.data);
        } catch (error) {
          setCategories([]);
        }
      } else {
        setCategories([]);
      }
    };
    loadCategories();
  }, [selectedService]);

  // Eğer giriş yapılmışsa loading göster
  if (isAuthenticated) {
    return (
      <>
      <EsnafAuthHeader title={'Esnaf Kayıt'} currentPage="register" />
      <main className="esnaf-register-main">
        <div className="esnaf-register-container">
          <div className="esnaf-register-loading">
            <p>Yönlendiriliyor...</p>
          </div>
        </div>
      </main>
      <EsnafFooter />
      </>
    );
  }

  // 1. Adım: İşletme Türü
  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    // Güvenlik: Business type validation
    if (!validateBusinessType(selectedType)) {
      toast.error('Geçersiz işletme türü seçildi!');
      return;
    }
    if (!selectedType) {
      toast.error('Lütfen işletme türü seçin!');
      return;
    }
    setStep(2);
  };

  // 2. Adım: Hizmet Alanı & Kategori
  const handleServiceChange = (val: string) => {
    // Güvenlik: Service area validation
    if (!validateServiceArea(val, serviceAreas)) {
      toast.error('Geçersiz hizmet alanı seçildi!');
      return;
    }
    setSelectedService(val);
    setSelectedCategories([]); // Reset categories when service changes
  };
  
  const handleCategoryToggle = (cat: string) => {
    // Güvenlik: Category validation
    if (!validateCategories([cat], categories)) {
      toast.error('Geçersiz kategori seçildi!');
      return;
    }
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };
  
  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    // Güvenlik: Service area ve categories validation
    if (!selectedService) {
      toast.error('Lütfen hizmet alanı seçin!');
      return;
    }
    if (!validateServiceArea(selectedService, serviceAreas)) {
      toast.error('Geçersiz hizmet alanı!');
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error('Lütfen en az bir kategori seçin!');
      return;
    }
    if (!validateCategories(selectedCategories, categories)) {
      toast.error('Geçersiz kategoriler seçildi!');
      return;
    }
    setStep(3);
  };
  const handleBackStep2 = () => setStep(1);

  // 3. Adım: İş yeri bilgileri
  const handleCompanyInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyInfo((prev) => ({ ...prev, [name]: value }));
  };
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCompanyInfo((prev) => ({ ...prev, photo: file, photoName: file ? file.name : "" }));
  };
  const handleBackStep3 = () => setStep(2);
  const handleNextStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError("");
    const { title, taxOffice, taxNo, displayName, about, phone, address } = companyInfo;
    
    // Zorunlu alan kontrolü
    if (!title || !taxOffice || !taxNo || !displayName || !phone || !selectedCity || !selectedDistrict || !selectedNeighbourhood || !address) {
      setCompanyError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    
    // Vergi numarası validation - işletme türüne göre
    const isIndividualBusiness = selectedType === "sahis" || selectedType === "esnaf";
    if (isIndividualBusiness) {
      // Şahıs/Esnaf için TC kimlik numarası (11 haneli)
      if (!validateTC(taxNo)) {
        setCompanyError("TC kimlik numarası 11 haneli olmalı ve sadece rakam içermelidir.");
        return;
      }
    } else {
      // Şirket için vergi numarası (10 haneli)
      if (!validateTaxNo(taxNo)) {
        setCompanyError("Vergi numarası 10 haneli olmalı ve sadece rakam içermelidir.");
        return;
      }
    }
    
    if (!validatePhone(phone)) {
      setCompanyError("Geçersiz telefon numarası formatı.");
      return;
    }
    
    // Şirket adı güvenlik kontrolü (XSS ve injection koruması)
    if (title.length > 200) {
      setCompanyError("Şirket adı çok uzun (maksimum 200 karakter).");
      return;
    }
    if (/[<>"']/.test(title)) {
      setCompanyError("Şirket adında geçersiz karakterler var.");
      return;
    }
    
    // Görünen ad güvenlik kontrolü
    if (displayName.length > 100) {
      setCompanyError("Görünen ad çok uzun (maksimum 100 karakter).");
      return;
    }
    if (/[<>"']/.test(displayName)) {
      setCompanyError("Görünen adında geçersiz karakterler var.");
      return;
    }
    

    
    setStep(4);
  };

  // 4. Adım: Yetkili kişi bilgileri
  const handleManagerInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setManagerInfo((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleBackStep4 = () => setStep(3);
  
  const handleVerificationMethodSelect = (method: 'email' | 'sms') => {
    // SMS seçeneği devre dışı, sadece email seçilebilir
    if (method === 'sms') {
      return; // SMS seçimini engelle
    }
    setVerificationMethod(method);
    setVerificationError("");
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError("");

    if (!verificationMethod) {
      setVerificationError("Lütfen bir doğrulama yöntemi seçin.");
      return;
    }

    try {
      if (verificationMethod === 'email') {
        // Email doğrulama gönder
        const response = await api.sendVerificationEmail({
          email: managerInfo.email
        });
        
        if (response.status === 200) {
          setVerificationEmail(managerInfo.email);
          setStep(6); // Email verification step
        } else {
          setVerificationError("Email gönderilemedi. Lütfen tekrar deneyin.");
        }
      } else if (verificationMethod === 'sms') {
        // SMS doğrulama devre dışı
        setVerificationError("SMS doğrulama şu anda kullanılamıyor. Lütfen email doğrulama seçin.");
        return;
      }
    } catch (err: any) {
      console.log(err);
      let errorMsg = "Doğrulama gönderilemedi. Lütfen tekrar deneyin.";
      if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }
      setVerificationError(errorMsg);
    }
  };

  const handleSubmitManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setManagerError("");
    const { firstName, lastName, birthdate, tc, phone, email, password, password2, agreement } = managerInfo;
    
    // Güvenlik: Kapsamlı validation
    if (!firstName || !lastName || !birthdate || !tc || !phone || !email || !password || !password2) {
      setManagerError("Lütfen tüm alanları doldurun.");
      return;
    }
    
    if (!validateEmail(email)) {
      setManagerError("Geçerli bir e-posta adresi girin.");
      return;
    }
    
    if (!validateTC(tc)) {
      setManagerError("Geçerli bir TC kimlik numarası girin (11 haneli).");
      return;
    }
    
    if (!validatePhone(phone)) {
      setManagerError("Geçerli bir telefon numarası girin.");
      return;
    }
    
    if (password !== password2) {
      setManagerError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setManagerError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (!agreement) {
      setManagerError("Sözleşmeyi ve gizlilik politikasını kabul etmelisiniz.");
      return;
    }
    
    // Yönetici adı güvenlik kontrolü (API'deki validation)
    if (firstName.length > 100) {
      setManagerError("Yönetici adı çok uzun (maksimum 100 karakter).");
      return;
    }
    if (/[<>"']/.test(firstName)) {
      setManagerError("Yönetici adında geçersiz karakterler var.");
      return;
    }
    
    if (lastName.length > 100) {
      setManagerError("Yönetici soyadı çok uzun (maksimum 100 karakter).");
      return;
    }
    if (/[<>"']/.test(lastName)) {
      setManagerError("Yönetici soyadında geçersiz karakterler var.");
      return;
    }
    
    // Güvenlik: Son validation kontrolü
    if (!validateBusinessType(selectedType)) {
      setManagerError("Geçersiz işletme türü!");
      return;
    }
    
    if (!validateServiceArea(selectedService, serviceAreas)) {
      setManagerError("Geçersiz hizmet alanı!");
      return;
    }
    
    if (!validateCategories(selectedCategories, categories)) {
      setManagerError("Geçersiz kategoriler!");
      return;
    }
    
    // API'ye başvuru gönder
    try {
      // FormData oluştur (dosya upload için)
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('password2', password2);
      formData.append('business_type', selectedType);
             formData.append('service_area', selectedService);
      selectedCategories.forEach(cat => formData.append('categories', cat));
      formData.append('company_title', companyInfo.title);
      formData.append('tax_office', companyInfo.taxOffice);
      formData.append('tax_no', companyInfo.taxNo);
      formData.append('display_name', companyInfo.displayName);
      formData.append('about', companyInfo.about);
      if (companyInfo.photo) {
        formData.append('profile_photo', companyInfo.photo);
      }
      formData.append('business_phone', companyInfo.phone);
      formData.append('city', selectedCity);
      formData.append('district', selectedDistrict);
      formData.append('subdistrict', selectedNeighbourhood);
      formData.append('address', companyInfo.address);
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('manager_birthdate', managerInfo.birthdate);
      formData.append('manager_tc', tc);
      formData.append('phone_number', phone);

      const res = await api.register(formData);
      const data = res.data;
      if (res.status !== 201) { // 201 Created
        console.log("Registration error:", data);
        if (data.errors) {
          const errorMessages = Object.entries(data.errors).map(([field, errors]) => {
            return `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`;
          }).join('; ');
          setManagerError(errorMessages);
        } else {
          setManagerError(data.detail || "Bir hata oluştu.");
        }
        return;
      }
      // Email bilgisini localStorage'a kaydet
      if (typeof window !== "undefined") {
        localStorage.setItem("esnaf_email", email);
        // Password'ü hash'leyerek sakla (email verification sonrası login için)
        const hashedPassword = btoa(password); // Base64 encoding (basit hash)
        localStorage.setItem("esnaf_temp_password_hash", hashedPassword);
      }
      // Doğrulama seçimi adımına yönlendir
      setStep(5); // Verification method selection step
      setVerificationEmail(email); // Email'i sakla
    } catch (err: any) {
      console.log(err);
      // Backend'den dönen hata mesajını göster
      let errorMsg = "Sunucu hatası. Lütfen tekrar deneyin.";
      if (err.response) {
        if (err.response.data) {
          if (typeof err.response.data.detail === "string") {
            errorMsg = err.response.data.detail;
          } else if (typeof err.response.data === "string") {
            errorMsg = err.response.data;
          } else if (typeof err.response.data === "object") {
            // Django REST Framework validation error formatı
            errorMsg = Object.values(err.response.data).flat().join("\n");
          }
        }
      }
      setManagerError(errorMsg);
    }
  };

  return (
    <>
    <EsnafAuthHeader title={'Esnaf Kayıt'} currentPage="register" />
    <main className="esnaf-register-main">
      <div className="esnaf-register-container">
        <h1 className="esnaf-register-title">Hesabınızı Oluşturun</h1>
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="esnaf-register-form">
            <label className="esnaf-register-label">İşletme Türü Seçiniz:</label>
            <div className="esnaf-business-types">
              {businessTypes.map((type) => (
                <label key={type.value} className={`esnaf-business-type-option${selectedType === type.value ? " selected" : ""}`}>
                  <input
                    type="radio"
                    name="businessType"
                    value={type.value}
                    checked={selectedType === type.value}
                    onChange={() => setSelectedType(type.value)}
                    required
                  />
                  {type.label}
                </label>
              ))}
            </div>
            <button type="submit" className="esnaf-register-next-btn" disabled={!selectedType}>
              Sonraki Adım
            </button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="esnaf-register-form">
            <label className="esnaf-register-label">Hizmet Verdiğiniz Alan:</label>
            <select
              className="esnaf-register-input"
              value={selectedService}
              onChange={e => handleServiceChange(e.target.value)}
              required
            >
              <option value="">Seçiniz</option>
              {serviceAreas.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
            {selectedService && (
              <>
                <label className="esnaf-register-label" style={{ marginTop: 18 }}>Arama Listelerinde Yer Almak İstediğiniz Kategoriler:</label>
                <div className="esnaf-categories-box">
                  {categories.length === 0 && <div>Kategori bulunamadı.</div>}
                  {categories.map((cat) => (
                    <label key={cat.id} className={`esnaf-category-option${selectedCategories.includes(String(cat.id)) ? " selected" : ""}`}>
                      <input
                        type="checkbox"
                        name="categories"
                        value={cat.id}
                        checked={selectedCategories.includes(String(cat.id))}
                        onChange={() => handleCategoryToggle(String(cat.id))}
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </>
            )}
            <div className="esnaf-register-step-btns">
              <button type="button" className="esnaf-register-back-btn" onClick={handleBackStep2}>
                Geri
              </button>
              <button
                type="submit"
                className="esnaf-register-next-btn"
                disabled={!selectedService || selectedCategories.length === 0}
              >
                Sonraki Adım
              </button>
            </div>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleNextStep3} className="esnaf-register-form">
            <label className="esnaf-register-label">İşyeri Unvanı</label>
            <input
              type="text"
              name="title"
              className="esnaf-register-input"
              value={companyInfo.title}
              onChange={handleCompanyInput}
              required
            />
            <label className="esnaf-register-label">Vergi Dairesi</label>
            <input
              type="text"
              name="taxOffice"
              className="esnaf-register-input"
              value={companyInfo.taxOffice}
              onChange={handleCompanyInput}
              required
            />
            <label className="esnaf-register-label">
              {selectedType === "sahis" || selectedType === "esnaf" 
                ? "TC Kimlik Numarası" 
                : "Vergi Numarası"}
            </label>
            <input
              type="text"
              name="taxNo"
              className="esnaf-register-input"
              value={companyInfo.taxNo}
              onChange={handleCompanyInput}
              placeholder={selectedType === "sahis" || selectedType === "esnaf" 
                ? "11 haneli TC kimlik numarası" 
                : "10 haneli vergi numarası"}
              required
            />
            <label className="esnaf-register-label">Profilde Görünecek İşyeri İsmi</label>
            <input
              type="text"
              name="displayName"
              className="esnaf-register-input"
              value={companyInfo.displayName}
              onChange={handleCompanyInput}
              required
            />
            <label className="esnaf-register-label">Firmanız Hakkında</label>
            <textarea
              name="about"
              className="esnaf-register-input"
              value={companyInfo.about}
              onChange={handleCompanyInput}
              required
              rows={3}
            />
            <label className="esnaf-register-label">Profil Fotoğrafı</label>
            <input
              type="file"
              name="photo"
              className="esnaf-register-input"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            {companyInfo.photoName && (
              <div className="esnaf-photo-filename">Seçilen dosya: {companyInfo.photoName}</div>
            )}
            <label className="esnaf-register-label">İşyeri Telefon Numarası</label>
            <input
              type="tel"
              name="phone"
              className="esnaf-register-input"
              value={companyInfo.phone}
              onChange={handleCompanyInput}
              required
            />
            <label className="esnaf-register-label">İşyeri İli</label>
            <select
              className="esnaf-register-input"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              onFocus={loadTurkeyData}
              required
            >
              <option value="">İl Seçiniz</option>
              {isLoadingCities && <option value="" disabled>Yükleniyor...</option>}
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <label className="esnaf-register-label">İşyeri İlçesi</label>
            <select
              className="esnaf-register-input"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              required
              disabled={!selectedCity}
            >
              <option value="">İlçe Seçiniz</option>
              {districts.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
            <label className="esnaf-register-label">İşyeri Semti</label>
            <select
              className="esnaf-register-input"
              value={selectedNeighbourhood}
              onChange={(e) => setSelectedNeighbourhood(e.target.value)}
              required
              disabled={!selectedDistrict}
            >
              <option value="">Semt Seçiniz</option>
              {neighbourhoods.map((neighbourhood) => (
                <option key={neighbourhood} value={neighbourhood}>{neighbourhood}</option>
              ))}
            </select>
            <label className="esnaf-register-label">Açık Adres</label>
            <input
              type="text"
              name="address"
              className="esnaf-register-input"
              value={companyInfo.address}
              onChange={handleCompanyInput}
              required
            />

            {companyError && <div className="esnaf-register-error">{companyError}</div>}
            <div className="esnaf-register-step-btns">
              <button type="button" className="esnaf-register-back-btn" onClick={handleBackStep3}>
                Geri
              </button>
              <button type="submit" className="esnaf-register-next-btn">
                Sonraki Adım
              </button>
            </div>
          </form>
        )}
        {step === 4 && (
          <form onSubmit={handleSubmitManager} className="esnaf-register-form">
            <div className="esnaf-name-row">
              <div className="esnaf-name-field">
                <label className="esnaf-register-label">Ad</label>
                <input
                  type="text"
                  name="firstName"
                  className="esnaf-register-input"
                  value={managerInfo.firstName}
                  onChange={handleManagerInput}
                  required
                />
              </div>
              <div className="esnaf-name-field">
                <label className="esnaf-register-label">Soyad</label>
                <input
                  type="text"
                  name="lastName"
                  className="esnaf-register-input"
                  value={managerInfo.lastName}
                  onChange={handleManagerInput}
                  required
                />
              </div>
            </div>
            <label className="esnaf-register-label">Doğum Tarihi</label>
            <input
              type="date"
              name="birthdate"
              className="esnaf-register-input"
              value={managerInfo.birthdate}
              onChange={handleManagerInput}
              required
            />
            <label className="esnaf-register-label">TC Kimlik No</label>
            <input
              type="text"
              name="tc"
              className="esnaf-register-input"
              value={managerInfo.tc}
              onChange={handleManagerInput}
              required
            />
            <label className="esnaf-register-label">Cep Telefonu</label>
            <input
              type="tel"
              name="phone"
              className="esnaf-register-input"
              value={managerInfo.phone}
              onChange={handleManagerInput}
              required
            />
            <label className="esnaf-register-label">E-posta</label>
            <input
              type="email"
              name="email"
              className="esnaf-register-input"
              value={managerInfo.email}
              onChange={handleManagerInput}
              required
            />
            <label className="esnaf-register-label">Şifre</label>
            <input
              type="password"
              name="password"
              className="esnaf-register-input"
              value={managerInfo.password}
              onChange={handleManagerInput}
              required
              autoComplete="new-password"
            />
            <label className="esnaf-register-label">Şifre Tekrar</label>
            <input
              type="password"
              name="password2"
              className="esnaf-register-input"
              value={managerInfo.password2}
              onChange={handleManagerInput}
              required
              autoComplete="new-password"
            />
            <label className="esnaf-register-checkbox-label">
              <input
                type="checkbox"
                name="agreement"
                checked={managerInfo.agreement}
                onChange={handleManagerInput}
                required
              />
              <span>
                Kurumsal üyelik sözleşmesi'ni ve gizlilik politikasını kabul ediyorum
              </span>
            </label>
            {managerError && <div className="esnaf-register-error">{managerError}</div>}
            <div className="esnaf-register-step-btns">
              <button type="button" className="esnaf-register-back-btn" onClick={handleBackStep4}>
                Geri
              </button>
              <button type="submit" className="esnaf-register-next-btn">
                Başvuruyu Tamamla
              </button>
            </div>
          </form>
        )}
        {step === 5 && (
          <form onSubmit={handleSubmitVerification} className="esnaf-register-form">
            <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#333' }}>
              Doğrulama Yöntemi Seçin
            </h2>
            <p style={{ textAlign: 'center', marginBottom: '32px', color: '#666' }}>
              Hesabınızı doğrulamak için bir yöntem seçin
            </p>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <label 
                className={`esnaf-business-type-option${verificationMethod === 'email' ? " selected" : ""}`}
                style={{ flex: 1, textAlign: 'center', padding: '20px' }}
              >
                <input
                  type="radio"
                  name="verificationMethod"
                  value="email"
                  checked={verificationMethod === 'email'}
                  onChange={() => handleVerificationMethodSelect('email')}
                  required
                />
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📧</div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Email ile Doğrulama</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {managerInfo.email} adresine doğrulama linki gönderilir
                  </div>
                </div>
              </label>
              
              <label 
                className={`esnaf-business-type-option${verificationMethod === 'sms' ? " selected" : ""}`}
                style={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  padding: '20px',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  position: 'relative'
                }}
              >
                <input
                  type="radio"
                  name="verificationMethod"
                  value="sms"
                  checked={verificationMethod === 'sms'}
                  onChange={() => handleVerificationMethodSelect('sms')}
                  required
                  disabled
                  style={{ cursor: 'not-allowed' }}
                />
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📱</div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>SMS ile Doğrulama</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {managerInfo.phone} numarasına doğrulama kodu gönderilir
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#ff6b6b', 
                    marginTop: '8px',
                    fontWeight: 'bold'
                  }}>
                    ⚠️ Yakında Aktif Olacak
                  </div>
                </div>
              </label>
            </div>
            
            {verificationError && <div className="esnaf-register-error">{verificationError}</div>}
            
            <div className="esnaf-register-step-btns">
              <button type="button" className="esnaf-register-back-btn" onClick={() => setStep(4)}>
                Geri
              </button>
              <button 
                type="submit" 
                className="esnaf-register-next-btn"
                disabled={!verificationMethod}
              >
                Doğrulama Gönder
              </button>
            </div>
          </form>
        )}
        {step === 6 && verificationEmail && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📧</div>
            <h1 style={{ color: '#333', marginBottom: '16px' }}>Kayıt Tamamlandı!</h1>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
              Email adresinize doğrulama linki gönderildi. 
              <strong>{verificationEmail}</strong> adresindeki email'i kontrol edin ve 
              doğrulama linkine tıklayın.
            </p>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Doğrulama tamamlandıktan sonra panele giriş yapabilirsiniz.
            </p>
            <div style={{ marginTop: '24px' }}>
              <button 
                onClick={() => router.push("/esnaf/giris")}
                style={{
                  backgroundColor: '#ffd600',
                  color: '#111111',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Giriş Sayfasına Git
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
    <EsnafFooter />
    </>
  );
} 