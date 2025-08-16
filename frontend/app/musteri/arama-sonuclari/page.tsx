'use client';

import React, { useEffect, useState, Suspense, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api, getAuthToken } from "@/app/utils/api";
import { useTurkeyData } from "@/app/hooks/useTurkeyData";
import { useCarBrands } from "@/app/hooks/useCarBrands";
import { useServices } from "@/app/hooks/useServices";
import { iconMapping } from "@/app/utils/iconMapping";
import AuthModal from "@/app/components/AuthModal";

// Güvenlik: Input sanitization fonksiyonları
const sanitizeInput = (input: string): string => {
  if (!input) return '';
  // HTML tag'ları, script'leri ve tehlikeli karakterleri temizle
  return input
    .replace(/[<>]/g, '') // < > karakterlerini kaldır
    .replace(/javascript:/gi, '') // javascript: protokolünü kaldır
    .replace(/on\w+=/gi, '') // on* event handler'ları kaldır
    .trim();
};

// Case-insensitive arama için input'u normalize et
const normalizeSearchInput = (input: string): string => {
  if (!input) return '';
  // Türkçe karakter desteği için normalize et
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD') // Unicode normalization
    .replace(/[\u0300-\u036f]/g, ''); // Accent'ları kaldır
};

const validateSearchParams = (params: any): boolean => {
  // Sadece string ve number değerleri kabul et
  const allowedTypes = ['string', 'number'];
  return Object.values(params).every(value => 
    value === null || value === undefined || allowedTypes.includes(typeof value)
  );
};

interface Vendor {
  id: number;
  user: {
    email: string;
    is_verified: boolean;
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
  next?: string;
  previous?: string;
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
    // Hem vendor hem client token'ları kontrol et
    const vendorToken = getAuthToken('vendor');
    const clientToken = getAuthToken('client');
    
    // Herhangi bir token varsa authenticated kabul et
    const isAuthenticated = vendorToken || clientToken;
    
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
        {/* Avatar */}
        <div className="musteri-vendor-avatar">
          {vendor.display_name.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className="musteri-vendor-info">
          <h3 className="musteri-vendor-name">
            {vendor.display_name}
          </h3>
          
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: '0 0 12px 0'
          }}>
            {vendor.business_type}
          </p>

          <p className="musteri-vendor-location">
            {vendor.district}, {vendor.city}
          </p>

