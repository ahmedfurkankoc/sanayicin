'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api, setAuthEmail } from "@/app/utils/api";

// UI Components
import EsnafAuthHeader from "../../components/AuthHeader";
import LocationPicker from "../../components/LocationPicker";
import OTPInput from "../../components/OTPInput";

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
  // Accept only 10 digits (e.g., 5555555555). Country code will be prefixed as +90.
  return /^\d{10}$/.test(phone);
};

// Güçlü şifre doğrulama fonksiyonu
const validateStrongPassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Şifre en az 8 karakter olmalıdır.");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Şifre en az bir büyük harf (A-Z) içermelidir.");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Şifre en az bir küçük harf (a-z) içermelidir.");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Şifre en az bir sayı (0-9) içermelidir.");
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push("Şifre en az bir özel karakter (!@#$%^&* vb.) içermelidir.");
  }
  
  // Basit şifre kontrolü
  const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123', 'admin123', '12345678', 'letmein', 'welcome123', 'sanayicin123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Çok basit bir şifre seçtiniz. Lütfen daha güvenli bir şifre kullanın.");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
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

// Adım bilgileri
const steps = [
  { number: 1, label: "İşletme" },
  { number: 2, label: "Hizmet" },
  { number: 3, label: "İşyeri" },
  { number: 4, label: "Yetkili" },
  { number: 5, label: "Doğrulama" },
];

