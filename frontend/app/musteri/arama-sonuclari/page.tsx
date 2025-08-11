'use client';

import React, { useEffect, useState, Suspense, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/app/utils/api";
import { useTurkeyData } from "@/app/hooks/useTurkeyData";
import { iconMapping } from "@/app/utils/iconMapping";
import MusteriHeader from "../components/MusteriHeader";
import MusteriFooter from "../components/MusteriFooter";
import AuthModal from "@/app/components/AuthModal";

interface Vendor {
  id: number;
  user: {
    email: string;
    email_verified: boolean;
  };
  business_type: string;
  company_title: string;
  display_name: string;
  phone: string;
  city: string;
  district: string;
  subdistrict: string;
  address: string;
  about?: string;
  profile_photo?: string;
  service_areas?: any[];
  categories?: any[];
  slug: string;
}

interface SearchResponse {
  count: number;
  results: Vendor[];
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Memoized vendor card component
const VendorCard = React.memo(({ vendor }: { vendor: Vendor }) => {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const handleVendorClick = () => {
    // Yeni permission system ile authentication kontrolü
    const vendorToken = localStorage.getItem('esnaf_access_token');
    const customerToken = localStorage.getItem('customer_access_token');
    
    // Vendor token varsa hem vendor hem customer olarak davran
    const isAuthenticated = vendorToken || customerToken;
    
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    // Giriş yapılmışsa esnaf profil sayfasına yönlendir
    router.push(`/musteri/esnaf/${vendor.slug}`);
  };
  
  return (
    <>
      <div 
        onClick={handleVendorClick}
        className="musteri-vendor-card"
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          {/* Avatar */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#ffd600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111111',
            flexShrink: 0
          }}>
            {vendor.display_name.charAt(0).toUpperCase()}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: '#111111'
            }}>
              {vendor.display_name}
            </h3>
            
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: '0 0 12px 0'
            }}>
              {vendor.business_type}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '13px',
              color: '#666'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {React.createElement(iconMapping['map-pin'], { size: 14 })}
                {vendor.district}, {vendor.city}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {React.createElement(iconMapping.phone, { size: 14 })}
                {vendor.phone}
              </span>
            </div>

            {vendor.about && (
              <p style={{
                fontSize: '14px',
                color: '#444',
                margin: '12px 0 0 0',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {vendor.about}
              </p>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Giriş Gerekli"
        message="Esnaf profilini görüntülemek için giriş yapmanız veya hesap oluşturmanız gerekiyor."
      />
    </>
  );
});

VendorCard.displayName = 'VendorCard';

// Memoized filter components
const FilterSelect = React.memo(({ 
  label, 
  value, 
  onChange, 
  options, 
  disabled = false,
  placeholder 
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
}) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: disabled ? '#f5f5f5' : 'white'
      }}
    >
      <option value="">{placeholder || `Tüm ${label}ler`}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
));

FilterSelect.displayName = 'FilterSelect';

function AramaSonuclariContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cities, loadTurkeyData, getDistricts } = useTurkeyData();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const city = searchParams.get("city") || "";
  const district = searchParams.get("district") || "";
  const service = searchParams.get("service") || "";
  const category = searchParams.get("category") || "";

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState(service);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedCity, setSelectedCity] = useState(city);
  const [selectedDistrict, setSelectedDistrict] = useState(district);
  const [districts, setDistricts] = useState<string[]>([]);

  // Debounced values for API calls
  const debouncedCity = useDebounce(selectedCity, 300);
  const debouncedDistrict = useDebounce(selectedDistrict, 300);
  const debouncedService = useDebounce(selectedService, 300);
  const debouncedCategory = useDebounce(selectedCategory, 300);

  // Memoized options
  const cityOptions = useMemo(() => 
    cities.map(city => ({ value: city, label: city })), 
    [cities]
  );

  const districtOptions = useMemo(() => 
    districts.map(district => ({ value: district, label: district })), 
    [districts]
  );

  const serviceOptions = useMemo(() => 
    services.map(service => ({ value: service.id, label: service.name })), 
    [services]
  );

  const categoryOptions = useMemo(() => {
    const filtered = selectedService 
      ? categories.filter(cat => cat.service_area == selectedService)
      : categories;
    return filtered.map(cat => ({ value: cat.id, label: cat.name }));
  }, [categories, selectedService]);

  // Şehir verisini yükle
  useEffect(() => {
    loadTurkeyData();
  }, [loadTurkeyData]);

  // URL'den gelen değerleri işle
  useEffect(() => {
    if (city && cities.length > 0) {
      setSelectedCity(city);
      if (district) {
        const cityDistricts = getDistricts(city);
        if (cityDistricts.includes(district)) {
          setSelectedDistrict(district);
        }
      }
    }
  }, [city, district, cities, getDistricts]);

  // İl değişince ilçeleri güncelle
  useEffect(() => {
    if (selectedCity) {
      const newDistricts = getDistricts(selectedCity);
      setDistricts(newDistricts);
      if (selectedDistrict && !newDistricts.includes(selectedDistrict)) {
        setSelectedDistrict("");
      }
    } else {
      setDistricts([]);
      setSelectedDistrict("");
    }
  }, [selectedCity, getDistricts]);

  // Hizmet alanlarını çek (cache ile)
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.getServiceAreas();
        setServices(response.data);
      } catch (error) {
        console.error('Hizmet alanları yüklenemedi:', error);
        setServices([]);
      }
    };

    if (services.length === 0) {
      fetchServices();
    }
  }, [services.length]);

  // Kategorileri API'den çek (cache ile)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Kategoriler yüklenemedi:', error);
        setCategories([]);
      }
    };

    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length]);

  // Debounced search
  useEffect(() => {
    const searchVendors = async () => {
      // Önceki isteği iptal et
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Yeni abort controller oluştur
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError("");
        
        const response = await api.searchVendors({
          city: debouncedCity,
          district: debouncedDistrict,
          service: debouncedService,
          category: debouncedCategory
        });
        
        const data: SearchResponse = response.data;
        setVendors(data.results || []);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Vendor arama hatası:", err);
          setError("Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (debouncedCity || debouncedDistrict || debouncedService || debouncedCategory) {
      searchVendors();
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedCity, debouncedDistrict, debouncedService, debouncedCategory]);

  const handleFilterChange = useCallback((type: string, value: string) => {
    if (type === 'city') setSelectedCity(value);
    if (type === 'district') setSelectedDistrict(value);
    if (type === 'service') {
      setSelectedService(value);
      setSelectedCategory(""); // Hizmet değişince kategoriyi sıfırla
    }
    if (type === 'category') setSelectedCategory(value);
  }, []);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedCity) params.set('city', selectedCity);
    if (selectedDistrict) params.set('district', selectedDistrict);
    if (selectedService) params.set('service', selectedService);
    if (selectedCategory) params.set('category', selectedCategory);
    router.push(`/musteri/arama-sonuclari?${params.toString()}`);
  }, [selectedCity, selectedDistrict, selectedService, selectedCategory, router]);

  // Memoized vendor list
  const vendorList = useMemo(() => 
    vendors.map(vendor => (
      <VendorCard key={vendor.id} vendor={vendor} />
    )), 
    [vendors]
  );

  return (
    <>
      <MusteriHeader />
      <div className="musteri-container">
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 200px)' }}>
          {/* Sol Sütun - Filtreler */}
          <div className="musteri-filters-sidebar">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Filtreler</h3>
            
            <FilterSelect
              label="Şehir"
              value={selectedCity}
              onChange={(value) => handleFilterChange('city', value)}
              options={cityOptions}
              placeholder="İl seçiniz"
            />

            <FilterSelect
              label="İlçe"
              value={selectedDistrict}
              onChange={(value) => handleFilterChange('district', value)}
              options={districtOptions}
              disabled={!selectedCity}
              placeholder="İlçe seçiniz"
            />

            <FilterSelect
              label="Hizmet Alanı"
              value={selectedService}
              onChange={(value) => handleFilterChange('service', value)}
              options={serviceOptions}
              placeholder="Hizmet seçiniz"
            />

            <FilterSelect
              label="Kategori"
              value={selectedCategory}
              onChange={(value) => handleFilterChange('category', value)}
              options={categoryOptions}
              disabled={!selectedService}
              placeholder="Kategori seçiniz"
            />

            {/* Sonuç Sayısı */}
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <strong>{vendors.length}</strong> usta bulundu
            </div>
          </div>

          {/* Sağ Sütun - Arama Sonuçları */}
          <div className="musteri-search-results-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div>Aranıyor...</div>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                <div>{error}</div>
              </div>
            ) : vendors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div>Sonuç bulunamadı</div>
              </div>
            ) : (
              <div>
                {vendorList}
              </div>
            )}
          </div>
        </div>
      </div>
      <MusteriFooter />
    </>
  );
}

export default function AramaSonuclari() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Yükleniyor...
      </div>
    }>
      <AramaSonuclariContent />
    </Suspense>
  );
} 