          {vendor.service_areas && vendor.service_areas.length > 0 && (
            <div className="musteri-vendor-services">
              {vendor.service_areas.slice(0, 3).map((service) => (
                <span key={service.id} className="musteri-service-tag">
                  {service.name}
                </span>
              ))}
              {vendor.service_areas.length > 3 && (
                <span className="musteri-service-tag">
                  +{vendor.service_areas.length - 3} daha
                </span>
              )}
            </div>
          )}

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
  const { carBrands, loadCarBrands } = useCarBrands();
  const { services, categories, getCategoriesByService } = useServices();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const city = searchParams.get("city") || "";
  const district = searchParams.get("district") || "";
  const service = searchParams.get("service") || "";
  const category = searchParams.get("category") || "";
  const page = searchParams.get("page") || "1";
  const searchQuery = searchParams.get("q") || "";  // Text search parametresi
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedService, setSelectedService] = useState(service);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedCity, setSelectedCity] = useState(city);
  const [selectedDistrict, setSelectedDistrict] = useState(district);
  const [selectedCarBrand, setSelectedCarBrand] = useState(searchParams.get("carBrand") || "");
  const [districts, setDistricts] = useState<string[]>([]);
  
  // Pagination state'leri
  const [currentPage, setCurrentPage] = useState(parseInt(page));
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Debounced values for API calls
  const debouncedCity = useDebounce(selectedCity || "", 300);
  const debouncedDistrict = useDebounce(selectedDistrict || "", 300);
  const debouncedService = useDebounce(selectedService || "", 300);
  const debouncedCategory = useDebounce(selectedCategory || "", 300);
  const debouncedCarBrand = useDebounce(selectedCarBrand || "", 300);

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
    services.map(service => ({ value: service.id.toString(), label: service.name })), 
    [services]
  );

  const categoryOptions = useMemo(() => {
    const filtered = selectedService 
      ? categories.filter(cat => cat.service_area.toString() === selectedService)
      : categories;
    return filtered.map(cat => ({ value: cat.id.toString(), label: cat.name }));
  }, [categories, selectedService]);

  const carBrandOptions = useMemo(() => 
    carBrands.map(brand => ({ value: brand.id.toString(), label: brand.name })), 
    [carBrands]
  );

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
    
    if (service) {
      setSelectedService(service);
    }
    
    if (category) {
      setSelectedCategory(category);
    }
    
    if (page) {
      setCurrentPage(parseInt(page));
    }
  }, [city, district, service, category, page, cities, getDistricts]);

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

  // Hizmet alanları ve kategoriler artık useServices hook'undan geliyor

  // Component mount olduğunda initial search yap
  useEffect(() => {
    const initialSearch = async () => {
      try {
        setLoading(true);
        setError("");
        
        // URL'deki parametreleri kullanarak search yap
        const searchParamsObject: any = { page: '1' };
        
        if (city) searchParamsObject.city = city;
        if (district) searchParamsObject.district = district;
        if (service) searchParamsObject.service = service;
        if (category) searchParamsObject.category = category;
        if (searchQuery) searchParamsObject.q = normalizeSearchInput(searchQuery);
        
        const carBrandParam = searchParams.get("carBrand");
        if (carBrandParam) searchParamsObject.carBrand = carBrandParam;
        
        const response = await api.searchVendors(searchParamsObject);
        
        const data: SearchResponse = response.data;
        setVendors(data.results || []);
        
        // Pagination bilgilerini set et
        if (data.count !== undefined) {
          setTotalCount(data.count);
          setTotalPages(Math.ceil(data.count / 15));
        }
        
        // Next/Previous sayfa bilgilerini set et
        setHasNextPage(!!data.next);
        setHasPreviousPage(!!data.previous);
      } catch (err: any) {
        console.error("Initial vendor yükleme hatası:", err);
        setError("Esnaflar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };
    
    initialSearch();
  }, [city, district, service, category, searchQuery]); // URL parametrelerini dependency olarak ekle

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
        
        // Güvenlik: Input'ları sanitize et
        const sanitizedParams = {
          city: sanitizeInput(debouncedCity),
          district: sanitizeInput(debouncedDistrict),
          service: sanitizeInput(debouncedService),
          category: sanitizeInput(debouncedCategory),
          carBrand: sanitizeInput(debouncedCarBrand)
        };
        
        // Güvenlik: Parametreleri validate et
        if (!validateSearchParams(sanitizedParams)) {
          setError("Geçersiz arama parametreleri");
          return;
        }
        
        // Hizmet ve araba markası birlikte seçildiyse, sadece o kombinasyonu ara
        const searchParams: any = {
          city: sanitizedParams.city,
          district: sanitizedParams.district,
          service: sanitizedParams.service,
          category: sanitizedParams.category,
          page: currentPage.toString(), // Sayfa numarasını ekle
        };
        
        // Text search parametresi ekle
        if (searchQuery) {
          searchParams.q = normalizeSearchInput(searchQuery);
        }
        
        // Araba markası seçildiyse ekle
        if (sanitizedParams.carBrand) {
          searchParams.carBrand = sanitizedParams.carBrand;
        }
        
        const response = await api.searchVendors(searchParams);
        
        const data: SearchResponse = response.data;
        setVendors(data.results || []);
        
        // Pagination bilgilerini set et
        if (data.count !== undefined) {
          setTotalCount(data.count);
          setTotalPages(Math.ceil(data.count / 15)); // Backend'de page_size = 15
        }
        
        // Next/Previous sayfa bilgilerini set et
        if (data.next) {
          setHasNextPage(true);
        } else {
          setHasNextPage(false);
        }
        
        if (data.previous) {
          setHasPreviousPage(true);
        } else {
          setHasPreviousPage(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Vendor arama hatası:", err);
          setError("Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        }
      } finally {
        setLoading(false);
      }
    };

    // Hizmet veya araba markası seçildiyse arama yap
    if (debouncedCity || debouncedDistrict || debouncedService || debouncedCategory || debouncedCarBrand || searchQuery) {
      searchVendors();
    }
    
    // Sayfa değiştiğinde de arama yap
    if (currentPage > 1) {
      searchVendors();
    }
    
    // Hiçbir filter seçilmediğinde de tüm esnafları getir
    if (!debouncedCity && !debouncedDistrict && !debouncedService && !debouncedCategory && !debouncedCarBrand && !searchQuery) {
      searchVendors();
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedCity, debouncedDistrict, debouncedService, debouncedCategory, debouncedCarBrand, currentPage, searchQuery]);

  const handleFilterChange = useCallback((type: string, value: string) => {
    if (type === 'city') setSelectedCity(value);
    if (type === 'district') setSelectedDistrict(value);
    if (type === 'service') {
      setSelectedService(value);
      setSelectedCategory(""); // Hizmet değişince kategoriyi sıfırla
    }
    if (type === 'category') setSelectedCategory(value);
    if (type === 'carBrand') setSelectedCarBrand(value);
    
    // Filter değişince sayfa numarasını sıfırla
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback(() => {
    // Güvenlik: Input'ları sanitize et
    const sanitizedParams = {
      city: sanitizeInput(selectedCity),
      district: sanitizeInput(selectedDistrict),
      service: sanitizeInput(selectedService),
      category: sanitizeInput(selectedCategory),
      carBrand: sanitizeInput(selectedCarBrand)
    };
    
    // Güvenlik: Parametreleri validate et
    if (!validateSearchParams(sanitizedParams)) {
      setError("Geçersiz arama parametreleri");
      return;
    }
    
    const params = new URLSearchParams();
    if (sanitizedParams.city) params.set('city', sanitizedParams.city);
    if (sanitizedParams.district) params.set('district', sanitizedParams.district);
    if (sanitizedParams.service) params.set('service', sanitizedParams.service);
    if (sanitizedParams.category) params.set('category', sanitizedParams.category);
    if (sanitizedParams.carBrand) params.set('carBrand', sanitizedParams.carBrand);
    
    // Güvenlik: URL'i encode et
    const safeUrl = `/musteri/arama-sonuclari?${params.toString()}`;
    router.push(safeUrl);
    
    // Arama yapıldığında sayfa numarasını sıfırla
    setCurrentPage(1);
  }, [selectedCity, selectedDistrict, selectedService, selectedCategory, selectedCarBrand, router]);

  // Pagination fonksiyonları
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    
    // URL'e page parametresi ekle
    const params = new URLSearchParams();
    if (selectedCity) params.set('city', selectedCity);
    if (selectedDistrict) params.set('district', selectedDistrict);
    if (selectedService) params.set('service', selectedService);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCarBrand) params.set('carBrand', selectedCarBrand);
    params.set('page', page.toString());
    
    router.push(`/musteri/arama-sonuclari?${params.toString()}`);
  }, [selectedCity, selectedDistrict, selectedService, selectedCategory, selectedCarBrand, router]);

  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  }, [hasNextPage, currentPage, handlePageChange]);

  const handlePreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      handlePageChange(currentPage - 1);
    }
  }, [hasPreviousPage, currentPage, handlePageChange]);

  // Memoized vendor list with virtualization for high traffic
  const vendorList = useMemo(() => 
    vendors.map((vendor, index) => (
      <VendorCard 
        key={`${vendor.id}-${index}`} 
        vendor={vendor} 
      />
    )), 
    [vendors]
  );

  return (
    <div className="musteri-page-container">
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 200px)' }}>
          {/* Sol Sütun - Filtreler */}
          <div className="musteri-filters-sidebar">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Filtreler</h3>
            
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#1976d2'
            }}>
              💡 <strong>İpucu:</strong> Hizmet ve araba markası seçerek, o hizmeti o marka için veren esnafları bulabilirsiniz.
            </div>

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

            <FilterSelect
              label="Araba Markası"
              value={selectedCarBrand}
              onChange={(value) => handleFilterChange('carBrand', value)}
              options={carBrandOptions}
              placeholder="Marka seçiniz"
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
          {/* Sonuçlar */}
                  <div className="musteri-search-results-container">
          {/* Arama sorgusu göster */}
          {searchQuery && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: '1rem', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '8px',
              border: '1px solid #bbdefb'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: '#1976d2' }}>🔍</span>
                <strong>Arama Sorgusu:</strong>
                <span style={{ 
                  color: '#1976d2', 
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #bbdefb'
                }}>
                  "{searchQuery}"
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#1976d2' }}>
                Büyük/küçük harf duyarsız arama yapılıyor • Türkçe karakter desteği mevcut
              </div>
            </div>
          )}
          
          {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div className="musteri-loading-spinner"></div>
                  <div>Aranıyor...</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {searchQuery ? `"${searchQuery}" için sonuçlar aranıyor...` : 'Sonuçlar yükleniyor...'}
                  </div>
                </div>
              </div>
            ) : error ? (
              <div style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>
                {error}
              </div>
            ) : vendors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                  {searchQuery ? `"${searchQuery}" için sonuç bulunamadı` : 'Sonuç bulunamadı'}
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  {searchQuery ? (
                    <>
                      <div>"{searchQuery}" için arama sonucu bulunamadı.</div>
                      <div style={{ marginTop: '0.5rem' }}>Farklı kelimeler deneyin veya filtreleri değiştirin.</div>
                    </>
                  ) : (
                    'Filtreleri değiştirmeyi deneyin.'
                  )}
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem', color: '#666' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>{totalCount} sonuç bulundu</span>
                    {searchQuery && (
                      <>
                        <span style={{ color: '#666' }}>•</span>
                        <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                          "{searchQuery}" için
                        </span>
                      </>
                    )}
                    {totalPages > 1 && (
                      <>
                        <span style={{ color: '#666' }}>•</span>
                        <span>Sayfa {currentPage} / {totalPages}</span>
                      </>
                    )}
                  </div>
                  {searchQuery && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '0.9rem', 
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      Büyük/küçük harf duyarsız arama yapılıyor
                    </div>
                  )}
                </div>
                
                <div className="musteri-search-results">
                  {vendorList}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="musteri-pagination">
                    <button 
                      onClick={handlePreviousPage} 
                      disabled={!hasPreviousPage}
                      className="musteri-pagination-btn"
                    >
                      Önceki
                    </button>
                    
                    {/* Sayfa numaraları */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`musteri-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button 
                      onClick={handleNextPage} 
                      disabled={!hasNextPage}
                      className="musteri-pagination-btn"
                    >
                      Sonraki
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
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