export default function EsnafKayitPage() {
  const [step, setStep] = useState(1);
  // Register card'a scroll etmek için ref
  const registerCardRef = useRef<HTMLDivElement | null>(null);

  // Adım değiştiğinde kartın tepesine yumuşak kaydır
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = registerCardRef.current;
    if (!el) return;
    try {
      const headerOffset = 100; // sticky auth header (~86px) + biraz boşluk
      const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    } catch {}
  }, [step]);
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
    photoPreview: null as string | null,
    phone: "",
    city: "",
    district: "",
    subdistrict: "",
    address: "",
    location: "",
  });
  
  // Konum bilgileri
  const [location, setLocation] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
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
  const [managerError, setManagerError] = useState<string | string[]>("");

  // 5. adım - SMS OTP verification state
  const [smsOtpError, setSmsOtpError] = useState<string>('');
  const [smsVerifying, setSmsVerifying] = useState<boolean>(false);
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

  // Avatar preview URL cleanup
  useEffect(() => {
    return () => {
      if (companyInfo.photoPreview) {
        URL.revokeObjectURL(companyInfo.photoPreview);
      }
    };
  }, [companyInfo.photoPreview]);

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
      <EsnafAuthHeader currentPage="register" />
      <section className="register-section">
        <div className="register-wrapper">
          <div className="register-card">
            <div className="register-loading">
              <p>Yönlendiriliyor...</p>
            </div>
          </div>
        </div>
      </section>
      {/* Footer intentionally hidden on auth page */}
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
    if (name === 'phone') {
      // Sadece rakamları al
      let digits = value.replace(/\D/g, '');
      // Başında 0 varsa kaldır
      if (digits.startsWith('0')) {
        digits = digits.substring(1);
      }
      // Maksimum 10 haneli
      if (digits.length > 10) {
        digits = digits.substring(0, 10);
      }
      setCompanyInfo((prev) => ({ ...prev, phone: digits }));
      return;
    }
    setCompanyInfo((prev) => ({ ...prev, [name]: value }));
  };
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Önizleme için URL oluştur
      const previewUrl = URL.createObjectURL(file);
      setCompanyInfo((prev) => ({ 
        ...prev, 
        photo: file, 
        photoName: file.name,
        photoPreview: previewUrl
      }));
    } else {
      // Eski preview URL'ini temizle
      if (companyInfo.photoPreview) {
        URL.revokeObjectURL(companyInfo.photoPreview);
      }
      setCompanyInfo((prev) => ({ 
        ...prev, 
        photo: null, 
        photoName: "",
        photoPreview: null
      }));
    }
  };
  
  const handleLocationChange = (lat: number, lng: number) => {
    setLocation({ latitude: lat, longitude: lng });
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
    
    const businessPhoneDigits = phone.replace(/\D/g, '');
    if (!validatePhone(businessPhoneDigits)) {
      setCompanyError("Geçersiz telefon numarası (10 hane olmalı, başında 0 olmadan).");
      return;
    }
    if (businessPhoneDigits.startsWith('0')) {
      setCompanyError("Telefon numarası 0 ile başlamamalı (örn: 5552223333).");
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
    if (name === 'phone') {
      // Sadece rakamları al
      let digits = value.replace(/\D/g, '');
      // Başında 0 varsa kaldır
      if (digits.startsWith('0')) {
        digits = digits.substring(1);
      }
      // Maksimum 10 haneli
      if (digits.length > 10) {
        digits = digits.substring(0, 10);
      }
      setManagerInfo((prev) => ({ ...prev, phone: digits }));
      return;
    }
    setManagerInfo((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleBackStep4 = () => setStep(3);

  const handleSMSOTPComplete = async (code: string) => {
    setSmsOtpError("");
    setSmsVerifying(true);
    try {
      const response = await api.verifySMSCode({
        email: managerInfo.email,
        code: code
      });
      
      if (response.status === 200) {
        toast.success('SMS kodu başarıyla doğrulandı!');
        // Kullanıcıyı giriş sayfasına yönlendir
        setTimeout(() => {
          router.push("/esnaf/giris");
        }, 1500);
      } else {
        setSmsOtpError("Doğrulama başarısız. Lütfen tekrar deneyin.");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Doğrulama kodu hatalı. Lütfen tekrar deneyin.';
      setSmsOtpError(errorMsg);
    } finally {
      setSmsVerifying(false);
    }
  };

  const handleResendSMSOTP = async () => {
    setSmsOtpError("");
    try {
      const managerPhoneDigits = managerInfo.phone.replace(/\D/g, '');
      const response = await api.sendSMSVerification({
        email: managerInfo.email,
        phone_number: `+90${managerPhoneDigits}`
      });
      
      if (response.status === 200) {
        toast.success('SMS doğrulama kodu tekrar gönderildi');
      } else {
        setSmsOtpError("SMS gönderilemedi. Lütfen tekrar deneyin.");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Kod gönderilemedi. Lütfen tekrar deneyin.';
      setSmsOtpError(errorMsg);
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
    
    const managerPhoneDigits = phone.replace(/\D/g, '');
    if (!validatePhone(managerPhoneDigits)) {
      setManagerError("Geçerli bir telefon numarası girin (10 hane olmalı, başında 0 olmadan).");
      return;
    }
    if (managerPhoneDigits.startsWith('0')) {
      setManagerError("Telefon numarası 0 ile başlamamalı (örn: 5552223333).");
      return;
    }
    
    if (password !== password2) {
      setManagerError("Şifreler eşleşmiyor.");
      return;
    }
    
    // Güçlü şifre doğrulaması
    const passwordValidation = validateStrongPassword(password);
    if (!passwordValidation.isValid) {
      // Hataları liste olarak göster
      setManagerError(passwordValidation.errors);
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
        formData.append('avatar', companyInfo.photo);
      }
      const businessPhoneDigits = companyInfo.phone.replace(/\D/g, '');
      formData.append('business_phone', `+90${businessPhoneDigits}`);
      formData.append('city', selectedCity);
      formData.append('district', selectedDistrict);
      formData.append('subdistrict', selectedNeighbourhood);
      formData.append('address', companyInfo.address);
      
      // Konum bilgilerini ekle (6 ondalık basamağa yuvarla)
      if (location.latitude !== null && location.longitude !== null) {
        const roundedLat = parseFloat(location.latitude.toFixed(6));
        const roundedLng = parseFloat(location.longitude.toFixed(6));
        formData.append('latitude', roundedLat.toString());
        formData.append('longitude', roundedLng.toString());
      }
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('manager_birthdate', managerInfo.birthdate);
      formData.append('manager_tc', tc);
      const managerPhoneDigits = phone.replace(/\D/g, '');
      formData.append('phone_number', `+90${managerPhoneDigits}`);

      const res = await api.register(formData);
      const data = res.data;
      if (res.status !== 201) { // 201 Created
        console.log("Registration error:", data);
        if (data.errors && typeof data.errors === "object") {
          // Field adlarını Türkçe'ye çevir
          const fieldNames: { [key: string]: string } = {
            'email': 'E-posta',
            'latitude': 'Enlem',
            'longitude': 'Boylam',
            'password': 'Şifre',
            'password2': 'Şifre Tekrar',
            'phone_number': 'Telefon Numarası',
            'business_phone': 'İşyeri Telefonu',
            'tax_no': 'Vergi/TC No',
            'manager_tc': 'TC Kimlik No',
            'first_name': 'Ad',
            'last_name': 'Soyad',
            'company_title': 'Şirket Unvanı',
            'display_name': 'Görünen Ad',
            'city': 'İl',
            'district': 'İlçe',
            'subdistrict': 'Semt',
            'address': 'Adres'
          };
          const errorMessages = Object.entries(data.errors).map(([field, errors]) => {
            const fieldName = fieldNames[field] || field;
            const errorArray = Array.isArray(errors) ? errors : [errors];
            return `${fieldName}: ${errorArray.join(', ')}`;
          }).join('\n');
          setManagerError(errorMessages);
        } else {
          setManagerError(data.detail || "Bir hata oluştu.");
        }
        return;
      }
      // Email bilgisini localStorage'a kaydet
      if (typeof window !== "undefined") {
        setAuthEmail("vendor", email);
        // Password'ü hash'leyerek sakla (SMS verification sonrası login için)
        const hashedPassword = btoa(password); // Base64 encoding (basit hash)
        localStorage.setItem("esnaf_temp_password_hash", hashedPassword);
      }
      
      // Direkt SMS OTP gönder
      setVerificationEmail(email);
      try {
        const managerPhoneDigits = phone.replace(/\D/g, '');
        const smsResponse = await api.sendSMSVerification({
          email: email,
          phone_number: `+90${managerPhoneDigits}`
        });
        
        if (smsResponse.status === 200) {
          toast.success('SMS doğrulama kodu gönderildi');
          setStep(5); // SMS OTP verification step
        } else {
          setManagerError("SMS gönderilemedi. Lütfen tekrar deneyin.");
        }
      } catch (smsErr: any) {
        console.log("SMS gönderme hatası:", smsErr);
        const smsErrorMsg = smsErr.response?.data?.error || smsErr.response?.data?.detail || 'SMS gönderilemedi. Lütfen tekrar deneyin.';
        setManagerError(smsErrorMsg);
      }
    } catch (err: any) {
      console.log("Registration error:", err);
      // Backend'den dönen hata mesajını göster
      let errorMsg = "Sunucu hatası. Lütfen tekrar deneyin.";
      if (err.response) {
        if (err.response.data) {
          // Önce errors objesi var mı kontrol et (Django REST Framework validation errors)
          if (err.response.data.errors && typeof err.response.data.errors === "object") {
            const errorMessages = Object.entries(err.response.data.errors).map(([field, errors]) => {
              // Field adını Türkçe'ye çevir
              const fieldNames: { [key: string]: string } = {
                'email': 'E-posta',
                'latitude': 'Enlem',
                'longitude': 'Boylam',
                'password': 'Şifre',
                'password2': 'Şifre Tekrar',
                'phone_number': 'Telefon Numarası',
                'business_phone': 'İşyeri Telefonu',
                'tax_no': 'Vergi/TC No',
                'manager_tc': 'TC Kimlik No',
                'first_name': 'Ad',
                'last_name': 'Soyad',
                'company_title': 'Şirket Unvanı',
                'display_name': 'Görünen Ad',
                'city': 'İl',
                'district': 'İlçe',
                'subdistrict': 'Semt',
                'address': 'Adres'
              };
              const fieldName = fieldNames[field] || field;
              const errorArray = Array.isArray(errors) ? errors : [errors];
              return `${fieldName}: ${errorArray.join(', ')}`;
            }).join('\n');
            errorMsg = errorMessages;
          } else if (typeof err.response.data.detail === "string") {
            errorMsg = err.response.data.detail;
          } else if (typeof err.response.data === "string") {
            errorMsg = err.response.data;
          } else if (typeof err.response.data === "object") {
            // Django REST Framework validation error formatı (nested errors)
            const allErrors: string[] = [];
            const extractErrors = (obj: any, prefix = '') => {
              Object.entries(obj).forEach(([key, value]) => {
                const fieldPath = prefix ? `${prefix}.${key}` : key;
                if (Array.isArray(value)) {
                  allErrors.push(`${fieldPath}: ${value.join(', ')}`);
                } else if (typeof value === 'object' && value !== null) {
                  extractErrors(value, fieldPath);
                } else {
                  allErrors.push(`${fieldPath}: ${value}`);
                }
              });
            };
            extractErrors(err.response.data);
            errorMsg = allErrors.join('\n') || "Validation error";
          }
        }
      }
      setManagerError(errorMsg);
    }
  };

  // Progress indicator için aktif adımı belirle
  const getActiveStep = () => {
    return step;
  };

  return (
    <>
    <EsnafAuthHeader currentPage="register" />
    <section className="register-section">
      {/* Mobile title */}
      <div className="mobile-only">
        <div className="container">
          <h1 className="register-mobile-title">Sanayicin Esnaf Kaydınızı Hızlıca Oluşturun</h1>
        </div>
      </div>
      {/* Ana Container */}
      <div className="register-wrapper">
        {/* Vektörel Karakter - Kartın Sağ Üstünde */}
        <div className="register-character">
          <img 
            src="/images/register-vectorel-image.png" 
            alt="Esnaf karakteri" 
          />
        </div>
        
        {/* Kart */}
        <div className="register-card" ref={registerCardRef}>
          {/* Progress Indicator */}
          <div className="register-progress">
            {steps.map((stepItem, index) => (
              <React.Fragment key={stepItem.number}>
                <span 
                  className={`register-progress__step ${
                    getActiveStep() >= stepItem.number ? 'register-progress__step--active' : ''
                  }`}
                >
                  {stepItem.number}. {stepItem.label}
                </span>
                {index < steps.length - 1 && (
                  <span className="register-progress__separator"> &gt; </span>
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Başlık */}
          <h1 className="register-card__title">Esnaf Hesabınızı Oluşturun</h1>
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="register-form register-form--step1">
              <p className="register-card__description">
                Kayıt işlemi sadece 2 dakikanızı alır. Şirket tipinizi seçin ve devam edin.
              </p>
              <div className="register-step1__content">
                <div className="register-features">
                  <div className="register-feature">
                    <span className="register-feature__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                    <span className="register-feature__text">Yeni Müşteriler Edinin</span>
                  </div>
                  <div className="register-feature">
                    <span className="register-feature__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                    <span className="register-feature__text">Profilinizle Güven Kazanın</span>
                  </div>
                  <div className="register-feature">
                    <span className="register-feature__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 21H21V23H3V21Z" fill="currentColor"/>
                      <path d="M5 21V7L12 2L19 7V21H17V8L12 4L7 8V21H5Z" fill="currentColor"/>
                      <path d="M9 21V13H15V21H9Z" fill="currentColor"/>
                      <path d="M11 13V17H13V13H11Z" fill="currentColor"/>
                      <path d="M9 13H15V15H9V13Z" fill="currentColor"/>
                    </svg>
                  </span>
                    <span className="register-feature__text">Sanayi Sitelerinde Görünür Olun</span>
                  </div>
                </div>
                <div className="register-business-wrapper">
                  <label className="register-label">İşletme Türü Seçiniz:</label>
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
              </div>
            </div>
              <button type="submit" className="register-btn register-btn--primary" disabled={!selectedType}>
                Sonraki Adım
              </button>
              <p className="register-copyright">
                © {new Date().getFullYear()} Sanayicin. Tüm hakları saklıdır.
              </p>
            </form>
          )}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="register-form">
            <label className="register-label">Hizmet Verdiğiniz Alan:</label>
            <select
              className="register-input"
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
                <label className="register-label" style={{ marginTop: 18 }}>Arama Listelerinde Yer Almak İstediğiniz Kategoriler:</label>
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
            <div className="register-buttons">
              <button type="button" className="register-btn register-btn--secondary" onClick={handleBackStep2}>
                Geri
              </button>
              <button
                type="submit"
                className="register-btn register-btn--primary"
                disabled={!selectedService || selectedCategories.length === 0}
              >
                Sonraki Adım
              </button>
            </div>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleNextStep3} className="register-form">
            <label className="register-label">İşyeri Unvanı</label>
            <input
              type="text"
              name="title"
              className="register-input"
              value={companyInfo.title}
              onChange={handleCompanyInput}
              required
            />
            <label className="register-label">Vergi Dairesi</label>
            <input
              type="text"
              name="taxOffice"
              className="register-input"
              value={companyInfo.taxOffice}
              onChange={handleCompanyInput}
              required
            />
            <label className="register-label">
              {selectedType === "sahis" || selectedType === "esnaf" 
                ? "TC Kimlik Numarası" 
                : "Vergi Numarası"}
            </label>
            <input
              type="text"
              name="taxNo"
              className="register-input"
              value={companyInfo.taxNo}
              onChange={handleCompanyInput}
              placeholder={selectedType === "sahis" || selectedType === "esnaf" 
                ? "11 haneli TC kimlik numarası" 
                : "10 haneli vergi numarası"}
              required
            />
            <label className="register-label">Profilde Görünecek İşyeri İsmi</label>
            <input
              type="text"
              name="displayName"
              className="register-input"
              value={companyInfo.displayName}
              onChange={handleCompanyInput}
              required
            />
            <label className="register-label">Firmanız Hakkında</label>
            <textarea
              name="about"
              className="register-input"
              value={companyInfo.about}
              onChange={handleCompanyInput}
              required
              rows={3}
            />
            <label className="register-label">Profil Fotoğrafı</label>
            <input
              type="file"
              name="photo"
              className="register-input"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            {companyInfo.photoPreview && (
              <div style={{
                marginTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <img
                  src={companyInfo.photoPreview}
                  alt="Profil fotoğrafı önizleme"
                  style={{
                    width: '150px',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  {companyInfo.photoName}
                </div>
              </div>
            )}
            {!companyInfo.photoPreview && companyInfo.photoName && (
              <div className="register-photo-name">Seçilen dosya: {companyInfo.photoName}</div>
            )}
            <label className="register-label">İşyeri Telefon Numarası *</label>
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
                name="phone"
                className="register-input"
                value={companyInfo.phone}
                onChange={handleCompanyInput}
                placeholder="5552223333"
                required
                style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 0', background: 'transparent' }}
                maxLength={10}
              />
            </div>
            <small className="register-help">
              Bu telefon numarası müşterileriniz tarafından görülecek ve iletişim kurulacak numaradır. Başında 0 olmadan, boşluksuz 10 haneli numara girin (örn: 5552223333)
            </small>
            <label className="register-label">İşyeri İli</label>
            <select
              className="register-input"
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
            <label className="register-label">İşyeri İlçesi</label>
            <select
              className="register-input"
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
            <label className="register-label">İşyeri Semti</label>
            <select
              className="register-input"
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
            <label className="register-label">Açık Adres</label>
            <input
              type="text"
              name="address"
              className="register-input"
              value={companyInfo.address}
              onChange={handleCompanyInput}
              required
            />
            
            {/* Harita Bileşeni */}
            {selectedCity && selectedDistrict && selectedNeighbourhood && (
              <>
                <label className="register-label" style={{ marginTop: '20px' }}>
                  İşyeri Konumu
                </label>
                <div style={{ 
                  marginBottom: '16px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <LocationPicker
                    initialLat={location.latitude || undefined}
                    initialLng={location.longitude || undefined}
                    onLocationChange={handleLocationChange}
                    city={selectedCity}
                    district={selectedDistrict}
                    subdistrict={selectedNeighbourhood}
                    height="350px"
                  />
                </div>
                <small className="register-help">
                  Haritaya tıklayarak işyerinizin tam konumunu belirleyin. Bu konum müşterileriniz tarafından görülecektir.
                </small>
                {location.latitude && location.longitude && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: '#f0f9ff',
                    border: '1px solid #0ea5e9',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#0369a1'
                  }}>
                    ✅ Konum belirlendi: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </div>
                )}
              </>
            )}

            {companyError && <div className="register-error">{companyError}</div>}
            <div className="register-buttons">
              <button type="button" className="register-btn register-btn--secondary" onClick={handleBackStep3}>
                Geri
              </button>
              <button type="submit" className="register-btn register-btn--primary">
                Sonraki Adım
              </button>
            </div>
          </form>
        )}
        {step === 4 && (
          <form onSubmit={handleSubmitManager} className="register-form">
            <div className="esnaf-name-row">
              <div className="esnaf-name-field">
                <label className="register-label">Ad</label>
                <input
                  type="text"
                  name="firstName"
                  className="register-input"
                  value={managerInfo.firstName}
                  onChange={handleManagerInput}
                  required
                />
              </div>
              <div className="esnaf-name-field">
                <label className="register-label">Soyad</label>
                <input
                  type="text"
                  name="lastName"
                  className="register-input"
                  value={managerInfo.lastName}
                  onChange={handleManagerInput}
                  required
                />
              </div>
            </div>
            <label className="register-label">Doğum Tarihi</label>
            <input
              type="date"
              name="birthdate"
              className="register-input"
              value={managerInfo.birthdate}
              onChange={handleManagerInput}
              required
            />
            <label className="register-label">TC Kimlik No</label>
            <input
              type="text"
              name="tc"
              className="register-input"
              value={managerInfo.tc}
              onChange={handleManagerInput}
              required
            />
            <label className="register-label">Cep Telefonu</label>
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
                name="phone"
                className="register-input"
                value={managerInfo.phone}
                onChange={handleManagerInput}
                placeholder="5552223333"
                required
                style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 0', background: 'transparent' }}
                maxLength={10}
              />
            </div>
            <small className="register-help" style={{ marginTop: '4px', display: 'block' }}>
              Başında 0 olmadan, boşluksuz 10 haneli numara girin (örn: 5552223333)
            </small>
            <label className="register-label">E-posta</label>
            <input
              type="email"
              name="email"
              className="register-input"
              value={managerInfo.email}
              onChange={handleManagerInput}
              required
            />
            <label className="register-label">Şifre</label>
            <input
              type="password"
              name="password"
              className="register-input"
              value={managerInfo.password}
              onChange={handleManagerInput}
              required
              autoComplete="new-password"
            />
            <label className="register-label">Şifre Tekrar</label>
            <input
              type="password"
              name="password2"
              className="register-input"
              value={managerInfo.password2}
              onChange={handleManagerInput}
              required
              autoComplete="new-password"
            />
            <label className="register-checkbox">
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
            {managerError && (
              <div className="register-error">
                {Array.isArray(managerError) ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', textAlign: 'left' }}>
                    {managerError.map((error, index) => (
                      <li key={index} style={{ marginBottom: '4px', textAlign: 'left' }}>{error}</li>
                    ))}
                  </ul>
                ) : (
                  managerError
                )}
              </div>
            )}
            <div className="register-buttons">
              <button type="button" className="register-btn register-btn--secondary" onClick={handleBackStep4}>
                Geri
              </button>
              <button type="submit" className="register-btn register-btn--primary">
                Başvuruyu Tamamla
              </button>
            </div>
            <p style={{ marginTop: 12, fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
              "Başvuruyu Tamamla"ya tıklayarak
              {" "}
              <Link href="/kullanici-sozlesmesi" style={{ color: '#111827', fontWeight: 600, textDecoration: 'underline' }}>Kullanıcı Sözleşmesi</Link>
              {" "}
              <Link href="/esnaf-sozlesmesi" style={{ color: '#111827', fontWeight: 600, textDecoration: 'underline' }}>Esnaf Sözleşmesi</Link>
              {" "}ve{" "}
              <Link href="/kullanim-kosullari" style={{ color: '#111827', fontWeight: 600, textDecoration: 'underline' }}>Kullanım Koşulları</Link>
              {" "}hükümlerini kabul etmiş,
              {" "}
              <Link href="/kvkk-aydinlatma-metni" style={{ color: '#111827', fontWeight: 600, textDecoration: 'underline' }}>Kişisel Verilerin Korunması Aydınlatma Metni</Link>
              {" "}ile{" "}
              <Link href="/cerez-aydinlatma-metni" style={{ color: '#111827', fontWeight: 600, textDecoration: 'underline' }}>Çerez Yönetimi</Link>
              {" "}belgelerini okuduğunuzu onaylamış olursunuz.
            </p>
          </form>
        )}
        {step === 5 && verificationEmail && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
            <h1 style={{ color: '#333', marginBottom: '16px' }}>SMS Doğrulama</h1>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
              Telefon numaranıza gönderilen 6 haneli doğrulama kodunu girin.
            </p>
            {managerInfo.phone && (
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
                Kod <strong>****{managerInfo.phone.slice(-4)}</strong> sonlu telefon numaranıza gönderildi
              </p>
            )}
            
            <div style={{ marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              <OTPInput
                onComplete={handleSMSOTPComplete}
                onResend={handleResendSMSOTP}
                error={smsOtpError}
                disabled={smsVerifying}
                resendCooldown={60}
              />
            </div>
            
            {smsVerifying && (
              <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px' }}>
                Doğrulanıyor...
              </div>
            )}
            
            <div style={{ marginTop: '24px' }}>
              <button 
                onClick={() => setStep(4)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: '500',
                  marginRight: '12px'
                }}
                disabled={smsVerifying}
              >
                Geri
              </button>
            </div>
          </div>
        )}
        </div>
        {/* Kart kapanış */}
      </div>
      {/* Container kapanış */}
    </section>
    {/* Footer intentionally hidden on auth page */}
    </>
  );
} 